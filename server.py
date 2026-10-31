"""
server.py — FastAPI Backend for Government AI Legal & Scheme Compliance Platform
Provides REST endpoints for the React frontend, calling all existing Python AI engines.
"""
import os
import json
import secrets
import tempfile
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

import config
import database as db
import subscription_service
import email_service
import ingestion
import analysis
import rag
import report_generator
import scheme_loader
import multi_agent
import knowledge_graph
import redline_generator
import multilingual

# Initialize DB on startup
db.init_db()

app = FastAPI(title="NyayaMitra AI — Legal & Welfare Intelligence API", version="2.0")

# Enable CORS for React frontend (Vite runs on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health & Root Endpoints for Render Health Checks ─────────────────────────
@app.get("/")
@app.get("/health")
@app.get("/api/health")
@app.get("/api/dashboard")
def health():
    return {
        "status": "ok",
        "app": "NyayaMitra AI",
        "version": "2.0",
        "schemes_count": 96,
        "languages_count": 22
    }

# ─── Auth Models & Endpoints ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class FirebaseAuthRequest(BaseModel):
    uid: str
    email: str
    name: Optional[str] = "Citizen User"

class SendCodeRequest(BaseModel):
    email: str
    purpose: Optional[str] = "login"  # "login", "register", "verify"

class VerifyCodeRequest(BaseModel):
    email: str
    code: str
    purpose: Optional[str] = "login"
    name: Optional[str] = None

@app.post("/api/auth/send-verification-code")
def send_verification_code(req: SendCodeRequest):
    """
    Generates a secure 6-digit verification code and emails it to the user.
    Falls back gracefully to local developer sandbox mode if SMTP is not configured.
    """
    email = req.email.strip().lower()
    if not email or "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    session = db.SessionLocal()
    try:
        # Invalidate previous unused codes for this email and purpose
        session.query(db.EmailVerification).filter(
            db.EmailVerification.email == email,
            db.EmailVerification.purpose == req.purpose,
            db.EmailVerification.is_used == False
        ).update({"is_used": True})

        # Generate secure 6-digit code
        code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        record = db.EmailVerification(
            email=email,
            code=code,
            purpose=req.purpose,
            expires_at=expires_at,
            is_used=False
        )
        session.add(record)
        session.commit()

        # Send via email service (SMTP or dev sandbox)
        res = email_service.send_verification_email(email, code, req.purpose)
        return {
            "success": True,
            "message": res.get("message", f"Verification code sent to {email}"),
            "dev_mode": res.get("dev_mode", False),
            "dev_code": res.get("code") if res.get("dev_mode") else None,
            "expires_in_seconds": 600
        }
    finally:
        session.close()

@app.post("/api/auth/verify-code")
def verify_code(req: VerifyCodeRequest):
    """
    Verifies the 6-digit email verification code.
    If valid, marks email as verified and signs the user in (or auto-registers new account).
    """
    email = req.email.strip().lower()
    code = req.code.strip()

    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and 6-digit verification code are required.")

    session = db.SessionLocal()
    try:
        now = datetime.utcnow()
        record = session.query(db.EmailVerification).filter(
            db.EmailVerification.email == email,
            db.EmailVerification.code == code,
            db.EmailVerification.is_used == False,
            db.EmailVerification.expires_at > now
        ).order_by(db.EmailVerification.id.desc()).first()

        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code. Please request a new code.")

        # Mark code as consumed
        record.is_used = True

        # Check existing user or auto-provision
        user = session.query(db.User).filter_by(email=email).first()
        if not user:
            name = req.name or email.split("@")[0].title()
            user = db.User(
                name=name,
                email=email,
                password_hash=db.hash_password(f"email_verified_{secrets.token_hex(16)}"),
                role="user",
                is_verified=True
            )
            session.add(user)
            session.commit()
            subscription_service.get_or_create_user_subscription(session, user.id)
        else:
            user.is_verified = True
            if req.name and (not user.name or user.name == "Citizen User"):
                user.name = req.name
            session.commit()

        subscription_service.get_or_create_user_subscription(session, user.id)

        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": bool(user.is_verified)
        }
        return {
            "success": True,
            "message": "Email verified successfully!",
            "user": user_data
        }
    finally:
        session.close()

