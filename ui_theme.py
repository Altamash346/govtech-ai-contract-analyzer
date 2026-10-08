import streamlit as st

def inject_global_css(theme_mode: str = "bright"):
    is_dark = (theme_mode.lower() == "dark")

    if is_dark:
        bg_main = "#0b1329"
        bg_card = "#1e293b"
        border_card = "#334155"
        text_primary = "#f8fafc"
        text_muted = "#94a3b8"
        bg_input = "#1e293b"
        border_input = "#334155"
        text_input = "#f8fafc"
        sidebar_bg = "#0f172a"
        sidebar_border = "#334155"
        btn_primary_bg = "#0284c7"
        btn_primary_hover = "#0369a1"
        btn_primary_text = "#ffffff"
        btn_sec_border = "#38bdf8"
        btn_sec_text = "#38bdf8"
        btn_sec_hover = "#1e293b"
        badge_bg = "#431407"
        badge_border = "#7c2d12"
        badge_text = "#fb923c"
        hero_title_1 = "#38bdf8"
        hero_title_2 = "#fb923c"
    else:
        # ── Bright (Official Government Portal Theme) ──
        bg_main = "#f8fafc"
        bg_card = "#ffffff"
        border_card = "#e2e8f0"
        text_primary = "#0f2b48"
        text_muted = "#475569"
        bg_input = "#ffffff"
        border_input = "#cbd5e1"
        text_input = "#0f172a"
        sidebar_bg = "#0a2540"      # Deep Indian Gov Navy
        sidebar_border = "#163e68"
        btn_primary_bg = "#0f3d68"  # Solid Gov Navy
        btn_primary_hover = "#0a2a47"
        btn_primary_text = "#ffffff"
        btn_sec_border = "#0f3d68"
        btn_sec_text = "#0f3d68"
        btn_sec_hover = "#f0f7ff"
        badge_bg = "#fff7ed"        # Soft Amber Cream
        badge_border = "#fed7aa"
        badge_text = "#c2410c"      # Deep Amber/Rust
        hero_title_1 = "#0f3d68"    # Ashoka/Gov Navy
        hero_title_2 = "#ea580c"    # Saffron Orange

    st.markdown(f"""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }}
        
        /* ── Application Background ── */
        .stApp {{
            background-color: {bg_main} !important;
            color: {text_primary} !important;
        }}
        .main {{
            background-color: {bg_main} !important;
        }}
        
        /* ── Typography ── */
        h1, h2, h3, h4, h5, h6 {{
            color: {text_primary} !important;
            font-weight: 700;
        }}
        p, label, li {{
            color: {text_muted};
        }}
        
        /* ── Official Gov Portal Hero (Reference Match) ── */
        .gov-hero-container {{
            padding: 1rem 0 2rem 0;
            max-width: 950px;
        }}
        .gov-badge {{
            background-color: {badge_bg} !important;
            border: 1.5px solid {badge_border} !important;
            color: {badge_text} !important;
            padding: 6px 16px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.78rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }}
        .gov-title {{
            font-family: 'Merriweather', Georgia, serif !important;
            font-size: 3.4rem !important;
            font-weight: 900 !important;
            line-height: 1.18 !important;
            margin: 0 0 1.5rem 0 !important;
            letter-spacing: -0.01em;
        }}
        .gov-title-line1 {{
            color: {hero_title_1} !important;
            display: inline-block;
        }}
        .gov-title-line2 {{
            color: {hero_title_2} !important;
            display: inline-block;
        }}
        .gov-subtitle {{
            font-size: 1.15rem !important;
            color: {text_muted} !important;
            line-height: 1.7 !important;
            max-width: 820px;
            margin-bottom: 2rem !important;
            font-weight: 400;
        }}

        /* ── Primary Call-to-Action Buttons ── */
        [data-testid="baseButton-primary"], .stButton>button[kind="primary"] {{
            background-color: {btn_primary_bg} !important;
            color: {btn_primary_text} !important;
            border: 2px solid {btn_primary_bg} !important;
            border-radius: 4px !important;
            padding: 0.65rem 1.6rem !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            font-size: 0.92rem !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
        }}
        [data-testid="baseButton-primary"]:hover, .stButton>button[kind="primary"]:hover {{
            background-color: {btn_primary_hover} !important;
            border-color: {btn_primary_hover} !important;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2) !important;
        }}

        /* ── Secondary Outlined Buttons ── */
        [data-testid="baseButton-secondary"], .stButton>button {{
            background-color: transparent !important;
            color: {btn_sec_text} !important;
            border: 2px solid {btn_sec_border} !important;
            border-radius: 4px !important;
            padding: 0.65rem 1.6rem !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            font-size: 0.92rem !important;
            transition: all 0.2s ease !important;
        }}
        [data-testid="baseButton-secondary"]:hover, .stButton>button:hover {{
            background-color: {btn_sec_hover} !important;
            color: {btn_sec_text} !important;
        }}

        /* ── Sidebar ── */
        section[data-testid="stSidebar"] {{
            visibility: visible !important;
            background-color: {sidebar_bg} !important;
            border-right: 1px solid {sidebar_border} !important;
        }}
        section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] h3,
        section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] span, section[data-testid="stSidebar"] label,
        section[data-testid="stSidebar"] strong {{
            color: #f8fafc !important;
        }}
        section[data-testid="stSidebar"] caption {{
            color: #94a3b8 !important;
        }}
        section[data-testid="stSidebar"] .stButton>button {{
            background-color: transparent !important;
            color: #e2e8f0 !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 4px !important;
            padding: 0.55rem 1rem !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
            text-align: left !important;
            width: 100% !important;
            text-transform: none !important;
            letter-spacing: normal !important;
            display: flex !important;
            justify-content: flex-start !important;
        }}
        section[data-testid="stSidebar"] .stButton>button:hover {{
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: #ea580c !important;
            color: #ffffff !important;
        }}

        /* ── Sidebar Toggle Reopen Button (Chevron >) ── */
        [data-testid="collapsedControl"] {{
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: {sidebar_bg} !important;
            border: 1.5px solid {sidebar_border} !important;
            border-radius: 6px !important;
            padding: 6px 10px !important;
            top: 0.75rem !important;
            left: 0.75rem !important;
            z-index: 999999 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
            cursor: pointer !important;
        }}
        [data-testid="collapsedControl"] svg {{
            fill: #f8fafc !important;
            stroke: #f8fafc !important;
            width: 20px !important;
            height: 20px !important;
        }}

        /* ── Input Fields & Textareas ── */
        input, textarea {{
            background-color: {bg_input} !important;
            color: {text_input} !important;
            -webkit-text-fill-color: {text_input} !important;
            border: 1.5px solid {border_input} !important;
            border-radius: 4px !important;
            padding: 0.6rem 0.8rem !important;
        }}
        input::placeholder, textarea::placeholder {{
            color: {text_muted} !important;
            -webkit-text-fill-color: {text_muted} !important;
        }}
        input:focus, textarea:focus {{
            border-color: #ea580c !important;
            box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.15) !important;
        }}
        textarea:disabled, input:disabled {{
            background-color: {"#0f172a" if is_dark else "#f1f5f9"} !important;
            color: {text_muted} !important;
            -webkit-text-fill-color: {text_muted} !important;
            border-color: {border_input} !important;
            opacity: 0.85 !important;
        }}

        /* ── Selectboxes & Dropdowns ── */
        .stSelectbox > div > div {{
            background-color: {bg_input} !important;
            color: {text_input} !important;
            border: 1.5px solid {border_input} !important;
            border-radius: 4px !important;
        }}
        .stSelectbox > div > div * {{
            color: {text_input} !important;
        }}
        [data-baseweb="popover"], [data-baseweb="menu"], ul[role="listbox"] {{
            background-color: {bg_card} !important;
            border: 1px solid {border_card} !important;
            border-radius: 4px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }}
        li[role="option"] {{
            background-color: {bg_card} !important;
            color: {text_primary} !important;
        }}
        li[role="option"]:hover, li[role="option"][aria-selected="true"] {{
            background-color: {"#334155" if is_dark else "#f0f7ff"} !important;
            color: {"#38bdf8" if is_dark else "#0f3d68"} !important;
        }}
        li[role="option"] * {{
            color: inherit !important;
        }}

        /* ── Cards & Panels ── */
        .glass-card, .scheme-card, .metric-card {{
            background-color: {bg_card} !important;
            border-radius: 6px !important;
            padding: 24px !important;
            border: 1px solid {border_card} !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05) !important;
            color: {text_primary} !important;
            margin: 12px 0;
        }}
        .scheme-card {{
            border-top: 4px solid #ea580c !important;
        }}
        .entity-box {{
            background-color: {bg_card} !important;
            border-radius: 4px !important;
            padding: 14px !important;
            margin: 8px 0;
            border-left: 4px solid #0f3d68 !important;
            border: 1px solid {border_card};
            color: {text_primary};
        }}
        .entity-box * {{
            color: {text_primary};
        }}
        .chat-user {{
            background-color: {"#334155" if is_dark else "#e2e8f0"} !important;
            border-radius: 6px;
            padding: 14px 18px;
            margin: 8px 0;
            border-left: 4px solid #0f3d68;
            color: {text_primary} !important;
        }}
        .chat-user * {{
            color: {text_primary} !important;
        }}
        .chat-ai {{
            background-color: {bg_card} !important;
            border-radius: 6px;
            padding: 14px 18px;
            margin: 8px 0;
            border: 1px solid {border_card} !important;
            color: {text_primary} !important;
        }}
        .chat-ai * {{
            color: {text_primary} !important;
        }}
        .citation-badge {{
            background-color: {"#334155" if is_dark else "#f1f5f9"} !important;
            color: {"#38bdf8" if is_dark else "#0f3d68"} !important;
            border-radius: 4px;
            padding: 3px 8px;
            font-size: 11px;
            margin: 2px;
            display: inline-block;
            font-weight: 700;
            border: 1px solid {"#475569" if is_dark else "#cbd5e1"};
        }}

        /* ── Risk Cards ── */
        .risk-high {{
            background-color: {"#450a0a" if is_dark else "#fef2f2"} !important;
            border-left: 4px solid #dc2626 !important;
            border: 1px solid {"#7f1d1d" if is_dark else "#fecaca"};
            padding: 16px; border-radius: 4px; margin: 10px 0;
            color: {"#fca5a5" if is_dark else "#991b1b"} !important;
        }}
        .risk-high * {{ color: inherit !important; }}
        .risk-medium {{
            background-color: {"#451a03" if is_dark else "#fffbeb"} !important;
            border-left: 4px solid #f59e0b !important;
            border: 1px solid {"#78350f" if is_dark else "#fde68a"};
            padding: 16px; border-radius: 4px; margin: 10px 0;
            color: {"#fcd34d" if is_dark else "#92400e"} !important;
        }}
        .risk-medium * {{ color: inherit !important; }}
        .risk-low {{
            background-color: {"#052e16" if is_dark else "#f0fdf4"} !important;
            border-left: 4px solid #22c55e !important;
            border: 1px solid {"#14532d" if is_dark else "#bbf7d0"};
            padding: 16px; border-radius: 4px; margin: 10px 0;
            color: {"#86efac" if is_dark else "#166534"} !important;
        }}
        .risk-low * {{ color: inherit !important; }}

        /* ── Alert Boxes ── */
        [data-testid="stAlert"] {{
            background-color: {bg_card} !important;
            border-radius: 6px !important;
            border: 1.5px solid {border_card} !important;
            padding: 14px 18px !important;
            color: {text_primary} !important;
        }}
        [data-testid="stAlert"] * {{
            color: {text_primary} !important;
        }}

        /* ── Expanders ── */
        [data-testid="stExpander"] {{
            background-color: {bg_card} !important;
            border: 1px solid {border_card} !important;
            border-radius: 6px !important;
            margin-bottom: 12px !important;
        }}
        [data-testid="stExpander"] summary {{
            color: {text_primary} !important;
            font-weight: 700 !important;
        }}
        [data-testid="stExpander"] summary * {{
            color: {text_primary} !important;
        }}
        [data-testid="stExpander"] [data-testid="stExpanderDetails"] {{
            background-color: {bg_main} !important;
            border-top: 1px solid {border_card} !important;
            padding: 18px !important;
            color: {text_primary} !important;
        }}
        [data-testid="stExpander"] [data-testid="stExpanderDetails"] * {{
            color: {text_primary} !important;
        }}

        /* ── Page Titles ── */
        .page-title {{
            font-family: 'Merriweather', Georgia, serif !important;
            font-size: 2.2rem !important;
            font-weight: 800 !important;
            color: {text_primary} !important;
            border-bottom: 2px solid {border_card} !important;
            padding-bottom: 12px !important;
            margin-bottom: 24px !important;
        }}

        /* ── Forms ── */
        div[data-testid="stForm"] {{
            background-color: {bg_card} !important;
            border: 1px solid {border_card} !important;
            border-radius: 6px !important;
            padding: 24px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
        }}

        /* ── File Uploader ── */
        [data-testid="stFileUploader"] section {{
            background-color: {bg_card} !important;
            border: 2px dashed {border_card} !important;
            border-radius: 6px !important;
            padding: 20px !important;
        }}
        [data-testid="stFileUploader"] section * {{
            color: {text_muted} !important;
        }}
        [data-testid="stFileUploader"] button {{
            background-color: {btn_primary_bg} !important;
            color: #ffffff !important;
            border: none !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
        }}

        /* ── Tabs ── */
        .stTabs [data-baseweb="tab-list"] {{
            gap: 8px !important;
            background-color: transparent !important;
            border-bottom: 2px solid {border_card} !important;
        }}
        .stTabs [data-baseweb="tab"] {{
            border-radius: 4px 4px 0 0 !important;
            padding: 8px 20px !important;
            font-weight: 600 !important;
            background-color: {bg_card} !important;
            border: 1px solid {border_card} !important;
            color: {text_muted} !important;
        }}
        .stTabs [data-baseweb="tab"]:hover {{
            color: {text_primary} !important;
        }}
        .stTabs [aria-selected="true"] {{
            background-color: {bg_main} !important;
            color: #ea580c !important;
            border-bottom: 3px solid #ea580c !important;
        }}

        /* Hide Streamlit Toolbar & Dev Menus */
        #MainMenu {{ visibility: hidden; }}
        footer {{ visibility: hidden; }}
        [data-testid="stToolbar"] {{ visibility: hidden; }}
        header {{ background: transparent !important; }}
    </style>
    """, unsafe_allow_html=True)


