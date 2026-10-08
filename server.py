"""
server.py — FastAPI Backend for Government AI Legal & Scheme Compliance Platform
Provides REST endpoints for the React frontend, calling all existing Python AI engines.
"""
import os
import json
import tempfile
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

import config
import database as db
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

app = FastAPI(title="Government AI Legal & Compliance Platform API", version="2.0")

# Enable CORS for React frontend (Vite runs on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth Models & Endpoints ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    session = db.SessionLocal()
    user = session.query(db.User).filter_by(email=req.email).first()
    session.close()
    if user and db.verify_password(req.password, user.password_hash):
        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }
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
        role="user"
    )
    session.add(new_user)
    session.commit()
    user_id = new_user.id
    session.close()
    return {"success": True, "message": "Account created successfully.", "user_id": user_id}

# ─── Document Processing / Upload ─────────────────────────────────────────────
@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("contract"),
    user_id: Optional[int] = Form(1),
    ai_mode: str = Form("fast")
):
    suffix = os.path.splitext(file.filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        session = db.SessionLocal()
        new_doc = db.Document(user_id=user_id, filename=file.filename, doc_type=doc_type)
        session.add(new_doc)
        session.commit()
        doc_id = new_doc.id

        # OCR & Ingestion
        result = ingestion.process_document(tmp_path, doc_id)
        # Save original uploaded PDF for visual redlining & preview
        orig_pdf_path = os.path.join(result["index_dir"], "original.pdf")
        with open(orig_pdf_path, "wb") as f_orig:
            f_orig.write(contents)
        pages = ingestion.extract_text_from_pdf(tmp_path)
        full_text = "\n".join([ingestion.preprocess_text(p["text"]) for p in pages])

        # Unified AI Analysis Call (1 single API request for summary, clauses, risks & entities)
        audit = analysis.analyze_document_complete(full_text, mode=ai_mode)
        summary = audit.get("summary", "")
        clauses = audit.get("clauses", [])
        risks = audit.get("risks", [])
        entities = audit.get("entities", {})

        new_doc.page_count = result["page_count"]
        new_doc.summary = summary
        new_doc.risks = json.dumps(risks)
        new_doc.clauses = json.dumps(clauses)
        new_doc.entities = json.dumps(entities)
        new_doc.faiss_index_path = result["index_dir"]
        session.commit()
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
                "full_text": full_text
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

# ─── Chat / Q&A ───────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    index_dir: str
    doc_id: Optional[int] = None
    user_id: Optional[int] = 1
    ai_mode: str = "fast"

@app.post("/api/chat")
def chat_with_doc(req: ChatRequest):
    if not os.path.exists(req.index_dir):
        raise HTTPException(status_code=400, detail="Document index directory not found.")
    result = rag.ask_question(req.question, req.index_dir, mode=req.ai_mode)

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

    orig_pdf_path = os.path.join(doc.faiss_index_path or "", "original.pdf")
    pdf_bytes = b""

    if os.path.exists(orig_pdf_path):
        pdf_bytes = redline_generator.generate_redlined_pdf(orig_pdf_path, risks)
    else:
        chunks_path = os.path.join(doc.faiss_index_path or "", "chunks.json")
        if os.path.exists(chunks_path):
            with open(chunks_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)
            pdf_bytes = redline_generator.generate_fallback_pdf_from_text(chunks, risks)

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
        headers={"Content-Disposition": f'inline; filename="redlined_{filename}"'}
    )

@app.get("/api/redline/download-pdf/{doc_id}")
def download_redline_pdf(doc_id: int):
    """Downloads the visual redlined PDF with strikethrough lines on risky clauses."""
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
def get_user_documents(user_id: int = None):
    session = db.SessionLocal()
    query = session.query(db.Document)
    if user_id:
        user_docs = query.filter_by(user_id=user_id).order_by(db.Document.uploaded_at.desc()).all()
        if user_docs:
            docs = user_docs
        else:
            docs = session.query(db.Document).order_by(db.Document.uploaded_at.desc()).all()
    else:
        docs = query.order_by(db.Document.uploaded_at.desc()).all()

    results = []
    for d in docs:
        full_text = ""
        if d.faiss_index_path:
            chunks_path = os.path.join(d.faiss_index_path, "chunks.json")
            if os.path.exists(chunks_path):
                try:
                    with open(chunks_path, "r", encoding="utf-8") as f:
                        chunks_data = json.load(f)
                        full_text = "\n".join([c.get("text", "") for c in chunks_data])
                except Exception:
                    pass

        results.append({
            "id": d.id,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "page_count": d.page_count,
            "summary": d.summary,
            "risks": json.loads(d.risks) if d.risks else [],
            "clauses": json.loads(d.clauses) if d.clauses else [],
            "entities": json.loads(d.entities) if d.entities else {},
            "index_dir": d.faiss_index_path,
            "full_text": full_text,
            "uploaded_at": d.uploaded_at.strftime("%b %d, %Y")
        })
    session.close()
    return {"documents": results}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