@app.post("/api/auth/firebase")
def firebase_auth(req: FirebaseAuthRequest):
    if not req.email:
        raise HTTPException(status_code=400, detail="Email is required.")
    session = db.SessionLocal()
    user = session.query(db.User).filter_by(email=req.email).first()
    if not user:
        user = db.User(
            name=req.name or req.email.split("@")[0].title(),
            email=req.email,
            password_hash=db.hash_password(f"firebase_{req.uid}"),
            role="user",
            is_verified=True
        )
        session.add(user)
        session.commit()
    subscription_service.get_or_create_user_subscription(session, user.id)
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "firebase_uid": req.uid,
        "is_verified": bool(user.is_verified)
    }
    session.close()
    return {"success": True, "user": user_data}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    session = db.SessionLocal()
    user = session.query(db.User).filter_by(email=req.email).first()
    if user and db.verify_password(req.password, user.password_hash):
        subscription_service.get_or_create_user_subscription(session, user.id)
        session.close()
        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_verified": bool(user.is_verified)
            }
        }
    session.close()
    raise HTTPException(status_code=401, detail="Invalid email or password.")

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    if not req.name or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="All fields required.")
    session = db.SessionLocal()
    existing = session.query(db.User).filter_by(email=req.email).first()
    if existing:
        session.close()
        raise HTTPException(status_code=400, detail="Email already registered.")
    new_user = db.User(
        name=req.name,
        email=req.email,
        password_hash=db.hash_password(req.password),
        role="user",
        is_verified=False
    )
    session.add(new_user)
    session.commit()
    user_id = new_user.id
    subscription_service.get_or_create_user_subscription(session, user_id)
    user_data = {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "is_verified": False
    }
    session.close()
    return {"success": True, "message": "Account created successfully.", "user_id": user_id, "user": user_data}

class SaveFirebaseConfigRequest(BaseModel):
    apiKey: str
    authDomain: Optional[str] = ""
    projectId: Optional[str] = ""
    storageBucket: Optional[str] = ""
    messagingSenderId: Optional[str] = ""
    appId: Optional[str] = ""

@app.post("/api/auth/save-firebase-config")
def save_firebase_config(req: SaveFirebaseConfigRequest):
    """Saves real Firebase client configuration into frontend/.env for Google OAuth."""
    env_path = os.path.join(os.path.dirname(__file__), "frontend", ".env")
    lines = [
        "# JanDrishti Frontend Environment Variables",
        "VITE_API_BASE=http://localhost:8001/api",
        f"VITE_FIREBASE_API_KEY={req.apiKey.strip()}",
        f"VITE_FIREBASE_AUTH_DOMAIN={req.authDomain.strip()}",
        f"VITE_FIREBASE_PROJECT_ID={req.projectId.strip()}",
        f"VITE_FIREBASE_STORAGE_BUCKET={req.storageBucket.strip()}",
        f"VITE_FIREBASE_MESSAGING_SENDER_ID={req.messagingSenderId.strip()}",
        f"VITE_FIREBASE_APP_ID={req.appId.strip()}",
    ]
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return {"success": True, "message": "Firebase configuration saved successfully to frontend/.env"}

