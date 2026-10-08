"""
app.py — Main Streamlit Application for AI Contract & Scheme Analysis System.
Features: Multi-Agent Debate, Knowledge Graph, Auto-Redlining, Multilingual, Scheme Browser
Entry point: run with `streamlit run app.py`
Requires ui_theme.py in the same folder.
"""
import os

# Suppress transformers optional model eager loading
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import json
import tempfile
import streamlit as st
from datetime import datetime
from streamlit_agraph import agraph

# Internal modules
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
import ui_theme

# ─── Page Config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Contract & Scheme Analyzer",
    page_icon="⚖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Initialize DB ────────────────────────────────────────────────────────────
db.init_db()


# ─── Session State Initialization ─────────────────────────────────────────────
def init_session():
    defaults = {
        "logged_in": False,
        "user_id": None,
        "user_name": "",
        "user_email": "",
        "user_role": "user",
        "current_doc_id": None,
        "current_doc_name": "",
        "current_doc_type": "contract",
        "current_index_dir": None,
        "current_full_text": "",
        "summary": "",
        "risks": [],
        "clauses": [],
        "entities": {},
        "qa_history": [],
        "scheme_result": None,
        "analysis_done": False,
        "page": "dashboard",
        "selected_scheme_id": None,
        "scheme_qa": {},
        "debate_result": None,
        "kg_data": None,
        "ai_mode": config.AI_MODE,  # "secure" or "fast"
        "theme_mode": "bright",     # "bright" (official gov portal) or "dark"
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


init_session()
ui_theme.inject_global_css(st.session_state.get("theme_mode", "bright"))


# ─── AUTH PAGE ────────────────────────────────────────────────────────────────
def show_login_page():
    ui_theme.show_login_page(db)


# ─── SIDEBAR ──────────────────────────────────────────────────────────────────
def nav(label, page):
    if st.button(label, use_container_width=True, key=f"nav_{page}"):
        st.session_state.page = page
        st.rerun()


def show_top_nav():
    current = st.session_state.page
    nav_items = [
        ("Dashboard", "dashboard"),
        ("Upload", "upload"),
        ("Q&A Chat", "chat"),
        ("Debate", "multi_agent"),
        ("Knowledge Graph", "knowledge_graph"),
        ("Auto-Redline", "redline"),
        ("Multilingual", "multilingual"),
        ("Scheme Browser", "scheme"),
        ("My Documents", "documents"),
    ]
    cols = st.columns(len(nav_items))
    for col, (label, pg) in zip(cols, nav_items):
        with col:
            is_active = (current == pg)
            if st.button(label, key=f"topnav_{pg}", use_container_width=True, type="primary" if is_active else "secondary"):
                st.session_state.page = pg
                st.rerun()
    hr_border = "#334155" if st.session_state.get("theme_mode", "bright") == "dark" else "#e2e8f0"
    st.markdown(f"<hr style='margin: 6px 0 20px 0; border: none; border-top: 1px solid {hr_border};'/>", unsafe_allow_html=True)


def show_sidebar():
    with st.sidebar:
        ui_theme.sidebar_brand()
        st.markdown(f"**{st.session_state.user_name}**")
        st.caption(st.session_state.user_email)
        st.markdown("---")

        st.markdown("**Core**")
        nav("📊  Dashboard", "dashboard")
        nav("📤  Upload Document", "upload")
        nav("💬  Q&A Chat", "chat")

        st.markdown("---")
        st.markdown("**Advanced AI**")
        nav("⚔️  Multi-Agent Debate", "multi_agent")
        nav("🕸️  Knowledge Graph", "knowledge_graph")
        nav("✍️  Auto-Redline", "redline")
        nav("🌐  Multilingual", "multilingual")

        st.markdown("---")
        st.markdown("**Government**")
        nav("🏛️  Scheme Browser", "scheme")

        st.markdown("---")
        st.markdown("**History**")
        nav("🗂️  My Documents", "documents")

        if st.session_state.current_doc_name:
            st.markdown("---")
            st.markdown("**Active Document**")
            st.info(f"{st.session_state.current_doc_name[:28]}")

        st.markdown("---")
        # ── Processing Mode Toggle ──
        st.markdown("**Processing Mode**")
        mode_choice = st.radio(
            "Choose Processing Mode",
            options=["Slower (secure)", "Faster (not that much secure)"],
            index=0 if st.session_state.ai_mode == "secure" else 1,
            help="Slower (secure): runs locally on your machine. Faster (not that much secure): uses online cloud processing.",
            label_visibility="collapsed",
        )
        new_mode = "secure" if "secure" in mode_choice and "Slower" in mode_choice else "fast"
        if new_mode != st.session_state.ai_mode:
            st.session_state.ai_mode = new_mode
            st.rerun()

        if st.session_state.ai_mode == "fast":
            st.warning("Faster mode: not that much secure (online processing).")
        else:
            st.success("Slower mode: secure (on-device local processing).")

        st.markdown("---")
        # ── Theme Mode Toggle ──
        st.markdown("**Appearance**")
        theme_pick = st.radio(
            "Theme Mode",
            options=["☀️ Bright (Official Gov)", "🌙 Dark Mode"],
            index=0 if st.session_state.get("theme_mode", "bright") == "bright" else 1,
            label_visibility="collapsed",
        )
        new_theme = "bright" if "Bright" in theme_pick else "dark"
        if new_theme != st.session_state.get("theme_mode", "bright"):
            st.session_state.theme_mode = new_theme
            st.rerun()

        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()


# ─── UPLOAD PAGE ──────────────────────────────────────────────────────────────
def show_upload_page():
    st.markdown('<p class="page-title">Upload Document</p>', unsafe_allow_html=True)
    st.markdown("Upload a PDF contract or government scheme for AI analysis.")

    col1, col2 = st.columns(2)
    with col1:
        doc_type = st.selectbox(
            "Document Type", ["contract", "scheme"],
            format_func=lambda x: "Contract / Policy" if x == "contract" else "Government Scheme",
        )
    with col2:
        uploaded_file = st.file_uploader("Choose a PDF (max 50MB)", type=["pdf"])

    if uploaded_file:
        st.markdown(
            f"""<div class="glass-card"><b>{uploaded_file.name}</b> — {round(uploaded_file.size / 1024, 1)} KB</div>""",
            unsafe_allow_html=True,
        )

        if st.button("Process & Analyze Document", use_container_width=True, type="primary"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(uploaded_file.read())
                tmp_path = tmp.name

            progress_bar = st.progress(0)
            status = st.empty()

            try:
                status.info("Saving document record...")
                progress_bar.progress(10)
                session = db.SessionLocal()
                new_doc = db.Document(user_id=st.session_state.user_id, filename=uploaded_file.name, doc_type=doc_type)
                session.add(new_doc)
                session.commit()
                doc_id = new_doc.id

                status.info("Scanning document (OCR detection)...")
                progress_bar.progress(20)
                result = ingestion.process_document(tmp_path, doc_id)

                status.info("Extracting text...")
                progress_bar.progress(40)
                pages = ingestion.extract_text_from_pdf(tmp_path)
                full_text = "\n".join([ingestion.preprocess_text(p["text"]) for p in pages])

                ai_mode = st.session_state.ai_mode
                engine_name = "Faster" if ai_mode == "fast" else "Secure"

                status.info(f"AI: Performing comprehensive legal audit... ({engine_name} Mode)")
                progress_bar.progress(60)
                audit = analysis.analyze_document_complete(full_text, mode=ai_mode)
                summary = audit.get("summary", "")
                clauses = audit.get("clauses", [])
                risks = audit.get("risks", [])
                entities = audit.get("entities", {})
                progress_bar.progress(88)

                new_doc.page_count = result["page_count"]
                new_doc.summary = summary
                new_doc.risks = json.dumps(risks)
                new_doc.clauses = json.dumps(clauses)
                new_doc.entities = json.dumps(entities)
                new_doc.faiss_index_path = result["index_dir"]
                session.commit()
                session.close()

                st.session_state.current_doc_id = doc_id
                st.session_state.current_doc_name = uploaded_file.name
                st.session_state.current_doc_type = doc_type
                st.session_state.current_index_dir = result["index_dir"]
                st.session_state.current_full_text = full_text
                st.session_state.summary = summary
                st.session_state.risks = risks
                st.session_state.clauses = clauses
                st.session_state.entities = entities
                st.session_state.qa_history = []
                st.session_state.scheme_result = None
                st.session_state.debate_result = None
                st.session_state.kg_data = None
                st.session_state.analysis_done = True

                progress_bar.progress(100)
                status.success(f"Done! {result['page_count']} pages · {result['chunk_count']} chunks indexed")
                st.session_state.page = "dashboard"
                st.rerun()
            except Exception as e:
                st.error(f"Error: {str(e)}")
            finally:
                os.unlink(tmp_path)


# ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
def show_dashboard():
    if not st.session_state.analysis_done:
        st.markdown("""
        <div style="background-color: #0f3d68; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #ea580c; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <div>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #fb923c; letter-spacing: 1px;">NEW REACT WEBSITE LIVE</span>
                <div style="font-size: 13px; font-weight: 600; margin-top: 2px;">Experience the full scrollable National Government Portal frontend at <b>http://localhost:5173</b></div>
            </div>
            <a href="http://localhost:5173" target="_blank" style="background-color: #ea580c; color: white; padding: 8px 18px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
                OPEN REACT PORTAL ➜
            </a>
        </div>
        """, unsafe_allow_html=True)

        ui_theme.welcome_hero()
        col1, col2, _ = st.columns([1.3, 1.3, 2.4])
        with col1:
            if st.button("INSPECTOR PORTAL", type="primary", use_container_width=True):
                st.session_state.page = "upload"
                st.rerun()
        with col2:
            if st.button("VIEW GUIDELINES", type="secondary", use_container_width=True):
                st.session_state.page = "scheme"
                st.rerun()

        st.markdown("---")

        # ── Scroll Section 1: Live National Compliance Metrics ──
        st.markdown('<h3 style="font-family: Merriweather, Georgia, serif; margin: 20px 0 10px 0;">National Compliance Live Monitor</h3>', unsafe_allow_html=True)
        m1, m2, m3, m4 = st.columns(4)
        m1.markdown('<div class="metric-card"><h2 style="color:#0f3d68;margin:0">1.4M+</h2><p style="margin:4px 0 0 0;font-size:12px;font-weight:600;">Commodities Audited</p></div>', unsafe_allow_html=True)
        m2.markdown('<div class="metric-card"><h2 style="color:#ea580c;margin:0">96</h2><p style="margin:4px 0 0 0;font-size:12px;font-weight:600;">Welfare Schemes</p></div>', unsafe_allow_html=True)
        m3.markdown('<div class="metric-card"><h2 style="color:#138808;margin:0">99.8%</h2><p style="margin:4px 0 0 0;font-size:12px;font-weight:600;">Statutory Accuracy</p></div>', unsafe_allow_html=True)
        m4.markdown('<div class="metric-card"><h2 style="color:#0f3d68;margin:0">11</h2><p style="margin:4px 0 0 0;font-size:12px;font-weight:600;">Indian Languages</p></div>', unsafe_allow_html=True)

        st.markdown("---")

        # ── Scroll Section 2: Core Public Digital Services ──
        st.markdown('<h3 style="font-family: Merriweather, Georgia, serif; margin: 20px 0 10px 0;">Digital Public Infrastructure Services</h3>', unsafe_allow_html=True)
        s1, s2, s3 = st.columns(3)
        with s1:
            st.markdown("""
            <div class="glass-card" style="border-top: 4px solid #0f3d68;">
                <h4 style="margin: 0 0 8px 0;">Automated Contract Audit</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">Scan agreements against consumer protection and metrology rules to detect loopholes and remedies.</p>
            </div>
            """, unsafe_allow_html=True)
        with s2:
            st.markdown("""
            <div class="glass-card" style="border-top: 4px solid #ea580c;">
                <h4 style="margin: 0 0 8px 0;">Multi-Agent Courtroom</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">Simulate 3 autonomous AI agents debating your clauses: The Critic, Defender, and Judicial Verdict.</p>
            </div>
            """, unsafe_allow_html=True)
        with s3:
            st.markdown("""
            <div class="glass-card" style="border-top: 4px solid #138808;">
                <h4 style="margin: 0 0 8px 0;">Citizen Scheme Eligibility</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">Match profiles with 96+ central & state welfare programs for instant qualification breakdown.</p>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        # ── Scroll Section 3: Gazette Notifications ──
        st.markdown('<h3 style="font-family: Merriweather, Georgia, serif; margin: 20px 0 10px 0;">Official Gazette & Circulars</h3>', unsafe_allow_html=True)
        g1, g2 = st.columns(2)
        with g1:
            st.markdown("""
            <div class="glass-card">
                <span style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase;">G.S.R. 779(E) · Ministry of Consumer Affairs</span>
                <h4 style="margin: 6px 0;">Mandatory Country of Origin & USP Declarations</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">Enforcing strict pre-packaged commodity disclosures on e-commerce marketplaces across India.</p>
            </div>
            """, unsafe_allow_html=True)
        with g2:
            st.markdown("""
            <div class="glass-card">
                <span style="font-size: 10px; font-weight: 800; color: #0f3d68; text-transform: uppercase;">Advisory Circular 12/2026 · Legal Metrology</span>
                <h4 style="margin: 6px 0;">Fair Contract Terms in Consumer Agreements</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">Prohibiting unilateral liability waivers and non-mutual termination penalties nationwide.</p>
            </div>
            """, unsafe_allow_html=True)

        return

    st.markdown(f'<p class="page-title">{st.session_state.current_doc_name[:50]}</p>', unsafe_allow_html=True)

    # Top Metrics
    risks = st.session_state.risks or []
    high_risks = len([r for r in risks if r.get("risk_level") == "High"])
    med_risks = len([r for r in risks if r.get("risk_level") == "Medium"])

    c1, c2, c3, c4 = st.columns(4)
    c1.markdown(f'<div class="metric-card"><h1 style="color:#ef4444;margin:0">{high_risks}</h1><p>High Risks</p></div>', unsafe_allow_html=True)
    c2.markdown(f'<div class="metric-card"><h1 style="color:#f59e0b;margin:0">{med_risks}</h1><p>Medium Risks</p></div>', unsafe_allow_html=True)
    c3.markdown(f'<div class="metric-card"><h1 style="color:#3b82f6;margin:0">{len(st.session_state.clauses or [])}</h1><p>Clauses</p></div>', unsafe_allow_html=True)
    c4.markdown(f'<div class="metric-card"><h1 style="color:#a78bfa;margin:0">{len(st.session_state.qa_history)}</h1><p>Q&A</p></div>', unsafe_allow_html=True)

    st.markdown("")
    left, right = st.columns([1.2, 1])

    with left:
        with st.expander("Executive Summary", expanded=True):
            st.write(st.session_state.summary or "Not available.")

        with st.expander(f"Risk Analysis ({len(risks)} found)", expanded=True):
            if risks:
                for risk in risks:
                    level = risk.get("risk_level", "Low")
                    css = f"risk-{level.lower()}"
                    icon = "🔴" if level == "High" else ("🟠" if level == "Medium" else "🟢")
                    st.markdown(f"""<div class="{css}">
                        <strong>{icon} [{level}] {risk.get('clause_type', 'Clause')}</strong><br>
                        <i>"{risk.get('risky_excerpt', '')[:150]}..."</i><br>
                        <b>Why:</b> {risk.get('why_risky', '')}<br>
                        <b>Fix:</b> {risk.get('suggested_replacement', '')}
                    </div>""", unsafe_allow_html=True)
            else:
                st.success("No significant risks detected.")

        with st.expander(f"Clauses ({len(st.session_state.clauses or [])})"):
            for clause in (st.session_state.clauses or []):
                st.markdown(f"**{clause.get('clause_type', 'Clause')}:** {clause.get('summary', '')}")
                if clause.get("verbatim_excerpt"):
                    st.caption(f'"{clause["verbatim_excerpt"][:200]}"')
                st.markdown("---")

    with right:
        with st.expander("Key Entities", expanded=True):
            entities = st.session_state.entities or {}
            if entities:
                for key, values in entities.items():
                    if values:
                        st.markdown(f"""<div class="entity-box">
                            <strong>{key.replace('_', ' ').title()}</strong><br>
                            {', '.join(str(v) for v in values)}
                        </div>""", unsafe_allow_html=True)
            else:
                st.info("No entities extracted.")

        with st.expander("Recent Q&A", expanded=True):
            if st.session_state.qa_history:
                for qa in st.session_state.qa_history[-3:]:
                    st.markdown(f'<div class="chat-user">{qa["question"]}</div>', unsafe_allow_html=True)
                    st.markdown(f'<div class="chat-ai">{qa["answer"][:200]}...</div>', unsafe_allow_html=True)
            else:
                st.info("No questions asked yet.")

    # Download Report
    st.markdown("---")
    c1, c2 = st.columns([1, 3])
    with c1:
        if st.button("Download PDF Report", use_container_width=True):
            report_bytes = report_generator.generate_report(
                filename=st.session_state.current_doc_name, doc_type=st.session_state.current_doc_type,
                summary=st.session_state.summary, risks=st.session_state.risks or [],
                clauses=st.session_state.clauses or [], entities=st.session_state.entities or {},
                qa_history=st.session_state.qa_history, scheme_result=st.session_state.scheme_result)
            st.download_button("Download", data=report_bytes,
                file_name=f"report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf", mime="application/pdf")


# ─── CHAT PAGE ────────────────────────────────────────────────────────────────
def show_chat_page():
    st.markdown('<p class="page-title">Q&A Chat</p>', unsafe_allow_html=True)
    if not st.session_state.current_index_dir:
        st.warning("No document processed yet. Upload a document first.")
        return

    st.markdown(f"**Chatting about:** {st.session_state.current_doc_name}")

    for qa in st.session_state.qa_history:
        st.markdown(f'<div class="chat-user"><b>You:</b> {qa["question"]}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="chat-ai"><b>AI:</b> {qa["answer"]}</div>', unsafe_allow_html=True)
        if qa.get("citations"):
            pages_str = " ".join([f'<span class="citation-badge">Page {p}</span>' for p in qa["citations"]])
            st.markdown(pages_str, unsafe_allow_html=True)
        st.markdown("")

    with st.form("chat_form", clear_on_submit=True):
        c1, c2 = st.columns([5, 1])
        with c1:
            question = st.text_input("Ask anything...", placeholder="e.g., What are the payment terms?")
        with c2:
            submitted = st.form_submit_button("Send ➤", use_container_width=True, type="primary")

    if submitted and question.strip():
        with st.spinner(f"Searching & generating answer... ({'Faster' if st.session_state.ai_mode == 'fast' else 'Secure'} Mode)"):
            result = rag.ask_question(question, st.session_state.current_index_dir, mode=st.session_state.ai_mode)
        qa_entry = {"question": question, "answer": result["answer"], "citations": result["citations"]}
        st.session_state.qa_history.append(qa_entry)

        if st.session_state.current_doc_id:
            session = db.SessionLocal()
            session.add(db.QAHistory(
                user_id=st.session_state.user_id, document_id=st.session_state.current_doc_id,
                question=question, answer=result["answer"], citations=json.dumps(result["citations"])))
            session.commit()
            session.close()
        st.rerun()

    if st.session_state.qa_history:
        if st.button("🔊 Read Last Answer Aloud"):
            try:
                import pyttsx3
                engine = pyttsx3.init()
                engine.say(st.session_state.qa_history[-1]["answer"])
                engine.runAndWait()
            except Exception as e:
                st.error(f"Voice error: {str(e)}")


# ─── MULTI-AGENT DEBATE PAGE ─────────────────────────────────────────────────
def show_multi_agent_page():
    st.markdown('<p class="page-title">Multi-Agent Legal Debate</p>', unsafe_allow_html=True)
    st.markdown("""<div class="glass-card">
        <b>How it works:</b> Three AI agents debate your contract like a courtroom. The <span style="color:#ef4444"><b>Critic</b></span>
        finds every loophole, the <span style="color:#22c55e"><b>Defender</b></span> counter-argues, and the
        <span style="color:#3b82f6"><b>Judge</b></span> delivers the final verdict.
    </div>""", unsafe_allow_html=True)

    if not st.session_state.current_full_text:
        st.warning("Upload a contract document first.")
        return

    if st.button("Start Multi-Agent Analysis", use_container_width=True, type="primary"):
        with st.spinner("Three AI agents are debating your contract... This may take a few minutes."):
            result = multi_agent.run_multi_agent_analysis(st.session_state.current_full_text)
        st.session_state.debate_result = result

    if st.session_state.debate_result:
        result = st.session_state.debate_result
        debate = result.get("debate", [])

        st.markdown("### Overall Verdict")
        st.markdown(f"""<div class="glass-card"><b>{result.get('overall_verdict', 'No verdict available.')}</b></div>""", unsafe_allow_html=True)

        st.markdown(f"### Debate Points ({len(debate)})")
        for i, point in enumerate(debate, 1):
            st.markdown(f"#### Issue {i}: {point.get('issue', 'Unknown')}")
            risk = point.get("final_risk_level", "Medium")
            badge_color = "#dc2626" if risk == "High" else "#f59e0b" if risk == "Medium" else "#22c55e"
            st.markdown(f'<span style="background:{badge_color};color:white;padding:4px 14px;border-radius:999px;font-weight:600;font-size:.8rem">{risk} Risk</span>', unsafe_allow_html=True)

            c1, c2 = st.columns(2)
            with c1:
                st.markdown(f"""<div class="agent-critic">
                    <b>🔴 The Critic</b><br>{point.get('critic_argument', '')}
                </div>""", unsafe_allow_html=True)
            with c2:
                st.markdown(f"""<div class="agent-defender">
                    <b>🟢 The Defender</b><br>{point.get('defender_argument', '')}
                </div>""", unsafe_allow_html=True)

            st.markdown(f"""<div class="agent-judge">
                <b>⚖️ The Judge's Verdict</b><br>{point.get('judge_verdict', '')}
            </div>""", unsafe_allow_html=True)
            st.markdown("---")


# ─── KNOWLEDGE GRAPH PAGE ────────────────────────────────────────────────────
def show_knowledge_graph_page():
    st.markdown('<p class="page-title">Knowledge Graph</p>', unsafe_allow_html=True)
    st.markdown("""<div class="glass-card">
        <b>Interactive Entity Map:</b> The AI extracts all parties, dates, amounts, obligations, and clauses
        from your document and visualizes them as an interactive network graph. Drag nodes to explore relationships.
    </div>""", unsafe_allow_html=True)

    if not st.session_state.current_full_text:
        st.warning("Upload a document first.")
        return

    if st.button("Generate Knowledge Graph", use_container_width=True, type="primary"):
        with st.spinner("Extracting entities and relationships..."):
            kg_data = knowledge_graph.extract_knowledge_graph(st.session_state.current_full_text)
        st.session_state.kg_data = kg_data

    if st.session_state.kg_data:
        kg_data = st.session_state.kg_data
        nodes_list = kg_data.get("nodes", [])
        edges_list = kg_data.get("edges", [])

        st.markdown(f"### Found {len(nodes_list)} entities, {len(edges_list)} relationships")

        if nodes_list:
            try:
                ag_nodes, ag_edges, ag_config = knowledge_graph.build_agraph_data(kg_data)
                agraph(nodes=ag_nodes, edges=ag_edges, config=ag_config)
            except Exception as e:
                st.error(f"Graph rendering error: {str(e)}")

            st.markdown("""<div class="glass-card">
                <b>Legend:</b>
                <span style="color:#3b82f6">● Person</span> &nbsp;
                <span style="color:#22c55e">● Organization</span> &nbsp;
                <span style="color:#f97316">● Date</span> &nbsp;
                <span style="color:#ef4444">● Amount</span> &nbsp;
                <span style="color:#8b5cf6">● Clause</span> &nbsp;
                <span style="color:#eab308">● Obligation</span>
            </div>""", unsafe_allow_html=True)

            with st.expander("Raw Entity Data"):
                for node in nodes_list:
                    st.markdown(f"- **{node.get('label','')}** ({node.get('type','')})")
        else:
            st.info("No entities extracted. Try a document with more content.")


# ─── AUTO-REDLINE PAGE ───────────────────────────────────────────────────────
def show_redline_page():
    st.markdown('<p class="page-title">Auto-Redline Generator</p>', unsafe_allow_html=True)
    st.markdown("""<div class="glass-card">
        <b>AI Contract Rewriter:</b> Describe the changes you want in plain English. The AI will generate
        a Word document (.docx) with the original text in <span style="color:#f87171;text-decoration:line-through">red strikethrough</span>
        and the replacement in <span style="color:#4ade80;font-weight:bold">green bold</span>.
    </div>""", unsafe_allow_html=True)

    if not st.session_state.current_full_text:
        st.warning("Upload a contract document first.")
        return

    st.markdown("### What changes do you want?")
    instructions = st.text_area(
        "Describe your changes in plain English",
        placeholder="e.g., Change payment terms from 30 days to 60 days. Remove the non-compete clause. Make the termination notice period 90 days.",
        height=120)

    if st.button("Generate Redlined Document", use_container_width=True, type="primary") and instructions:
        with st.spinner("AI is analyzing and rewriting your contract..."):
            suggestions = redline_generator.generate_redline_suggestions(st.session_state.current_full_text, instructions)

        if suggestions:
            st.markdown(f"### {len(suggestions)} Changes Suggested")
            for i, s in enumerate(suggestions, 1):
                st.markdown(f"""<div class="glass-card">
                    <b>Change {i}:</b><br>
                    <span style="color:#f87171;text-decoration:line-through">{s.get('original_text', '')[:200]}</span><br>
                    <span style="color:#4ade80;font-weight:bold">→ {s.get('suggested_text', '')[:200]}</span><br>
                    <i style="color:#94a3b8">Reason: {s.get('reason', '')}</i>
                </div>""", unsafe_allow_html=True)

            with st.spinner("Generating Word document..."):
                docx_bytes = redline_generator.create_redline_docx(st.session_state.current_full_text, suggestions)

            st.download_button(
                "Download Redlined .docx", data=docx_bytes,
                file_name=f"redlined_{datetime.now().strftime('%Y%m%d_%H%M')}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True)
        else:
            st.warning("No changes could be generated. Try different instructions.")


# ─── MULTILINGUAL PAGE ───────────────────────────────────────────────────────
def show_multilingual_page():
    st.markdown('<p class="page-title">Multilingual Translation</p>', unsafe_allow_html=True)
    st.markdown("""<div class="glass-card">
        <b>Break the Language Barrier:</b> Translate or summarize your document in 11 Indian languages.
        Upload a Hindi contract and chat with it in English, or get a Tamil summary of an English policy.
    </div>""", unsafe_allow_html=True)

    if not st.session_state.current_full_text:
        st.warning("Upload a document first.")
        return

    c1, c2 = st.columns([1, 1])
    with c1:
        if st.button("Detect Document Language"):
            with st.spinner("Detecting..."):
                lang = multilingual.detect_language(st.session_state.current_full_text)
            st.success(f"Detected Language: **{lang}**")
    with c2:
        target_lang = st.selectbox("Target Language", multilingual.get_supported_languages())

    st.markdown("---")
    tab1, tab2, tab3 = st.tabs(["Summarize in Language", "Translate Full Text", "Listen"])

    with tab1:
        if st.button("Generate Summary", key="summary_btn", use_container_width=True):
            with st.spinner(f"Generating summary in {target_lang}..."):
                result = multilingual.summarize_in_language(st.session_state.current_full_text, target_lang)
            st.markdown(f"""<div class="glass-card"><h4>Summary in {target_lang}</h4><p>{result}</p></div>""", unsafe_allow_html=True)
            st.session_state["translated_summary"] = result

    with tab2:
        max_chars = st.slider("Characters to translate", 500, 3000, 1500)
        if st.button("Translate", key="translate_btn", use_container_width=True):
            with st.spinner(f"Translating to {target_lang}..."):
                result = multilingual.translate_text(st.session_state.current_full_text[:max_chars], target_lang)
            st.markdown(f"""<div class="glass-card"><h4>Translation ({target_lang})</h4><p>{result}</p></div>""", unsafe_allow_html=True)
            st.session_state["translated_text"] = result

    with tab3:
        st.markdown("Click to read the summary or translation aloud:")
        text_to_read = st.session_state.get("translated_summary") or st.session_state.get("translated_text") or ""
        if text_to_read and st.button("Read Aloud", use_container_width=True):
            try:
                import pyttsx3
                engine = pyttsx3.init()
                engine.say(text_to_read)
                engine.runAndWait()
                st.success("Reading aloud...")
            except Exception as e:
                st.error(f"TTS Error: {str(e)}")
        elif not text_to_read:
            st.info("Generate a summary or translation first, then come here to listen.")


# ─── SCHEME BROWSER PAGE ─────────────────────────────────────────────────────
def show_scheme_page():
    st.markdown('<p class="page-title">Government Scheme Browser</p>', unsafe_allow_html=True)
    st.markdown("Browse pre-loaded schemes, check eligibility, and ask questions — no uploads needed!")

    with st.spinner("Loading scheme database..."):
        schemes = scheme_loader.ensure_all_schemes_indexed()

    if not schemes:
        st.error("No schemes found.")
        return

    categories = sorted(set(s.get("category", "Other") for s in schemes))
    
    col_filter, col_select = st.columns(2)
    with col_filter:
        selected_cat = st.selectbox("Filter by Category", ["All Categories"] + categories)
    
    filtered = schemes if selected_cat == "All Categories" else [s for s in schemes if s.get("category") == selected_cat]
    
    with col_select:
        scheme_opts = ["(Select a scheme to view details...)"] + [s["name"] for s in filtered]
        selected_name = st.selectbox("Inspect Scheme Details", scheme_opts)
        
    if selected_name != "(Select a scheme to view details...)":
        for s in filtered:
            if s["name"] == selected_name:
                if st.session_state.get("selected_scheme_id") != s["id"]:
                    st.session_state.selected_scheme_id = s["id"]
                    st.session_state.scheme_result = None
                break
    else:
        st.session_state.selected_scheme_id = None

    st.markdown("---")
    cols = st.columns(3)
    for i, scheme in enumerate(filtered):
        with cols[i % 3]:
            st.markdown(f"""<div class="scheme-card">
                <h3 style="margin:0 0 4px 0">{scheme.get('icon','')}</h3>
                <b style="font-size:14px">{scheme['name']}</b><br>
                <span style="font-size:11px;color:#94a3b8">{scheme.get('ministry','')}</span><br>
                <span class="citation-badge">{scheme.get('category','')}</span>
                <p style="font-size:12px;margin-top:8px;color:#cbd5e1">{scheme.get('description','')[:100]}...</p>
            </div>""", unsafe_allow_html=True)

    selected_id = st.session_state.get("selected_scheme_id")
    if selected_id:
        scheme = scheme_loader.get_scheme_by_id(selected_id)
        if not scheme:
            return

        st.markdown("---")
        st.markdown(f"## {scheme.get('icon','')} {scheme['name']}")
        st.info(scheme.get("description", ""))

        tab1, tab2, tab3 = st.tabs(["📖 Details", "Eligibility", "Ask"])

        with tab1:
            st.text_area("Scheme text", value=scheme.get("full_text", ""), height=400, disabled=True, label_visibility="collapsed")

        with tab2:
            with st.form(f"elig_{selected_id}"):
                c1, c2 = st.columns(2)
                with c1:
                    name = st.text_input("Full Name")
                    age = st.number_input("Age", min_value=1, max_value=120, value=30)
                    gender = st.selectbox("Gender", ["Male", "Female", "Other"])
                    occupation = st.text_input("Occupation")
                with c2:
                    income = st.number_input("Annual Income (INR)", min_value=0, value=200000, step=10000)
                    state = st.text_input("State")
                    category = st.selectbox("Category", ["General", "OBC", "SC", "ST", "EWS"])
                    land = st.text_input("Land Holding", placeholder="e.g., 2 acres or N/A")
                additional = st.text_area("Other details")
                submitted = st.form_submit_button("Check Eligibility", use_container_width=True, type="primary")

            if submitted:
                profile = {"name": name, "age": age, "gender": gender, "occupation": occupation,
                           "annual_income_inr": income, "state": state, "category": category,
                           "land": land, "additional": additional}
                with st.spinner("Matching..."):
                    st.session_state.scheme_result = analysis.match_scheme_eligibility(scheme.get("full_text", ""), profile)

            if st.session_state.get("scheme_result"):
                r = st.session_state.scheme_result
                score = r.get("match_score", 0)
                c1, c2, c3 = st.columns([1, 1, 2])
                with c1:
                    color = "#22c55e" if score >= 70 else "#f59e0b" if score >= 40 else "#ef4444"
                    st.markdown(f'<div class="metric-card"><h1 style="color:{color};margin:0">{score}%</h1><p>Match Score</p></div>', unsafe_allow_html=True)
                with c2:
                    st.markdown(f'<div class="metric-card"><h1 style="margin:0">{"✅" if r.get("eligible") else "❌"}</h1><p>{"Eligible" if r.get("eligible") else "Not Eligible"}</p></div>', unsafe_allow_html=True)
                with c3:
                    st.info(r.get("recommendation", ""))

                c1, c2 = st.columns(2)
                with c1:
                    for c in r.get("criteria_met", []):
                        st.success(f"**{c.get('criterion','')}** — {c.get('evidence','')}")
                with c2:
                    for c in r.get("criteria_failed", []):
                        st.error(f"**{c.get('criterion','')}** — {c.get('reason','')}")

        with tab3:
            if "scheme_qa" not in st.session_state:
                st.session_state.scheme_qa = {}
            for qa in st.session_state.scheme_qa.get(selected_id, []):
                st.markdown(f'<div class="chat-user">{qa["question"]}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="chat-ai">{qa["answer"]}</div>', unsafe_allow_html=True)

            with st.form(f"sqf_{selected_id}", clear_on_submit=True):
                c1, c2 = st.columns([5, 1])
                with c1:
                    q = st.text_input("Ask about this scheme...", placeholder="e.g., What documents do I need?")
                with c2:
                    ask = st.form_submit_button("Ask ➤")
            if ask and q.strip():
                idx = scheme.get("index_dir", "")
                if os.path.exists(os.path.join(idx, "index.faiss")):
                    with st.spinner("Searching..."):
                        res = rag.ask_question(q, idx)
                    st.session_state.scheme_qa.setdefault(selected_id, []).append(
                        {"question": q, "answer": res["answer"], "citations": res["citations"]})
                    st.rerun()


# ─── MY DOCUMENTS PAGE ────────────────────────────────────────────────────────
def show_documents_page():
    st.markdown('<p class="page-title">My Documents</p>', unsafe_allow_html=True)
    session = db.SessionLocal()
    docs = (session.query(db.Document).filter_by(user_id=st.session_state.user_id)
            .order_by(db.Document.uploaded_at.desc()).all())
    session.close()

    if not docs:
        st.info("No documents yet. Upload one to get started.")
        return

    for doc in docs:
        with st.expander(f"{doc.filename} — {doc.doc_type.upper()} — {doc.uploaded_at.strftime('%b %d, %Y')}"):
            c1, c2 = st.columns([3, 1])
            with c1:
                st.write(f"**Pages:** {doc.page_count or 'N/A'}")
                st.write(f"**Summary:** {(doc.summary or 'N/A')[:300]}...")
            with c2:
                if st.button("Load", key=f"load_{doc.id}"):
                    st.session_state.current_doc_id = doc.id
                    st.session_state.current_doc_name = doc.filename
                    st.session_state.current_doc_type = doc.doc_type
                    st.session_state.current_index_dir = doc.faiss_index_path
                    st.session_state.summary = doc.summary or ""
                    st.session_state.risks = json.loads(doc.risks) if doc.risks else []
                    st.session_state.clauses = json.loads(doc.clauses) if doc.clauses else []
                    st.session_state.entities = json.loads(doc.entities) if doc.entities else {}
                    st.session_state.analysis_done = True
                    st.session_state.debate_result = None
                    st.session_state.kg_data = None
                    session2 = db.SessionLocal()
                    qa = session2.query(db.QAHistory).filter_by(document_id=doc.id).all()
                    session2.close()
                    st.session_state.qa_history = [
                        {"question": q.question, "answer": q.answer,
                         "citations": json.loads(q.citations) if q.citations else []} for q in qa]
                    st.session_state.page = "dashboard"
                    st.rerun()


# ─── MAIN ROUTER ──────────────────────────────────────────────────────────────
def main():
    if not st.session_state.logged_in:
        show_login_page()
        return

    show_sidebar()
    show_top_nav()
    routes = {
        "dashboard": show_dashboard,
        "upload": show_upload_page,
        "chat": show_chat_page,
        "multi_agent": show_multi_agent_page,
        "knowledge_graph": show_knowledge_graph_page,
        "redline": show_redline_page,
        "multilingual": show_multilingual_page,
        "scheme": show_scheme_page,
        "documents": show_documents_page,
    }
    routes.get(st.session_state.page, show_dashboard)()


# Streamlit runs this file as an import (not __main__), so call main() unconditionally.
main()