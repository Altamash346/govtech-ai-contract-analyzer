"""
config.py — Central configuration loaded from .env
"""
import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL      = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
EMBEDDING_MODEL   = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
FAISS_INDEX_PATH  = os.getenv("FAISS_INDEX_PATH", "./vector_store")
DATABASE_URL      = os.getenv("DATABASE_URL", "sqlite:///./app.db")
APP_SECRET_KEY    = os.getenv("APP_SECRET_KEY", "change-me")

# AI Mode: "secure" (local Ollama) or "fast" (Gemini API)
AI_MODE           = os.getenv("AI_MODE", "secure").lower()   # default: secure
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL      = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