# ─── Document Processing / Upload ─────────────────────────────────────────────
@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("contract"),
    user_id: int = Form(...),
    ai_mode: str = Form("fast")
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in to upload documents.")
    
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    file_hash = subscription_service.compute_file_hash(contents)

    # 1. Strict Server-Side Quota Verification before starting expensive AI processing
    session = db.SessionLocal()
    try:
        subscription_service.verify_and_reserve_upload_quota(session, user_id, file_hash, file.filename)
    except Exception:
        session.close()
        raise

    suffix = os.path.splitext(file.filename)[1] or ".pdf"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        new_doc = db.Document(user_id=user_id, filename=file.filename, doc_type=doc_type, file_hash=file_hash)
        session.add(new_doc)
        session.commit()
        doc_id = new_doc.id

        # OCR & Ingestion (Extracts every page with hybrid digital + OCR)
        result = ingestion.process_document(tmp_path, doc_id)
        # Save original uploaded PDF for visual redlining & preview
        orig_pdf_path = os.path.join(result["index_dir"], "original.pdf")
        with open(orig_pdf_path, "wb") as f_orig:
            f_orig.write(contents)
        pages = result.get("pages", [])
        full_text = result.get("full_text") or "\n\n".join([f"--- [Page {p['page']}] ---\n" + ingestion.preprocess_text(p["text"]) for p in pages if p["text"] != "[Blank / Non-text page]"])

        # Layer 1: Sovereign Client-Side PII De-Identification (DPDP Act 2023)
        sanitized_text, pii_meta = ingestion.anonymize_pii(full_text)

        # Unified AI Analysis Call (uses sanitized text so cloud never sees real citizen PII)
        audit = analysis.analyze_document_complete(sanitized_text, mode=ai_mode)
        summary = audit.get("summary", "")
        clauses = audit.get("clauses", [])
        risks = audit.get("risks", [])
        entities = audit.get("entities", {})
        # Keep pure entities dict separate from security shield telemetry
        entities.pop("pii_shield", None)
        pii_shield_data = {
            "shield_active": True,
            "total_scrubbed": pii_meta.get("total_scrubbed", 0),
            "breakdown": pii_meta.get("breakdown", {})
        }

        new_doc.page_count = result["page_count"]
        new_doc.summary = summary
        new_doc.risks = json.dumps(risks)
        new_doc.clauses = json.dumps(clauses)
        new_doc.entities = json.dumps(entities)
        new_doc.faiss_index_path = result["index_dir"]
        session.commit()

        # 2. Record successful upload: only called once the document is ingested & saved
        # Failed uploads that raise exceptions will never reach this call!
        subscription_service.record_successful_upload(session, user_id, file_hash)
        usage_info = subscription_service.get_user_usage_summary(session, user_id)
        session.close()

        return {
            "success": True,
            "document": {
                "id": doc_id,
                "filename": file.filename,
                "doc_type": doc_type,
                "page_count": result["page_count"],
                "index_dir": result["index_dir"],
                "summary": summary,
                "risks": risks,
                "clauses": clauses,
                "entities": entities,
                "pii_shield": pii_shield_data,
                "full_text": full_text
            },
            "usage": usage_info
        }
    except Exception as e:
        session.rollback()
        session.close()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

def resolve_index_dir(index_dir: Optional[str] = None, doc_id: Optional[int] = None) -> Optional[str]:
    """
    Finds the actual FAISS index directory on disk across Windows and Linux path representations,
    handling relative paths, forward/backward slashes, and looking up via doc_id if needed.
    """
    candidates = []
    project_root = os.path.dirname(os.path.abspath(__file__))

    if index_dir:
        # Standardize slashes for current OS
        clean = str(index_dir).replace("\\", os.sep).replace("/", os.sep)
        candidates.append(clean)
        candidates.append(os.path.abspath(clean))
        candidates.append(os.path.normpath(os.path.join(project_root, clean)))
        candidates.append(os.path.normpath(os.path.join(project_root, "vector_store", os.path.basename(clean))))
    
    if doc_id:
        candidates.append(os.path.normpath(os.path.join(project_root, "vector_store", str(doc_id))))
        candidates.append(os.path.normpath(os.path.join(config.FAISS_INDEX_PATH, str(doc_id))))

    for c in candidates:
        if c and os.path.exists(c) and os.path.isdir(c):
            return c
    return None

# ─── Chat / Q&A ───────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    index_dir: Optional[str] = ""
    doc_id: Optional[int] = None
    user_id: Optional[int] = 1
    ai_mode: str = "fast"

