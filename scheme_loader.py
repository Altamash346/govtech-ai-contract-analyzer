"""
scheme_loader.py — Pre-loads and indexes all government schemes from schemes_data/ folder.
Runs automatically on app startup to build FAISS indexes for each scheme.

Supported JSON formats inside schemes_data/:
  - Single scheme per file : { "id": "pm_kisan", ... }
  - Multiple schemes per file : [ { "id": "pm_kisan", ... }, { "id": "mudra_yojana", ... } ]
Both formats can coexist in the same folder.
"""
import os
import json
import faiss
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import config

SCHEMES_DATA_DIR = os.path.join(os.path.dirname(__file__), "schemes_data")
SCHEMES_INDEX_DIR = os.path.join(config.FAISS_INDEX_PATH, "schemes")

_embedder = None


def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(config.EMBEDDING_MODEL)
    return _embedder


def load_all_schemes() -> list[dict]:
    """Load all scheme JSON files from the schemes_data directory.

    Supports two formats:
      - Single scheme per file : a JSON object   { "id": "...", ... }
      - Multiple schemes per file : a JSON array  [ { "id": "..." }, { "id": "..." } ]

    Both formats can coexist inside the same schemes_data/ folder.
    Duplicate scheme IDs across files are skipped with a warning.
    """
    schemes = []
    seen_ids: set[str] = set()

    if not os.path.exists(SCHEMES_DATA_DIR):
        return schemes

    for fname in sorted(os.listdir(SCHEMES_DATA_DIR)):
        if not fname.endswith(".json"):
            continue

        fpath = os.path.join(SCHEMES_DATA_DIR, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"[scheme_loader] WARNING: Skipping {fname} — invalid JSON: {e}")
                continue

        # Normalise: wrap a single object into a list so we process uniformly
        if isinstance(data, dict):
            entries = [data]
        elif isinstance(data, list):
            entries = data
        else:
            print(f"[scheme_loader] WARNING: Skipping {fname} — expected dict or list, got {type(data).__name__}")
            continue

        for entry in entries:
            if not isinstance(entry, dict):
                print(f"[scheme_loader] WARNING: Skipping an entry in {fname} — not a JSON object")
                continue

            scheme_id = entry.get("id")
            if not scheme_id:
                print(f"[scheme_loader] WARNING: Skipping an entry in {fname} — missing 'id' field")
                continue

            if scheme_id in seen_ids:
                print(f"[scheme_loader] WARNING: Duplicate scheme id '{scheme_id}' found in {fname}, skipping")
                continue

            seen_ids.add(scheme_id)
            schemes.append(entry)

    return schemes


def _chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks


def index_scheme(scheme: dict) -> str:
    """
    Build a FAISS index for a single scheme.
    Returns the path to the saved index directory.
    """
    scheme_id = scheme["id"]
    index_dir = os.path.join(SCHEMES_INDEX_DIR, scheme_id)
    marker = os.path.join(index_dir, "index.faiss")

    # Skip if already indexed
    if os.path.exists(marker):
        return index_dir

    os.makedirs(index_dir, exist_ok=True)
    embedder = get_embedder()

    # Chunk the scheme full_text
    raw_chunks = _chunk_text(scheme.get("full_text", ""))
    chunks_meta = [{"chunk_id": i, "page": 1, "text": c} for i, c in enumerate(raw_chunks)]

    texts = [c["text"] for c in chunks_meta]
    embeddings = embedder.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings).astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, os.path.join(index_dir, "index.faiss"))
    with open(os.path.join(index_dir, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(chunks_meta, f, ensure_ascii=False, indent=2)

    return index_dir


def ensure_all_schemes_indexed() -> list[dict]:
    """
    Load all schemes and build their FAISS indexes if not already done.
    Returns the list of scheme metadata dicts (without full_text for performance).
    """
    schemes = load_all_schemes()
    for scheme in schemes:
        idx_dir = index_scheme(scheme)
        scheme["index_dir"] = idx_dir
    return schemes


def get_scheme_by_id(scheme_id: str) -> dict | None:
    """Retrieve a single scheme dict by its ID."""
    schemes = load_all_schemes()
    for s in schemes:
        if s["id"] == scheme_id:
            s["index_dir"] = os.path.join(SCHEMES_INDEX_DIR, scheme_id)
            return s
    return None
