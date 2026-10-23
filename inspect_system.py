import sqlite3
import json

conn = sqlite3.connect("app.db")
c = conn.cursor()

docs = c.execute("SELECT id, user_id, filename, doc_type, page_count, faiss_index_path, uploaded_at FROM documents").fetchall()
print(f"Total documents in app.db: {len(docs)}")
for d in docs:
    print(f"ID: {d[0]} | File: {d[2]} | Type: {d[3]} | Pages: {d[4]} | Path: {d[5]}")

print("\n--- Inspecting first 3 document risks ---")
docs_risks = c.execute("SELECT id, filename, risks, clauses, summary FROM documents LIMIT 3").fetchall()
for d in docs_risks:
    print(f"\nDocument ID {d[0]} ({d[1]}):")
    try:
        risks_data = json.loads(d[2]) if d[2] else []
        clauses_data = json.loads(d[3]) if d[3] else []
        print(f"  Risks count: {len(risks_data)}")
        for r in risks_data[:3]:
            print("   *", r)
        print(f"  Clauses count: {len(clauses_data)}")
        if clauses_data:
            print("   * Sample clause:", clauses_data[0])
    except Exception as e:
        print("  Error parsing JSON:", e)

print("\n--- Inspecting QA History ---")
qas = c.execute("SELECT id, document_id, question, answer, citations FROM qa_history").fetchall()
print(f"Total QA interactions: {len(qas)}")
for q in qas[:5]:
    print(f"\nQA ID {q[0]} for Doc {q[1]}:")
    print("  Q:", q[2])
    print("  A:", q[3][:100] + "...")
    print("  Citations:", q[4])

conn.close()