def sidebar_brand():
    st.markdown("""
    <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 15px;">
        <span style="background-color: #ea580c; color: white; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 800; letter-spacing: 1px;">GOV TECH</span>
        <h3 style="margin: 6px 0 2px 0; color: #ffffff !important; font-family: 'Merriweather', serif; font-size: 1.25rem;">Legal & Scheme</h3>
        <p style="margin: 0; color: #94a3b8 !important; font-size: 0.78rem; font-weight: 500;">Compliance Platform · India</p>
    </div>
    """, unsafe_allow_html=True)


def welcome_hero():
    st.markdown("""
    <div class="gov-hero-container">
        <div class="gov-badge">OFFICIAL GOVERNMENT PORTAL</div>
        <h1 class="gov-title">
            <span class="gov-title-line1">Legal & Scheme</span><br>
            <span class="gov-title-line2">Compliance Platform</span>
        </h1>
        <p class="gov-subtitle">
            An advanced AI-powered inspection system for automated verification of legal agreements, contracts, and citizen welfare schemes across India. Ensuring fair trade, regulatory compliance, and risk remediation through automated legal intelligence.
        </p>
    </div>
    """, unsafe_allow_html=True)


def show_login_page(db):
    theme_mode = st.session_state.get("theme_mode", "bright")
    is_dark = (theme_mode.lower() == "dark")
    card_bg = "#1e293b" if is_dark else "#ffffff"
    card_border = "#334155" if is_dark else "#e2e8f0"
    card_text = "#f8fafc" if is_dark else "#0f2b48"

    col_hero, col_gap, col_form = st.columns([1.3, 0.1, 1.0])

    with col_hero:
        st.markdown(f"""
        <div class="gov-hero-container" style="padding-top: 2rem;">
            <div class="gov-badge">OFFICIAL GOVERNMENT PORTAL</div>
            <h1 class="gov-title">
                <span class="gov-title-line1">Legal Metrology</span><br>
                <span class="gov-title-line2">Compliance Platform</span>
            </h1>
            <p class="gov-subtitle">
                An advanced AI-powered inspection system for automated verification of packaged commodities, legal agreements, and citizen welfare schemes. Ensuring fair trade, consumer protection, and statutory compliance across India through the Legal Metrology Rules.
            </p>
            <div style="margin-top: 2rem; display: flex; gap: 15px;">
                <div style="background-color: {'#1e293b' if is_dark else '#ffffff'}; border: 1px solid {card_border}; border-left: 4px solid #ea580c; padding: 14px 18px; border-radius: 4px; flex: 1;">
                    <div style="font-weight: 700; color: {'#f8fafc' if is_dark else '#0f3d68'}; font-size: 0.95rem;">Automated Contract Audit</div>
                    <div style="color: {'#94a3b8' if is_dark else '#64748b'}; font-size: 0.82rem; margin-top: 4px;">Detect loopholes, unfavorable terms, and risk remediation.</div>
                </div>
                <div style="background-color: {'#1e293b' if is_dark else '#ffffff'}; border: 1px solid {card_border}; border-left: 4px solid #0f3d68; padding: 14px 18px; border-radius: 4px; flex: 1;">
                    <div style="font-weight: 700; color: {'#f8fafc' if is_dark else '#0f3d68'}; font-size: 0.95rem;">Citizen Welfare Scheme Intelligence</div>
                    <div style="color: {'#94a3b8' if is_dark else '#64748b'}; font-size: 0.82rem; margin-top: 4px;">Instant eligibility verification across 100+ government programs.</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_form:
        st.markdown(f"""
        <div style="background-color: {card_bg}; border: 1.5px solid {card_border}; border-top: 5px solid #0f3d68; border-radius: 6px; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin-top: 2rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0; color: {card_text} !important; font-size: 1.35rem; font-family: 'Merriweather', serif;">Inspector & User Portal</h3>
                    <p style="margin: 2px 0 0 0; color: {'#94a3b8' if is_dark else '#64748b'} !important; font-size: 0.82rem;">Sign in with your authorized credentials</p>
                </div>
                <span style="font-size: 26px;">🏛️</span>
            </div>
        """, unsafe_allow_html=True)

        tab1, tab2 = st.tabs(["Secure Login", "Register Officer"])
        with tab1:
            with st.form("login_form"):
                email = st.text_input("Official Email Address")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("INSPECTOR LOGIN", use_container_width=True, type="primary")
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
                name = st.text_input("Officer Full Name")
                email_r = st.text_input("Email Address ")
                password_r = st.text_input("Password ", type="password")
                submitted_r = st.form_submit_button("CREATE ACCOUNT", use_container_width=True)
                if submitted_r:
                    if not name or not email_r or not password_r:
                        st.error("All fields required.")
                    else:
                        session = db.SessionLocal()
                        existing = session.query(db.User).filter_by(email=email_r).first()
                        if existing:
                            st.error("Email already registered.")
                        else:
                            new_user = db.User(name=name, email=email_r, password_hash=db.hash_password(password_r), role="user")
                            session.add(new_user)
                            session.commit()
                            st.success("Account created successfully. Please sign in.")
                        session.close()
        st.markdown("</div>", unsafe_allow_html=True)
