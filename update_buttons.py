import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    'st.button("Process & Analyze Document", use_container_width=True)': 'st.button("Process & Analyze Document", use_container_width=True, type="primary")',
    'st.button("Start Multi-Agent Analysis", use_container_width=True)': 'st.button("Start Multi-Agent Analysis", use_container_width=True, type="primary")',
    'st.button("Generate Knowledge Graph", use_container_width=True)': 'st.button("Generate Knowledge Graph", use_container_width=True, type="primary")',
    'st.button("Generate Redlined Document", use_container_width=True)': 'st.button("Generate Redlined Document", use_container_width=True, type="primary")',
    'st.button("Upload your first document")': 'st.button("Upload your first document", type="primary")'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open("app.py", "w", encoding="utf-8") as f:
    f.write(content)
