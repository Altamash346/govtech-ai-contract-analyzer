"""
ingestion.py — Full document processing pipeline.
Steps: Upload → Detect Scanned → OCR (if needed) → Extract Text → 
       Preprocess → Chunk → Embed → Store in FAISS
"""
import os
import re
import json

# Suppress transformers optional model eager loading (avoids torchvision import errors)
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import fitz  # PyMuPDF
import faiss
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import config

# Load the embedding model once (cached after first load)
_embedder = None


def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(config.EMBEDDING_MODEL)
    return _embedder


# ─── Step 1: Detect if PDF is Scanned ─────────────────────────────────────────

def is_scanned_pdf(pdf_path: str) -> bool:
    """Returns True if the PDF contains no extractable text (i.e., it's a scanned image)."""
    doc = fitz.open(pdf_path)
    total_text = ""
    for page in doc:
        total_text += page.get_text()
    doc.close()
    return len(total_text.strip()) < 100


# ─── Step 2a: Extract Text from Native PDF ────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text from each page of a native PDF.
    Returns: list of dicts with 'page' and 'text' keys.
    """
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append({"page": i + 1, "text": text})
    doc.close()
    return pages


# ─── Step 2b: OCR for Scanned PDFs ────────────────────────────────────────────

def extract_text_via_ocr(pdf_path: str) -> list[dict]:
    """
    Use pytesseract OCR to extract text from scanned PDFs.
    Requires Tesseract to be installed on the system.
    """
    try:
        import pytesseract
        from PIL import Image
        import io

        doc = fitz.open(pdf_path)
        pages = []
        for i, page in enumerate(doc):
            # Render page as image
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR accuracy
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            text = pytesseract.image_to_string(img)
            if text.strip():
                pages.append({"page": i + 1, "text": text})
        doc.close()
        return pages
    except Exception as e:
        return [{"page": 1, "text": f"OCR Error: {str(e)}. Please install Tesseract OCR."}]


# ─── Step 3: Preprocess Text ─────────────────────────────────────────────────

def preprocess_text(text: str) -> str:
    """
    Clean extracted text:
    - Remove excessive whitespace and newlines
    - Remove standalone page numbers
    - Strip common header/footer patterns
    """
    # Remove lines that are only numbers (page numbers)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    # Collapse multiple newlines into one
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove excessive spaces
    text = re.sub(r' {3,}', ' ', text)
    return text.strip()


# ─── Step 4: Chunk Text ───────────────────────────────────────────────────────

def chunk_pages(pages: list[dict], chunk_size: int = 800, overlap: int = 100) -> list[dict]:
    """
    Split page texts into overlapping chunks while retaining page metadata.
    Returns: list of dicts with 'chunk_id', 'page', 'text' keys.
    """
    chunks = []
    chunk_id = 0
    for page_data in pages:
        page_num = page_data["page"]
        text = preprocess_text(page_data["text"])
        words = text.split()

        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text = " ".join(words[start:end])
            chunks.append({
                "chunk_id": chunk_id,
                "page": page_num,
                "text": chunk_text
            })
            chunk_id += 1
            start += chunk_size - overlap  # Sliding window with overlap

    return chunks


# ─── Step 5: Generate Embeddings & Store in FAISS ────────────────────────────

def build_faiss_index(chunks: list[dict], index_dir: str) -> str:
    """
    Generate embeddings for all chunks and save them to a FAISS index.
    Returns: path to the saved index directory.
    """
    embedder = get_embedder()
    texts = [c["text"] for c in chunks]

    # Generate embeddings
    embeddings = embedder.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings).astype("float32")

    # Build FAISS index
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    # Save index and chunk metadata to disk
    Path(index_dir).mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, os.path.join(index_dir, "index.faiss"))
    with open(os.path.join(index_dir, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    return index_dir


# ─── Master Pipeline Function ─────────────────────────────────────────────────

def process_document(pdf_path: str, doc_id: int) -> dict:
    """
    Full ingestion pipeline for a single PDF.
    Returns: dict with 'index_dir', 'page_count', 'chunk_count'
    """
    # Detect if scanned
    scanned = is_scanned_pdf(pdf_path)

    # Extract text (with or without OCR)
    if scanned:
        pages = extract_text_via_ocr(pdf_path)
    else:
        pages = extract_text_from_pdf(pdf_path)

    page_count = len(pages)

    # Chunk the extracted pages
    chunks = chunk_pages(pages)

    # Build and store FAISS index
    index_dir = os.path.join(config.FAISS_INDEX_PATH, str(doc_id))
    build_faiss_index(chunks, index_dir)

    return {
        "index_dir": index_dir,
        "page_count": page_count,
        "chunk_count": len(chunks),
        "used_ocr": scanned
    }
