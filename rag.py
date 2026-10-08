"""
rag.py — Retrieval-Augmented Generation (RAG) engine.
Retrieves relevant FAISS chunks and generates cited answers via
either local Ollama (secure) or Gemini API (fast), based on active AI mode.
"""
import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import config

_embedder = None


def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(config.EMBEDDING_MODEL)
    return _embedder


def _call_llm(prompt: str, mode: str = None) -> str:
    """Route LLM call to fast (cloud) or secure (local)."""
    active_mode = (mode or config.AI_MODE).lower()

    if active_mode == "fast":
        try:
            import google.generativeai as genai
            genai.configure(api_key=config.GEMINI_API_KEY)
            model = genai.GenerativeModel(config.GEMINI_MODEL)
            response = model.generate_content(prompt, request_options={"timeout": 45})
            return response.text.strip()
        except Exception:
            # Fall back to local engine seamlessly without leaking technical details
            try:
                from langchain_ollama import OllamaLLM
                llm = OllamaLLM(model=config.OLLAMA_MODEL, base_url=config.OLLAMA_BASE_URL)
                return llm.invoke(prompt)
            except Exception:
                pass
            return "Unable to complete request with cloud processing. Please try using Slower (secure) mode."
    else:
        try:
            from langchain_ollama import OllamaLLM
            llm = OllamaLLM(model=config.OLLAMA_MODEL, base_url=config.OLLAMA_BASE_URL)
            return llm.invoke(prompt)
        except Exception as e:
            return "Local processing service is currently unavailable. Please verify the local service is running or switch to Faster mode."


def load_faiss_index(index_dir: str):
    """Load the FAISS index and chunk metadata from disk."""
    index_path = os.path.join(index_dir, "index.faiss")
    chunks_path = os.path.join(index_dir, "chunks.json")

    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        raise FileNotFoundError(f"No FAISS index found at {index_dir}. Please process a document first.")

    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)
    return index, chunks


def retrieve_relevant_chunks(question: str, index_dir: str, top_k: int = 5) -> list[dict]:
    """
    Find the top-k most relevant text chunks from the FAISS index for a given question.
    Returns a list of chunk dicts with 'text', 'page', and 'chunk_id'.
    """
    embedder = get_embedder()
    index, chunks = load_faiss_index(index_dir)

    question_embedding = embedder.encode([question])
    question_embedding = np.array(question_embedding).astype("float32")

    distances, indices = index.search(question_embedding, top_k)

    relevant = []
    for i, idx in enumerate(indices[0]):
        if idx < len(chunks):
            chunk = chunks[idx].copy()
            chunk["score"] = float(distances[0][i])
            relevant.append(chunk)

    return relevant


def ask_question(question: str, index_dir: str, mode: str = None) -> dict:
    """
    Full RAG pipeline: Retrieve relevant chunks → Build prompt → Generate cited answer.
    Returns: dict with 'answer' and 'citations'.
    mode: "fast" (Gemini) or "secure" (Ollama). Defaults to config.AI_MODE.
    """
    relevant_chunks = retrieve_relevant_chunks(question, index_dir, top_k=5)

    if not relevant_chunks:
        return {
            "answer": "I could not find relevant information in the document to answer this question.",
            "citations": []
        }

    context_parts = []
    citations = []
    for chunk in relevant_chunks:
        context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
        if chunk["page"] not in citations:
            citations.append(chunk["page"])

    context = "\n\n".join(context_parts)

    prompt = f"""You are an expert legal assistant analyzing a legal document. Answer the user's question accurately, clearly, and thoroughly based on the provided document excerpts.

INSTRUCTIONS:
1. Ground your answer in the facts, clauses, and terms found in the document excerpts below.
2. If the user asks for a summary, overview, or risk assessment, synthesize a clear, helpful response from the relevant clauses and terms provided.
3. Always include page citations in your answer, such as (Page X) or [Page X].
4. Cite verbatim phrases or quotes wherever relevant to support your answer.
5. Only state that information is not found if the document excerpts contain no relevant facts or context related to the question.

DOCUMENT EXCERPTS:
{context}

USER QUESTION: {question}

LEGAL ASSISTANT ANSWER (with citations):"""

    answer = _call_llm(prompt, mode)

    return {
        "answer": answer,
        "citations": citations
    }
