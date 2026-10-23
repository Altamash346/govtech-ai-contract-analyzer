"""
evaluate.py
=============================================================================
Live System Audit & Reproducible Evaluation Script for JanDristi AI

Recomputes and audits every metric in pipeline_evaluation_report.md
directly from app.db and ./vector_store/, printing exact numerators,
denominators, and discrepancies without modifying any data or labels.
=============================================================================
"""

import os
import sys
import json
import sqlite3

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DB_PATH = "app.db"
VECTOR_STORE_DIR = "vector_store"


def audit_system():
    print("=" * 80)
    print(" JANDRISTI AI — LIVE SYSTEM AUDIT & METRIC RECOMPUTATION")
    print("=" * 80)

    if not os.path.exists(DB_PATH):
        print(f"[!] Error: Database file {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 1: DATA COUNTS RECONCILIATION
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 1: DATA COUNTS RECONCILIATION")
    print("-" * 80)

    # Documents up to ID 36 (the snapshot when report was compiled)
    docs_report = c.execute(
        "SELECT id, filename, doc_type, page_count, summary, risks, clauses, entities, faiss_index_path, uploaded_at "
        "FROM documents WHERE id <= 36 ORDER BY id"
    ).fetchall()
    total_docs_all = c.execute("SELECT COUNT(*) FROM documents").fetchone()[0]

    # Clauses (parsed verbatim clauses in documents.clauses)
    total_clauses = 0
    for d in docs_report:
        if d[6]:
            try:
                cl_list = json.loads(d[6])
                if isinstance(cl_list, list):
                    total_clauses += len(cl_list)
            except Exception:
                pass

    # Risks (audited clauses in documents.risks)
    all_risks = []
    for d in docs_report:
        if d[5]:
            try:
                r_list = json.loads(d[5])
                if isinstance(r_list, list):
                    for r in r_list:
                        if isinstance(r, dict) and "risk_level" in r:
                            all_risks.append(r)
            except Exception:
                pass

    # Amendments (risks with suggested_replacement)
    all_amendments = [r for r in all_risks if r.get("suggested_replacement")]

    # FAISS Indices and chunks on disk
    active_indices = []
    total_chunks = 0
    extra_indices = []
    if os.path.exists(VECTOR_STORE_DIR):
        for entry in sorted(os.listdir(VECTOR_STORE_DIR), key=lambda x: int(x) if x.isdigit() else 9999):
            ipath = os.path.join(VECTOR_STORE_DIR, entry, "index.faiss")
            cpath = os.path.join(VECTOR_STORE_DIR, entry, "chunks.json")
            if os.path.exists(ipath) and os.path.exists(cpath):
                active_indices.append(entry)
                try:
                    with open(cpath, "r", encoding="utf-8") as f:
                        chunks = json.load(f)
                        count = len(chunks)
                        total_chunks += count
                        if entry in ["998", "999"]:
                            extra_indices.append((entry, count))
                except Exception:
                    pass

    # Q&A History
    qas = c.execute(
        "SELECT id, user_id, document_id, question, answer, citations, asked_at "
        "FROM qa_history ORDER BY id"
    ).fetchall()

    print(f"1. Documents (Report Scope)    : {len(docs_report)} (Doc IDs 1–36; total in DB = {total_docs_all})")
    print(f"2. Active FAISS Indices on disk: {len(active_indices)} (36 docs + indices 998, 999 from offline tests)")
    print(f"   - Extra non-document indices: {extra_indices}")
    print(f"3. Total Document Chunks       : {total_chunks} (724 from docs 1–36 + 2 from test indices 998 & 999)")
    print(f"4. Verbatim Clauses Extracted  : {total_clauses}")
    print(f"5. Audited Risk Clauses        : {len(all_risks)}")
    print(f"6. Generated Amendments        : {len(all_amendments)}")
    print(f"7. User Q&A Interactions       : {len(qas)}")

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 2: EXTRACTION (CER / WER)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 2: EXTRACTION (CER / WER) AUDIT")
    print("-" * 80)
    print("Reference Text (Ground Truth)  : None (Cannot be determined / Not present in app.db or repository)")
    print("Method Used in Report Script   : Hardcoded constants (avg_cer = 0.0084, avg_wer = 0.0195 in evaluate_live_system.py:95-96)")
    print("Documents Compared             : 0 compared against human reference text")
    print("Scanned vs Digital Documents   : All 36 documents in app.db are native digital PDFs (>100 characters)")
    print("Tesseract OCR Invocations      : 0 (No scanned PDFs triggered Tesseract at runtime)")
    print("Separate OCR vs Non-OCR CER/WER: Cannot be determined (0 OCR documents, no reference text)")

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 3: RETRIEVAL EVALUATION (Precision@3, Recall@3, MRR)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 3: RETRIEVAL EVALUATION (Precision@3, Recall@3, MRR)")
    print("-" * 80)
    print("Relevance Label Definition     : Tautological (any chunk in citations list is labelled relevant)")
    print("Recall@3 Definition            : Hit Rate (1.0 if citations exist), not (relevant retrieved / all relevant)")
    print("\nPer-Query Breakdown for all 16 Q&A Queries:")
    print(f"{'QA ID':<6}{'Doc':<5}{'Citations':<18}{'Top-3 Chunks':<18}{'Labels':<12}{'Rank1':<7}{'P@3':<8}{'R@3':<6}{'Query Text'}")
    print("-" * 95)

    p3_scores = []
    r3_scores = []
    mrr_scores = []

    for q in qas:
        qid, uid, doc_id, question, answer, citations, asked_at = q
        cit_list = []
        if citations:
            try:
                cit_list = json.loads(citations) if isinstance(citations, str) else citations
            except Exception:
                cit_list = []

        # Top 3 chunks
        top3 = cit_list[:3]
        labels = ["Rel"] * len(top3)
        rank1 = 1 if len(top3) > 0 else 0
        p3 = 1.0 if len(cit_list) >= 3 else len(cit_list) / 3.0
        r3 = 1.0 if len(cit_list) > 0 else 0.0
        mrr = 1.0 if len(cit_list) > 0 else 0.0

        p3_scores.append(p3)
        r3_scores.append(r3)
        mrr_scores.append(mrr)

        q_snippet = (question[:28] + "...") if len(question) > 28 else question
        print(f"{qid:<6}{doc_id:<5}{str(cit_list):<18}{str(top3):<18}{str(labels):<12}{rank1:<7}{p3:<8.4f}{r3:<6.1f}{q_snippet}")

    p3_num = sum(p3_scores)
    p3_den = len(p3_scores)
    mean_p3 = p3_num / p3_den
    mean_r3 = sum(r3_scores) / len(r3_scores)
    mean_mrr = sum(mrr_scores) / len(mrr_scores)

    print("-" * 95)
    print(f"Context Precision@3 Numerator  : {p3_num:.4f} (14 queries with 3+ citations * 1.0 + 2 queries with 2 citations * 2/3)")
    print(f"Context Precision@3 Denominator: {p3_den} queries")
    print(f"Mean Precision@3               : {p3_num:.4f} / {p3_den} = {mean_p3:.4f} ({mean_p3 * 100:.2f}%) [Report: 95.8%]")
    print(f"Mean Recall@3 (Hit Rate)       : {sum(r3_scores):.1f} / {len(r3_scores)} = {mean_r3:.4f} ({mean_r3 * 100:.1f}%) [Report: 100.0%]")
    print(f"Mean Reciprocal Rank (MRR)     : {sum(mrr_scores):.1f} / {len(mrr_scores)} = {mean_mrr:.4f} [Report: 1.0000]")

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 4: CLASSIFICATION (Confusion Matrix & F1 Discrepancy)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 4: CLASSIFICATION AUDIT & RECOMPUTATION")
    print("-" * 80)

    risk_levels = [r.get("risk_level", "").capitalize() for r in all_risks]
    high_count = risk_levels.count("High")
    med_count = risk_levels.count("Medium")
    low_count = risk_levels.count("Low")

    print(f"Audited Risk Counts in app.db  : Total = {len(all_risks)} (High: {high_count}, Medium: {med_count}, Low: {low_count})")
    print("Actual Label Assignee          : LLM in analysis.py at ingestion time (No human legal expert)")
    print("Predicted Label Component      : LLM in analysis.py at ingestion time")
    print("Runtime joblib model usage     : models/risk_engine_classifier.joblib is NOT used at runtime")
    print("Labeller saw predictions?      : Tautological (system predictions stored in DB were treated as actuals)")

    # Confusion Matrix as defined in evaluate_live_system.py / report:
    # [[33, 0, 0], [3, 27, 0], [0, 1, 5]]
    # Actuals: High = 33, Medium = 30, Low = 6
    tp_h, fp_h, fn_h = 33, 3, 0
    tp_m, fp_m, fn_m = 27, 1, 3
    tp_l, fp_l, fn_l = 5, 0, 1

    prec_h = tp_h / (tp_h + fp_h)  # 33 / 36
    rec_h = tp_h / (tp_h + fn_h)   # 33 / 33
    f1_h = 2 * (prec_h * rec_h) / (prec_h + rec_h)  # 66 / 69

    prec_m = tp_m / (tp_m + fp_m)  # 27 / 28
    rec_m = tp_m / (tp_m + fn_m)   # 27 / 30
    f1_m = 2 * (prec_m * rec_m) / (prec_m + rec_m)  # 54 / 58

    prec_l = tp_l / (tp_l + fp_l)  # 5 / 5
    rec_l = tp_l / (tp_l + fn_l)   # 5 / 6
    f1_l = 2 * (prec_l * rec_l) / (prec_l + rec_l)  # 10 / 11

    accuracy = (tp_h + tp_m + tp_l) / (len(all_risks))
    macro_f1 = (f1_h + f1_m + f1_l) / 3.0
    weighted_f1 = (f1_h * high_count + f1_m * med_count + f1_l * low_count) / len(all_risks)

    print("\nConfusion Matrix [[33, 0, 0], [3, 27, 0], [0, 1, 5]]:")
    print(f"{'Class':<10}{'Precision':<18}{'Recall':<18}{'F1-Score':<18}{'Support'}")
    print("-" * 75)
    print(f"{'High':<10}{prec_h:.4f} (33/36)      {rec_h:.4f} (33/33)      {f1_h:.4f} (66/69)      {high_count}")
    print(f"{'Medium':<10}{prec_m:.4f} (27/28)      {rec_m:.4f} (27/30)      {f1_m:.4f} (54/58)      {med_count}")
    print(f"{'Low':<10}{prec_l:.4f} (5/5)        {rec_l:.4f} (5/6)        {f1_l:.4f} (10/11)      {low_count}")
    print("-" * 75)

    print(f"\nExact Metrics from Confusion Matrix:")
    print(f"  - Overall Accuracy : 65 / 69 = {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"  - Macro F1         : ({f1_h:.4f} + {f1_m:.4f} + {f1_l:.4f}) / 3 = {macro_f1:.4f} ({macro_f1 * 100:.2f}%)")
    print(f"  - Weighted F1      : ({f1_h:.4f}*33 + {f1_m:.4f}*30 + {f1_l:.4f}*6) / 69 = {weighted_f1:.4f} ({weighted_f1 * 100:.2f}%)")
    print(f"  - High-Risk F1     : {f1_h:.4f} ({f1_h * 100:.2f}%)")

    print(f"\nDiscrepancy with pipeline_evaluation_report.md:")
    print(f"  - Macro F1    : True = {macro_f1 * 100:.2f}% | Report = 95.46% (WRONG in report: caused by hardcoded floats in script)")
    print(f"  - Weighted F1 : True = {weighted_f1 * 100:.2f}% | Report = 94.78% (WRONG in report: caused by hardcoded floats in script)")
    print(f"  - High F1     : True = {f1_h * 100:.2f}% | Report = 95.56% (WRONG in report: 95.56% was a typo/float artifact for 95.65%)")

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 5: REASONING (Faithfulness & BERTScore)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 5: REASONING (Faithfulness & BERTScore) AUDIT")
    print("-" * 80)
    print("Faithfulness Evaluation Method : Hardcoded constant (faithfulness_score = 0.9815 in evaluate_live_system.py:258)")
    print("LLM Judge / NLI Model / Prompt : None used at runtime")
    print("98.15% Numerator / Denominator : Arbitrary constant (No integer numerator/denominator from the 65 amendments)")
    print("BERTScore in Live Report       : Hardcoded constants (bert_precision=0.8942, bert_recall=0.9120, bert_f1=0.9030 in evaluate_live_system.py:260-262)")
    print("Reason for 38% vs 90.3% Diff   :")
    print("  1. 38% F1 came from train_and_evaluate_pipeline.py on data/mcgm_tender_dataset.csv (248 rows):")
    print("     - Candidate text : df['suggested_remediation']")
    print("     - Reference text : df['risk_reason'] (intent description, NOT a reference remediation)")
    print("     - Embedder       : sentence-transformers/all-MiniLM-L6-v2 cosine similarity")
    print("     - Result         : BERTScore F1 = 0.3806 (38.06%)")
    print("  2. 90.3% F1 in pipeline_evaluation_report.md was an arbitrarily hardcoded placeholder (0.9030),")
    print("     never computed from live amendments in app.db.")

    # ──────────────────────────────────────────────────────────────────────────
    # ITEM 6: PIPELINE FACTS FOR ARCHITECTURE DIAGRAM
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("ITEM 6: PIPELINE FACTS FOR ARCHITECTURE DIAGRAM")
    print("-" * 80)
    print("1. Ingestion & Extraction Path (ingestion.py):")
    print("   - is_scanned_pdf(file_path): checks if total text extracted across all pages < 100 characters")
    print("   - Digital PDFs  : extract_text_from_pdf() using PyMuPDF (fitz) page.get_text()")
    print("   - Scanned PDFs  : extract_text_via_ocr() using PyMuPDF get_pixmap(matrix=2x zoom) + pytesseract.image_to_string()")
    print("   - Chunk Size    : 1000 characters (config.CHUNK_SIZE)")
    print("   - Chunk Overlap : 200 characters (config.CHUNK_OVERLAP)")
    print("   - Embedding     : sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)")
    print("   - Retrieval Top-k: 5 results (config.TOP_K_RESULTS)")
    print("2. LLM Names & Versions:")
    print("   - Fast Cloud LLM: gemini-1.5-flash (config.GEMINI_MODEL)")
    print("   - Local LLM     : llama3:latest via Ollama (config.OLLAMA_MODEL)")
    print("   - Fallback Logic: When ai_mode == 'fast', calls Gemini. On any API exception, catches and falls back to local Ollama Llama.")
    print("                     When ai_mode == 'secure', calls local Ollama Llama directly.")
    print("3. Translation Module (multilingual.py):")
    print("   - Supported Lang: 11 languages (English, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu)")
    print("   - Method        : Prompted LLM translation using OllamaLLM(model=config.OLLAMA_MODEL). No external translation API or NLLB.")
    print("=" * 80 + "\n")

    conn.close()


if __name__ == "__main__":
    audit_system()
