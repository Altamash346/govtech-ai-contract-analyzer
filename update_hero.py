import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

new_login_page = '''def show_login_page():
    # Inject Hero CSS ONLY for the login page
    st.markdown("""
    <style>
        /* Hide sidebar completely on login */
        [data-testid="stSidebar"] { display: none !important; }
        [data-testid="collapsedControl"] { display: none !important; }
        
        /* Full bleed background for the app matching the uploaded image */
        .stApp {
            background: linear-gradient(90deg, rgba(17, 24, 39, 1) 0%, rgba(17, 24, 39, 0.95) 30%, rgba(17, 24, 39, 0.4) 100%), url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2500&auto=format&fit=crop') no-repeat center center fixed !important;
            background-size: cover !important;
        }
        
        /* Adjust top padding */
        .block-container {
            padding-top: 6rem !important;
            max-width: 1400px;
        }
        
        /* Style the login card to match the white overlapping card in the image */
        div[data-testid="stForm"] {
            background-color: rgba(255, 255, 255, 0.97) !important;
            padding: 0 !important;
            border-radius: 8px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
            border: none !important;
            overflow: hidden;
        }
        
        /* Form text dark */
        div[data-testid="stForm"] p, div[data-testid="stForm"] label {
            color: #1e293b !important;
            font-weight: 600;
        }
        
        /* Inputs */
        div[data-testid="stForm"] input {
            background-color: #f8fafc !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
        }
        
        /* Submit Button inside form */
        div[data-testid="stForm"] .stButton>button {
            background-color: #111827 !important;
            color: white !important;
            border: none !important;
            padding: 0.75rem 2rem !important;
            font-size: 1rem !important;
            font-weight: 600 !important;
            width: 100%;
            margin-top: 10px;
            border-radius: 4px !important;
        }
        div[data-testid="stForm"] .stButton>button:hover {
            background-color: #374151 !important;
        }
        
        /* Tabs styling for login card */
        .stTabs [data-baseweb="tab-list"] {
            background-color: #f1f5f9;
            padding: 0 1rem;
            border-bottom: 1px solid #cbd5e1;
            gap: 0;
        }
        .stTabs [data-baseweb="tab"] {
            background-color: transparent !important;
            color: #64748b !important;
            border: none !important;
            padding: 1rem 1.5rem !important;
            border-radius: 0 !important;
        }
        .stTabs [aria-selected="true"] {
            color: #111827 !important;
            border-bottom: 2px solid #111827 !important;
            background-color: white !important;
        }
        
    </style>
    """, unsafe_allow_html=True)
    
    col1, empty_col, col2 = st.columns([1.1, 0.2, 0.9])
    
    with col1:
        st.markdown("""
        <div style="margin-top: 4rem;">
            <h1 style="color: white; font-size: 4.5rem; font-weight: 800; line-height: 1.1; font-family: 'Inter', sans-serif; margin-bottom: 1.5rem; letter-spacing: -0.02em;">
                Government<br>Solutions. <span style="color: #ef4444;">Reliable.</span><br>Compliant. On Time.
            </h1>
            <p style="color: #cbd5e1; font-size: 1.25rem; font-weight: 400; font-family: 'Inter', sans-serif; margin-bottom: 2.5rem;">
                Serving Federal, State & Local Agencies Across Sectors.
            </p>
            <a href="#" style="background-color: #ef4444; color: white; padding: 12px 36px; text-decoration: none; font-weight: 600; font-size: 1.1rem; border-radius: 4px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);">
                Contact Us
            </a>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        # We wrap the tabs in a custom div to act as the image header of the card
        st.markdown("""
        <div style="height: 180px; background: url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop') center center; border-radius: 8px 8px 0 0; margin-bottom: -15px; position: relative; z-index: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        </div>
        <div style="position: relative; z-index: 1;">
        """, unsafe_allow_html=True)
        
        tab1, tab2 = st.tabs(["Secure Login", "Register"])
        with tab1:
            with st.form("login_form"):
                st.markdown("""
                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding: 1rem 1rem 0 1rem;">
                    <div style="background-color: #111827; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; margin-right: 12px;">+</div>
                    <div>
                        <h4 style="margin: 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Public Healthcare</h4>
                        <p style="color: #64748b; font-size: 0.85rem; margin: 0;">Access restricted portal</p>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                # Form elements need to be within the form, but padding applied via CSS
                st.markdown("<div style='padding: 0 1.5rem 1.5rem 1.5rem;'>", unsafe_allow_html=True)
                email = st.text_input("Email Address")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Access Portal")
                st.markdown("</div>", unsafe_allow_html=True)
                
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
                st.markdown("<div style='padding: 1.5rem;'>", unsafe_allow_html=True)
                name = st.text_input("Full Name")
                email_r = st.text_input("Email Address ")
                password_r = st.text_input("Password ", type="password")
                submitted_r = st.form_submit_button("Create Account")
                st.markdown("</div>", unsafe_allow_html=True)
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
        st.markdown("</div>", unsafe_allow_html=True)
'''

content = re.sub(r'def show_login_page\(\):.*?def show_sidebar\(\):', new_login_page + '\n\ndef show_sidebar():', content, flags=re.DOTALL)

with open("app.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated app.py with strict hero styling.")