@app.post("/api/chat")
def chat_with_doc(req: ChatRequest):
    # Enforce AI Question usage limit per billing period
    if req.user_id:
        session = db.SessionLocal()
        try:
            subscription_service.check_and_increment_ai_query(session, req.user_id)
        finally:
            session.close()

    actual_index_dir = resolve_index_dir(req.index_dir, req.doc_id)

    if actual_index_dir and os.path.exists(os.path.join(actual_index_dir, "chunks.json")):
        result = rag.ask_question(req.question, actual_index_dir, mode=req.ai_mode)
    elif req.doc_id:
        # Graceful fallback: synthesize answer directly from document summary, clauses, and risks in app.db
        session = db.SessionLocal()
        doc = session.query(db.Document).filter_by(id=req.doc_id).first()
        if not doc:
            session.close()
            raise HTTPException(status_code=404, detail="Document not found.")

        context_parts = []
        if doc.summary:
            context_parts.append(f"Document Summary:\n{doc.summary}")
        if doc.clauses:
            try:
                c_list = json.loads(doc.clauses)
                for c in c_list:
                    context_parts.append(f"Clause: {c.get('title', '')} — {c.get('text', '')}")
            except Exception:
                pass
        if doc.risks:
            try:
                r_list = json.loads(doc.risks)
                for r in r_list:
                    context_parts.append(f"Flagged Risk ({r.get('level', '')}): {r.get('clause', '')} - {r.get('explanation', '')}")
            except Exception:
                pass

        # Auto-heal vector store chunks on disk if folder/chunks were missing
        try:
            heal_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store", str(req.doc_id))
            os.makedirs(heal_dir, exist_ok=True)
            chunks_file = os.path.join(heal_dir, "chunks.json")
            if not os.path.exists(chunks_file):
                recovered_chunks = []
                for i, part in enumerate(context_parts):
                    recovered_chunks.append({"page": 1, "chunk_id": i + 1, "text": part})
                with open(chunks_file, "w", encoding="utf-8") as f_heal:
                    json.dump(recovered_chunks, f_heal, ensure_ascii=False)
        except Exception as e_heal:
            print(f"[chat] Auto-heal index notice: {e_heal}")

        context_text = "\n\n".join(context_parts) if context_parts else (doc.summary or "General Legal Contract")
        result = rag.ask_question_with_context(req.question, context_text, citations=[1], mode=req.ai_mode)
        session.close()
    elif actual_index_dir:
        result = rag.ask_question(req.question, actual_index_dir, mode=req.ai_mode)
    else:
        raise HTTPException(
            status_code=400,
            detail="Document index not found on disk. Please re-upload or select the document from your audit history."
        )

    if req.doc_id:
        session = db.SessionLocal()
        session.add(db.QAHistory(
            user_id=req.user_id,
            document_id=req.doc_id,
            question=req.question,
            answer=result["answer"],
            citations=json.dumps(result["citations"])
        ))
        session.commit()
        session.close()

    return result

# ─── Multi-Agent Legal Debate ────────────────────────────────────────────────
class MultiAgentRequest(BaseModel):
    contract_text: str
    ai_mode: Optional[str] = "fast"

@app.post("/api/multi-agent")
def run_debate(req: MultiAgentRequest):
    result = multi_agent.run_multi_agent_analysis(req.contract_text, mode=req.ai_mode)
    return result

# ─── Knowledge Graph ──────────────────────────────────────────────────────────
class KGRequest(BaseModel):
    text: str

@app.post("/api/knowledge-graph")
def get_knowledge_graph(req: KGRequest):
    result = knowledge_graph.extract_knowledge_graph(req.text)
    return result

