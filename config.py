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

# Auto-detect cloud hosting (Render sets RENDER=true or PORT in env)
IS_CLOUD          = os.getenv("RENDER", "").lower() == "true" or "PORT" in os.environ
DEFAULT_AI_MODE   = "fast" if IS_CLOUD else "secure"

# AI Mode: "secure" (local Ollama) or "fast" (Gemini API)
AI_MODE           = os.getenv("AI_MODE", DEFAULT_AI_MODE).lower()
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL      = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# ─── Subscription & Usage Limits (Configurable) ──────────────────────────────
FREE_MONTHLY_UPLOADS       = int(os.getenv("FREE_MONTHLY_UPLOADS", "5"))
PERSONAL_MONTHLY_UPLOADS   = int(os.getenv("PERSONAL_MONTHLY_UPLOADS", "30"))
BUSINESS_MONTHLY_UPLOADS   = int(os.getenv("BUSINESS_MONTHLY_UPLOADS", "100"))

PERSONAL_MONTHLY_PRICE     = int(os.getenv("PERSONAL_MONTHLY_PRICE", "49"))
PERSONAL_ANNUAL_PRICE      = int(os.getenv("PERSONAL_ANNUAL_PRICE", "499"))

BUSINESS_MONTHLY_PRICE     = int(os.getenv("BUSINESS_MONTHLY_PRICE", "149"))
BUSINESS_ANNUAL_PRICE      = int(os.getenv("BUSINESS_ANNUAL_PRICE", "1499"))

# AI Question Limits per period (Rate limits to prevent model/API overuse)
FREE_AI_QUERY_LIMIT        = int(os.getenv("FREE_AI_QUERY_LIMIT", "15"))
PERSONAL_AI_QUERY_LIMIT    = int(os.getenv("PERSONAL_AI_QUERY_LIMIT", "60"))
BUSINESS_AI_QUERY_LIMIT    = int(os.getenv("BUSINESS_AI_QUERY_LIMIT", "250"))

# ─── Payment Gateway (Razorpay) ──────────────────────────────────────────────
RAZORPAY_KEY_ID            = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET        = os.getenv("RAZORPAY_KEY_SECRET", "rzp_secret_placeholder")
RAZORPAY_WEBHOOK_SECRET    = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_placeholder")
