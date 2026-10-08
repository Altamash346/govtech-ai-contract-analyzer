# ⚖️ GovTech AI: Legal Contract Intelligence & Citizen Welfare Platform

An advanced, sovereign GovTech AI platform for automated verification of legal agreements, government tenders, contracts, and citizen welfare schemes across India.

Combines high-precision **Legal Contract Risk Auditing & Visual PDF Redlining** with an intelligent **Citizen Welfare Scheme Recommender** covering 96+ Central and State welfare programs.

---

## 🌟 Key Features

| Module | Feature | Description |
|---|---|---|
| **Module 1** | **Automated Legal Audit & Clause Extraction** | Executive summaries, clause categorization (Termination, Indemnity, Payment, etc.), risk severity scoring (High/Medium/Low) with statutory replacement clauses, and Named Entity Recognition. |
| **Module 2** | **Interactive Q&A with Page Citations** | RAG-powered vector search (FAISS + SentenceTransformers) providing exact page citations and chat history. |
| **Module 3** | **Multi-Agent Courtroom Legal Debate** | Simulated tri-agent adversarial trial: The Critic (exposes loopholes), The Defender (argues industry practice), and The Judge (delivers balanced legal verdicts). |
| **Module 4** | **Direct Visual Contract Redlining on Uploaded PDF** | Vector-level PyMuPDF markup drawing direct red strikethrough lines, highlight boxes, and risk warning badges onto the uploaded PDF bytes, with live in-browser preview and one-click PDF download. |
| **Module 5** | **Citizen Welfare Scheme Recommender & Directory** | Demographic intake (Age, Gender, Occupation, Income, State, Social Category, Land ownership) matching citizens against 96+ welfare programs with 1-click presets and directory search. |
| **Module 6** | **Multilingual Translation & Summaries** | Plain-language summaries and translations across 11 official Indian languages (Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu, English). |
| **Module 7** | **Interactive Knowledge Graph** | Entity-relationship extraction mapped into force-directed network graphs. |

---

## 🏗️ System Architecture & Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, responsive Government Portal theme (National Navy `#0f3d68` & Saffron `#ea580c`), dynamic Light/Dark mode with adaptive 3D hero illustrations.
* **Backend:** FastAPI (Python 3.11), Uvicorn, SQLAlchemy ORM, SQLite.
* **Vector Store & Embeddings:** FAISS, `sentence-transformers/all-MiniLM-L6-v2`.
* **PDF & OCR Pipeline:** PyMuPDF (`pymupdf`), Tesseract OCR.
* **Dual-Mode AI Engine:**
  * **Sovereign Local Mode:** 100% private, air-gapped LLM via Ollama (`llama3.2:1b`).
  * **High-Speed Cloud Mode:** Optional fast inference via Google Gemini API.

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* [Ollama](https://ollama.com) (for local private LLM execution)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd ai-contract-analyzer
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Edit `.env` as needed:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
FAISS_INDEX_PATH=./vector_store
DATABASE_URL=sqlite:///./app.db

# Dual Mode AI Engine: "secure" (local Ollama) or "fast" (Gemini API)
AI_MODE=fast
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 5. Running the Application

**Start the FastAPI Backend:**
```bash
# From project root:
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**Start the Vite Frontend:**
```bash
# In a separate terminal:
cd frontend
npm run dev -- --host --port 5173
```

Open your browser at **`http://localhost:5173`**.

---

## 🔒 Security & Data Sovereignty
* Document files, embeddings, and vector indices are stored locally on your machine.
* In Local Mode, all AI inference executes locally via Ollama with zero external data transmission.
* Scanned PDF OCR processing runs locally through Tesseract.

---

## 📄 License
This project is licensed under the Apache 2.0 / MIT License.
