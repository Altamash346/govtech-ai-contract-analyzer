import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. New CSS
new_css = """<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { font-family: 'Inter', sans-serif; }
    
    /* Main Background */
    .stApp {
        background-color: #0f172a;
        color: #f8fafc;
    }
    
    .main { 
        background-color: #0f172a; 
    }

    h1, h2, h3, h4, h5, h6, p, span, div, label {
        color: #f8fafc !important;
    }

    /* Sidebar Styling */
    [data-testid="stSidebar"] {
        background-color: #1e293b;
        border-right: 1px solid #334155;
    }
    
    /* Sidebar buttons */
    [data-testid="stSidebar"] .stButton>button {
        background-color: transparent;
        color: #e2e8f0 !important;
        border: 1px solid #475569;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
        display: flex;
        justify-content: flex-start;
    }
    [data-testid="stSidebar"] .stButton>button:hover {
        background-color: #334155;
        border-color: #94a3b8;
    }

    /* Main Buttons (Red Accent) */
    .stButton>button {
        background-color: #e11d48;
        color: white !important;
        border: none;
        border-radius: 4px;
        padding: 0.6rem 1.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    .stButton>button:hover { 
        background-color: #be123c;
    }

    /* Cards */
    .glass-card {
        background-color: #1e293b;
        border-radius: 6px;
        padding: 24px;
        border: 1px solid #334155;
        margin: 12px 0;
    }

    /* Risk Cards */
    .risk-high {
        background-color: #1e293b;
        border-left: 4px solid #ef4444;
        padding: 16px; border-radius: 4px; margin: 10px 0;
        border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;
    }
    .risk-medium {
        background-color: #1e293b;
        border-left: 4px solid #f59e0b;
        padding: 16px; border-radius: 4px; margin: 10px 0;
        border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;
    }
    .risk-low {
        background-color: #1e293b;
        border-left: 4px solid #22c55e;
        padding: 16px; border-radius: 4px; margin: 10px 0;
        border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;
    }

    /* Metric Cards */
    .metric-card {
        background-color: #1e293b;
        border-radius: 6px;
        padding: 20px;
        text-align: center;
        border: 1px solid #334155;
    }

    /* Entity Boxes */
    .entity-box {
        background-color: #1e293b;
        border-radius: 4px;
        padding: 14px;
        margin: 8px 0;
        border-left: 3px solid #3b82f6;
    }

    /* Chat Bubbles */
    .chat-user {
        background-color: #334155;
        border-radius: 6px;
        padding: 12px 16px;
        margin: 8px 0;
        border-left: 3px solid #94a3b8;
    }
    .chat-ai {
        background-color: #1e293b;
        border-radius: 6px;
        padding: 12px 16px;
        margin: 8px 0;
        border: 1px solid #334155;
    }
    .citation-badge {
        background-color: #334155;
        color: #cbd5e1 !important;
        border-radius: 4px;
        padding: 3px 8px;
        font-size: 11px;
        margin: 2px;
        display: inline-block;
        font-weight: 600;
        border: 1px solid #475569;
    }

    /* Agent Debate Cards */
    .agent-critic {
        background-color: #1e293b;
        border-left: 4px solid #ef4444;
        padding: 16px; border-radius: 4px; margin: 10px 0;
    }
    .agent-defender {
        background-color: #1e293b;
        border-left: 4px solid #22c55e;
        padding: 16px; border-radius: 4px; margin: 10px 0;
    }
    .agent-judge {
        background-color: #1e293b;
        border-left: 4px solid #3b82f6;
        padding: 16px; border-radius: 4px; margin: 10px 0;
    }

    /* Scheme Cards */
    .scheme-card {
        background-color: #1e293b;
        border-radius: 6px;
        padding: 20px;
        margin: 10px 0;
        border-top: 3px solid #e11d48;
        border-left: 1px solid #334155;
        border-right: 1px solid #334155;
        border-bottom: 1px solid #334155;
    }

    /* Page Title */
    .page-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #f8fafc !important;
        border-bottom: 2px solid #334155;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        border-radius: 4px;
        padding: 8px 20px;
        font-weight: 600;
        background-color: #1e293b;
        border: 1px solid #334155;
    }
    
    /* Inputs */
    input, textarea, .stSelectbox > div > div {
        background-color: #0f172a !important;
        color: white !important;
        border: 1px solid #334155 !important;
        border-radius: 4px !important;
    }

    /* Hide Streamlit branding */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }
</style>"""