# ─── Visual Redline PDF Endpoints ─────────────────────────────────────────────
def _get_redlined_pdf_bytes(doc_id: int) -> tuple[bytes, str]:
    session = db.SessionLocal()
    doc = session.query(db.Document).filter_by(id=doc_id).first()
    if not doc:
        session.close()
        raise HTTPException(status_code=404, detail="Document not found")

    risks = json.loads(doc.risks) if doc.risks else []
    filename = doc.filename or f"contract_{doc_id}.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"

    actual_dir = resolve_index_dir(doc.faiss_index_path, doc.id)
    cached_redline_path = os.path.join(actual_dir or "", "redlined.pdf")

    # 1. Fast Cache Hit: serve pre-generated redlined PDF immediately in <10ms
    if actual_dir and os.path.exists(cached_redline_path):
        try:
            with open(cached_redline_path, "rb") as f:
                cached_bytes = f.read()
            if len(cached_bytes) > 500:
                session.close()
                return cached_bytes, filename
        except Exception as cache_read_err:
            logger.warning(f"Error reading cached redlined.pdf: {cache_read_err}")

    orig_pdf_path = os.path.join(actual_dir or "", "original.pdf")
    pdf_bytes = b""

    # Load chunks if available to assist fast page lookup
    chunks = None
    chunks_path = os.path.join(actual_dir or "", "chunks.json")
    if actual_dir and os.path.exists(chunks_path):
        try:
            with open(chunks_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)
        except Exception:
            chunks = None

    if actual_dir and os.path.exists(orig_pdf_path):
        pdf_bytes = redline_generator.generate_redlined_pdf(orig_pdf_path, risks, chunks_data=chunks)
    else:
        if chunks:
            pdf_bytes = redline_generator.generate_fallback_pdf_from_text(chunks, risks)
        else:
            # Fallback using clauses and summary if raw PDF not cached on disk
            fallback_chunks = [{"page": 1, "text": doc.summary or "Contract Agreement"}]
            if doc.clauses:
                try:
                    c_list = json.loads(doc.clauses)
                    for c in c_list:
                        fallback_chunks.append({"page": 1, "text": f"{c.get('title', '')}: {c.get('text', '')}"})
                except Exception:
                    pass
            pdf_bytes = redline_generator.generate_fallback_pdf_from_text(fallback_chunks, risks)

    # Cache on disk so subsequent iframe views and downloads are instantaneous
    if actual_dir and pdf_bytes and len(pdf_bytes) > 500:
        try:
            with open(cached_redline_path, "wb") as f:
                f.write(pdf_bytes)
        except Exception as cache_write_err:
            logger.warning(f"Error caching redlined.pdf: {cache_write_err}")

    session.close()
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Failed to generate redlined PDF")
    return pdf_bytes, filename

@app.get("/api/redline/pdf/{doc_id}")
def view_redline_pdf(doc_id: int):
    """Returns the visual redlined PDF for inline browser preview."""
    pdf_bytes, filename = _get_redlined_pdf_bytes(doc_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="redlined_{filename}"',
            "Content-Type": "application/pdf",
            "Content-Security-Policy": "frame-ancestors *",
        }
    )

@app.get("/api/redline/download-pdf/{doc_id}")
def download_redline_pdf(doc_id: int):
    """Downloads the visual redlined PDF with red highlights on risky clauses."""
    pdf_bytes, filename = _get_redlined_pdf_bytes(doc_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="redlined_{filename}"'}
    )

# ─── Multilingual ─────────────────────────────────────────────────────────────
class TranslationRequest(BaseModel):
    text: str
    target_language: str

@app.post("/api/translate")
def translate_content(req: TranslationRequest):
    translated = multilingual.translate_text(req.text, req.target_language)
    return {"translated_text": translated}

@app.post("/api/summarize-lang")
def summarize_content_lang(req: TranslationRequest):
    summary = multilingual.summarize_in_language(req.text, req.target_language)
    return {"summary": summary}

@app.get("/api/languages")
def get_languages():
    return {"languages": multilingual.get_supported_languages()}

# ─── Government Schemes Directory ─────────────────────────────────────────────
@app.get("/api/schemes")
def list_schemes():
    schemes = scheme_loader.ensure_all_schemes_indexed()
    return {"schemes": schemes}

class SchemeEligibilityRequest(BaseModel):
    scheme_text: str
    profile: dict
    ai_mode: str = "fast"

@app.post("/api/schemes/match")
def match_scheme(req: SchemeEligibilityRequest):
    result = analysis.match_scheme_eligibility(req.scheme_text, req.profile, mode=req.ai_mode)
    return result

class SchemeRecommendationRequest(BaseModel):
    profile: dict
    ai_mode: Optional[str] = "fast"

@app.post("/api/schemes/recommend")
def recommend_schemes(req: SchemeRecommendationRequest):
    result = analysis.recommend_schemes_for_profile(req.profile, mode=req.ai_mode)
    return result