content = re.sub(r'<style>.*?</style>', new_css, content, flags=re.DOTALL)

# 2. Overhaul Login Page
new_login = '''def show_login_page():
    st.markdown("""
    <div style="padding: 5rem 3rem; background-color: #0f172a; border-radius: 8px; margin-bottom: 3rem; border-left: 6px solid #e11d48; border-top: 1px solid #1e293b; border-right: 1px solid #1e293b; border-bottom: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <h1 style="color: white; font-size: 4rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.02em;">
            Government Solutions.<br><span style="color: #e11d48;">Reliable.</span> Compliant. On Time.
        </h1>
        <p style="color: #94a3b8; font-size: 1.25rem; font-weight: 500; margin-bottom: 0;">
            Serving Federal, State & Local Agencies Across Sectors.
        </p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        st.markdown("### Secure Access")
        tab1, tab2 = st.tabs(["Login", "Register"])

        with tab1:
            with st.form("login_form"):
                email = st.text_input("Email Address")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Contact Us / Sign In", use_container_width=True)
                if submitted:
                    session = db.SessionLocal()
                    user = session.query(db.User).filter_by(email=email).first()
                    session.close()
                    if user and db.verify_password(password, user.password_hash):
                        st.session_state.logged_in = True
                        st.session_state.user_id = user.id
                        st.session_state.user_name = user.name
                        st.session_state.user_email = user.email
                        st.session_state.user_role = user.role
                        st.rerun()
                    else:
                        st.error("Invalid credentials.")

        with tab2:
            with st.form("register_form"):
                name = st.text_input("Full Name")
                email_r = st.text_input("Email Address ")
                password_r = st.text_input("Password ", type="password")
                submitted_r = st.form_submit_button("Create Account", use_container_width=True)
                if submitted_r:
                    if not name or not email_r or not password_r:
                        st.error("All fields required.")
                    else:
                        session = db.SessionLocal()
                        existing = session.query(db.User).filter_by(email=email_r).first()
                        if existing:
                            st.error("Email registered.")
                        else:
                            new_user = db.User(name=name, email=email_r, password_hash=db.hash_password(password_r), role="user")
                            session.add(new_user)
                            session.commit()
                            st.success("Account created. Please sign in.")
                        session.close()
    
    with col2:
        pass
    with col3:
        st.markdown("""
        <div style="background-color: #1e293b; padding: 20px; border-radius: 6px; border: 1px solid #334155; margin-top: 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="background-color: #0f172a; color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; margin-right: 10px;">+</div>
                <h4 style="margin: 0; color: white;">Public Healthcare</h4>
            </div>
            <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">Medical-grade supplies for critical care.</p>
        </div>
        """, unsafe_allow_html=True)
'''

content = re.sub(r'def show_login_page\(\):.*?def show_sidebar\(\):', new_login + '\n\ndef show_sidebar():', content, flags=re.DOTALL)

# 3. Strip all emojis
emojis_to_remove = [
    "⚖️", "📂", "📊", "📤", "💬", "🤖", "🕸️", "📝", "🌐", "🏛️", 
    "📁", "👤", "⚙️", "🔒", "⚡", "☁️", "🖥️", "🚀", "📄", "🔍", 
    "🧠", "🚨", "🔎", "🔴", "🟡", "🟢", "❓", "📎", "🔊", "🗣️",
    "🔵", "✏️", "📋", "⬇️", "📌", "👋", "✅", "⚠️", "❌", "📥", "💾"
]

for emoji in emojis_to_remove:
    content = content.replace(emoji + " ", "")
    content = content.replace(" " + emoji, "")
    content = content.replace(emoji, "")

with open("app.py", "w", encoding="utf-8") as f:
    f.write(content)

print("UI Updated successfully.")