# ─── Saved Documents History ──────────────────────────────────────────────────
@app.get("/api/documents")
def get_user_documents(user_id: int):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    session = db.SessionLocal()
    docs = session.query(db.Document).filter_by(user_id=user_id).order_by(db.Document.uploaded_at.desc()).all()

    results = []
    for d in docs:
        full_text = ""
        actual_dir = resolve_index_dir(d.faiss_index_path, d.id)
        if actual_dir:
            chunks_path = os.path.join(actual_dir, "chunks.json")
            if os.path.exists(chunks_path):
                try:
                    with open(chunks_path, "r", encoding="utf-8") as f:
                        chunks_data = json.load(f)
                        full_text = "\n".join([c.get("text", "") for c in chunks_data])
                except Exception:
                    pass

        if not full_text:
            if d.clauses:
                try:
                    c_list = json.loads(d.clauses)
                    full_text = "\n\n".join([f"{c.get('title', '')}\n{c.get('text', '')}" for c in c_list])
                except Exception:
                    pass
            if not full_text:
                full_text = d.summary or ""

        results.append({
            "id": d.id,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "page_count": d.page_count,
            "summary": d.summary,
            "risks": json.loads(d.risks) if d.risks else [],
            "clauses": json.loads(d.clauses) if d.clauses else [],
            "entities": json.loads(d.entities) if d.entities else {},
            "index_dir": actual_dir or d.faiss_index_path or f"./vector_store/{d.id}",
            "full_text": full_text,
            "uploaded_at": d.uploaded_at.strftime("%b %d, %Y")
        })
    session.close()
    return {"documents": results}

# ─── Re-analyze Document with Chosen AI Engine ───────────────────────────────
class ReanalyzeRequest(BaseModel):
    ai_mode: str = "fast"

@app.post("/api/documents/{doc_id}/reanalyze")
def reanalyze_document(doc_id: int, req: ReanalyzeRequest):
    session = db.SessionLocal()
    doc = session.query(db.Document).filter_by(id=doc_id).first()
    if not doc:
        session.close()
        raise HTTPException(status_code=404, detail="Document not found")

    full_text = ""
    actual_dir = resolve_index_dir(doc.faiss_index_path, doc.id)
    if actual_dir:
        chunks_path = os.path.join(actual_dir, "chunks.json")
        orig_pdf = os.path.join(actual_dir, "original.pdf")
        if os.path.exists(chunks_path):
            try:
                with open(chunks_path, "r", encoding="utf-8") as f:
                    chunks_data = json.load(f)
                    full_text = "\n\n".join([f"--- [Page {c.get('page', 1)}] ---\n" + c.get("text", "") for c in chunks_data])
            except Exception:
                full_text = ""
        if not full_text and os.path.exists(orig_pdf):
            pages = ingestion.extract_text_from_pdf(orig_pdf)
            full_text = "\n\n".join([f"--- [Page {p['page']}] ---\n" + ingestion.preprocess_text(p["text"]) for p in pages if p["text"] != "[Blank / Non-text page]"])
            if not doc.page_count or doc.page_count != len(pages):
                doc.page_count = len(pages)
                session.commit()

    if not full_text:
        full_text = doc.summary or "Standard Contract Agreement"

    sanitized_text, pii_meta = ingestion.anonymize_pii(full_text)
    audit = analysis.analyze_document_complete(sanitized_text, mode=req.ai_mode)
    entities = audit.get("entities", {})
    entities.pop("pii_shield", None)
    pii_shield_data = {
        "shield_active": True,
        "total_scrubbed": pii_meta.get("total_scrubbed", 0),
        "breakdown": pii_meta.get("breakdown", {})
    }
    doc.summary = audit["summary"]
    doc.clauses = json.dumps(audit["clauses"])
    doc.risks = json.dumps(audit["risks"])
    doc.entities = json.dumps(entities)
    session.commit()

    # Invalidate stale redline PDF so fresh highlights are generated
    if actual_dir:
        old_redline = os.path.join(actual_dir, "redlined.pdf")
        if os.path.exists(old_redline):
            try:
                os.unlink(old_redline)
            except Exception:
                pass

    updated_doc = {
        "id": doc.id,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "page_count": doc.page_count,
        "summary": audit["summary"],
        "risks": audit["risks"],
        "clauses": audit["clauses"],
        "entities": entities,
        "pii_shield": pii_shield_data,
        "index_dir": doc.faiss_index_path,
        "full_text": full_text
    }
    session.close()
    return {"success": True, "document": updated_doc}

# ─── Download Official AI Audit Report (PDF) ──────────────────────────────────
@app.get("/api/report/download/{doc_id}")
def download_audit_report(doc_id: int):
    session = db.SessionLocal()
    doc = session.query(db.Document).filter_by(id=doc_id).first()
    if not doc:
        session.close()
        raise HTTPException(status_code=404, detail="Document not found")

    risks = json.loads(doc.risks) if doc.risks else []
    clauses = json.loads(doc.clauses) if doc.clauses else []
    entities = json.loads(doc.entities) if doc.entities else {}

    qa_rows = session.query(db.QAHistory).filter_by(document_id=doc_id).all()
    qa_history = [{"question": q.question, "answer": q.answer} for q in qa_rows]
    session.close()

    pdf_bytes = report_generator.generate_report(
        filename=doc.filename,
        doc_type=doc.doc_type or "contract",
        summary=doc.summary or "",
        risks=risks,
        clauses=clauses,
        entities=entities,
        qa_history=qa_history
    )

    clean_filename = f"AI_Audit_Report_{doc_id}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{clean_filename}\""}
    )

# ─── Subscription, Usage & Payment Endpoints ─────────────────────────────────

@app.get("/api/subscription/plans")
def get_subscription_plans():
    """Returns available subscription tiers, pricing, and feature matrices."""
    session = db.SessionLocal()
    try:
        plans = session.query(db.SubscriptionPlan).filter_by(is_active=1).all()
        result = []
        for p in plans:
            result.append({
                "id": p.id,
                "display_name": p.display_name,
                "monthly_price_inr": p.monthly_price_inr,
                "annual_price_inr": p.annual_price_inr,
                "monthly_upload_limit": p.monthly_upload_limit,
                "ai_query_limit": p.ai_query_limit,
                "features": json.loads(p.features_json) if p.features_json else {}
            })
        return {"plans": result}
    finally:
        session.close()

@app.get("/api/subscription/me")
@app.get("/api/subscription/usage")
def get_user_subscription_info(user_id: int):
    """Returns user's current subscription, monthly usage, remaining quota, and renewal dates."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required.")
    session = db.SessionLocal()
    try:
        summary = subscription_service.get_user_usage_summary(session, user_id)
        return summary
    finally:
        session.close()

class CheckoutRequest(BaseModel):
    user_id: int
    plan_id: str
    billing_cycle: Optional[str] = "monthly"

@app.post("/api/subscription/checkout")
def checkout_order(req: CheckoutRequest):
    """Initiates checkout order for Razorpay payment."""
    session = db.SessionLocal()
    try:
        order = subscription_service.create_checkout_order(
            session, req.user_id, req.plan_id, req.billing_cycle or "monthly"
        )
        return order
    finally:
        session.close()

class VerifyPaymentRequest(BaseModel):
    user_id: int
    order_id: str
    payment_id: str
    signature: str

@app.post("/api/subscription/verify-payment")
def verify_payment(req: VerifyPaymentRequest):
    """Verifies HMAC SHA-256 signature and activates paid plan."""
    session = db.SessionLocal()
    try:
        result = subscription_service.activate_verified_subscription(
            session, req.user_id, req.order_id, req.payment_id, req.signature
        )
        return result
    finally:
        session.close()

class CancelSubscriptionRequest(BaseModel):
    user_id: int

@app.post("/api/subscription/cancel")
def cancel_subscription(req: CancelSubscriptionRequest):
    """Cancels paid subscription at period end while preserving access until end date."""
    session = db.SessionLocal()
    try:
        result = subscription_service.cancel_user_subscription(session, req.user_id)
        return result
    finally:
        session.close()

class TestActivateRequest(BaseModel):
    user_id: int
    plan_id: str
    billing_cycle: Optional[str] = "monthly"

@app.post("/api/subscription/test-activate")
def test_activate_subscription(req: TestActivateRequest):
    """Sandbox testing endpoint to simulate plan activation without payment gateway."""
    session = db.SessionLocal()
    try:
        result = subscription_service.test_activate_plan(
            session, req.user_id, req.plan_id, req.billing_cycle or "monthly"
        )
        return result
    finally:
        session.close()

@app.post("/api/payments/webhook")
async def payment_webhook(request: Request):
    """Idempotent Razorpay webhook processor."""
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    session = db.SessionLocal()
    try:
        result = subscription_service.process_webhook_event(session, raw_body, signature)
        return result
    finally:
        session.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
