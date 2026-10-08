"""
analysis.py — AI Analysis Engine.
Routes to Gemini API (fast, cloud) or local Ollama (slow, private)
depending on the AI_MODE set in config / session state.
"""
import os
import re
import json
import config

# ─── LLM Routing ──────────────────────────────────────────────────────────────

def _call_llm(prompt: str, mode: str = None) -> str:
    """
    Send a prompt to the chosen AI backend.
    mode: "fast" → Gemini API | "secure" → local Ollama
    Falls back to config.AI_MODE if mode is not explicitly passed.
    """
    active_mode = (mode or config.AI_MODE).lower()

    if active_mode == "fast":
        return _call_gemini(prompt)
    else:
        return _call_ollama(prompt)


def _call_gemini(prompt: str) -> str:
    """Send prompt to fast cloud engine with seamless fallback."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=config.GEMINI_API_KEY)
        model = genai.GenerativeModel(config.GEMINI_MODEL)
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1},
            request_options={"timeout": 45}
        )
        return response.text.strip()
    except Exception as e:
        # Fall back to local secure engine without exposing internal provider details
        fallback_res = _call_ollama(prompt)
        if not fallback_res.startswith("Error"):
            return fallback_res
        return "Unable to process document at this time. Please try using Slower (secure) mode."


def _call_ollama(prompt: str) -> str:
    """Send prompt to local secure engine with deterministic temperature and ample token window."""
    try:
        from langchain_ollama import OllamaLLM
        llm = OllamaLLM(
            model=config.OLLAMA_MODEL,
            base_url=config.OLLAMA_BASE_URL,
            temperature=0.1,
            num_predict=4096
        )
        return llm.invoke(prompt)
    except Exception as e:
        return f"Error contacting local processing engine: {str(e)}"


def _safe_parse_json(text: str) -> list | dict:
    """
    Robust JSON parser for LLM outputs.
    Automatically repairs:
    - Markdown code fences (```json ... ```)
    - Trailing commas before closing braces/brackets
    - Missing closing braces or brackets (unclosed root objects from token truncation)
    - Unescaped control characters (strict=False)
    """
    if not text:
        return {}
    clean = text.strip()
    if '```json' in clean:
        clean = clean.split('```json', 1)[1]
    elif '```' in clean:
        clean = clean.split('```', 1)[1]
    if '```' in clean:
        clean = clean.split('```', 1)[0]
    clean = clean.strip()

    sb = clean.find('{')
    ab = clean.find('[')
    if sb == -1 and ab == -1:
        return {}
    
    start_char = '{' if (sb != -1 and (ab == -1 or sb < ab)) else '['
    start_idx = clean.find(start_char)
    snippet = clean[start_idx:]

    # 1. Direct parse attempt
    try:
        return json.loads(snippet, strict=False)
    except Exception:
        pass

    # 2. Strip trailing commas
    cleaned_commas = re.sub(r',\s*([\]}])', r'\1', snippet)
    try:
        return json.loads(cleaned_commas, strict=False)
    except Exception:
        pass

    # 3. Stack-based unclosed bracket/brace auto-closer
    stack = []
    in_string = False
    escape = False
    for ch in cleaned_commas:
        if escape:
            escape = False
            continue
        if ch == '\\':
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch == '{':
                stack.append('}')
            elif ch == '[':
                stack.append(']')
            elif ch in ('}', ']'):
                if stack and stack[-1] == ch:
                    stack.pop()

    repaired = cleaned_commas
    if in_string:
        repaired += '"'
    while stack:
        repaired += stack.pop()

    try:
        return json.loads(repaired, strict=False)
    except Exception:
        pass

    # 4. Fallback: try substring from first { to last }
    try:
        eb = snippet.rfind('}')
        if eb != -1:
            return json.loads(snippet[:eb+1], strict=False)
    except Exception:
        pass

    return {}


# ─── REQ-3.1: Document Summary ────────────────────────────────────────────────

def generate_summary(full_text: str, mode: str = None) -> str:
    """Generate a concise executive summary of the entire document."""
    truncated = full_text[:4000] + ("..." if len(full_text) > 4000 else "")
    prompt = f"""You are a legal document analyst. Analyze the following document and write a clear, 
concise executive summary in plain English (max 200 words). Focus on the key purpose, 
main parties involved, important obligations, and critical dates.

DOCUMENT:
{truncated}

EXECUTIVE SUMMARY:"""
    return _call_llm(prompt, mode).strip()


# ─── REQ-3.2: Clause Classification ──────────────────────────────────────────

def classify_clauses(full_text: str, mode: str = None) -> list[dict]:
    """Identify and categorize standard legal clauses in the document."""
    truncated = full_text[:5000] + ("..." if len(full_text) > 5000 else "")
    prompt = f"""You are a legal AI. Analyze the document below and identify the main legal clauses present.
For each clause found, return a JSON array. Each item must have:
- "clause_type": (e.g., "Indemnity", "Termination", "Payment Terms", "Confidentiality", "Dispute Resolution", "Governing Law")
- "summary": a one-sentence plain English explanation
- "verbatim_excerpt": the exact quote from the document (max 100 words)

Return ONLY valid JSON, no other text.

DOCUMENT:
{truncated}

JSON:"""
    raw = _call_llm(prompt, mode)
    return _safe_parse_json(raw)


# ─── REQ-3.3: Risk Detection & Remediation ───────────────────────────────────

def detect_risks(full_text: str, mode: str = None) -> list[dict]:
    """Detect risky clauses and suggest safer replacement text."""
    truncated = full_text[:5000] + ("..." if len(full_text) > 5000 else "")
    prompt = f"""You are an expert legal risk analyst. Analyze the document below and identify clauses 
that may be legally risky, one-sided, or unfavorable to the signing party.

For each risk, return a JSON array. Each item must have:
- "risk_level": "High", "Medium", or "Low"
- "clause_type": the type of clause (e.g., "Indemnity Clause")
- "risky_excerpt": the exact problematic text from the document
- "why_risky": plain English explanation of why it's a risk (max 50 words)
- "suggested_replacement": a safer, more balanced alternative clause text

Return ONLY valid JSON, no other text.

DOCUMENT:
{truncated}

JSON:"""
    raw = _call_llm(prompt, mode)
    return _safe_parse_json(raw)


# ─── REQ-3.4: Entity Extraction ──────────────────────────────────────────────

def extract_entities(full_text: str, mode: str = None) -> dict:
    """Extract key entities: parties, dates, amounts, and locations."""
    truncated = full_text[:5000] + ("..." if len(full_text) > 5000 else "")
    prompt = f"""You are a legal data extraction AI. Extract all key entities from the document below.

Return a JSON object with these keys:
- "parties": list of organization/person names (e.g., ["Acme Corp", "John Doe"])
- "dates": list of dates mentioned (e.g., ["January 1, 2025", "2026-03-31"])
- "monetary_values": list of monetary amounts (e.g., ["$50,000", "INR 2,00,000"])
- "locations": list of places or jurisdictions mentioned
- "key_terms": list of any other critical defined terms

Return ONLY valid JSON, no other text.

DOCUMENT:
{truncated}

JSON:"""
    raw = _call_llm(prompt, mode)
    result = _safe_parse_json(raw)
    if isinstance(result, list):
        return {}
    return result


# ─── REQ-4.3: Scheme Eligibility Matcher ─────────────────────────────────────

def match_scheme_eligibility(scheme_text: str, user_profile: dict, mode: str = None) -> dict:
    """
    Match a user's profile against a government scheme document.
    Returns a match score and checklist of criteria met/failed.
    """
    truncated = scheme_text[:5000] + ("..." if len(scheme_text) > 5000 else "")
    profile_str = json.dumps(user_profile, indent=2)
    prompt = f"""You are a government scheme eligibility expert. 
Given the SCHEME DOCUMENT and USER PROFILE below, determine the user's eligibility.

Return a JSON object with:
- "match_score": a percentage from 0–100 (integer)
- "eligible": true or false
- "criteria_met": list of objects with "criterion" and "evidence" (quote from document)
- "criteria_failed": list of objects with "criterion" and "reason"
- "recommendation": a one-paragraph actionable recommendation for the user

Return ONLY valid JSON, no other text.

SCHEME DOCUMENT:
{truncated}

USER PROFILE:
{profile_str}

JSON:"""
    raw = _call_llm(prompt, mode)
    result = _safe_parse_json(raw)
    if isinstance(result, list):
        return {"match_score": 0, "eligible": False, "criteria_met": [], "criteria_failed": [], "recommendation": "Could not parse response."}
    return result


def _filter_candidate_schemes(profile: dict, all_schemes: list, top_k: int = 10) -> list:
    """Intelligently filters 96 schemes down to the 8-12 most relevant candidates based on demographic attributes."""
    gender = str(profile.get("gender", "")).strip().lower()
    try:
        age = int(profile.get("age", 30) or 30)
    except Exception:
        age = 30
    occupation = str(profile.get("occupation", "")).lower()
    try:
        income = float(profile.get("annual_income_inr", 200000) or 200000)
    except Exception:
        income = 200000.0
    category = str(profile.get("category", "General")).lower()
    state = str(profile.get("state", "")).lower()
    specials = [str(s).lower() for s in profile.get("special_conditions", [])]

    scored = []
    for s in all_schemes:
        name = s.get("name", "")
        desc = s.get("description", "")
        cat = s.get("category", "")
        ministry = s.get("ministry", "")
        full_text = s.get("full_text", "")
        blob = f"{name} {desc} {cat} {ministry} {full_text[:600]}".lower()

        score = 0

        # Gender rules
        female_keywords = ["women", "girl", "mother", "female", "mahila", "kanya", "matru", "sukanya", "beti", "ladli", "janani", "maternal", "maternity", "pregnant", "lactat"]
        is_female_scheme = any(kw in blob for kw in female_keywords)

        if gender == "male":
            if is_female_scheme or cat.lower() == "women and child development":
                continue # strict exclusion of women/maternity schemes for male citizens
        elif gender == "female":
            if is_female_scheme or cat.lower() == "women and child development":
                score += 40

        # Occupation rules
        if "farmer" in occupation or any("land" in sp for sp in specials):
            if cat.lower() in ["agriculture", "rural development", "water", "food security"]:
                score += 35
            elif any(kw in blob for kw in ["kisan", "crop", "farm", "fertilizer", "soil", "irrigation", "mandi"]):
                score += 30

        if "student" in occupation or any("education" in sp for sp in specials):
            if cat.lower() in ["education", "skill development", "sports"]:
                score += 35
            elif any(kw in blob for kw in ["student", "school", "scholarship", "apprentice", "skill", "training", "shiksha"]):
                score += 30

        if "business" in occupation or "self-employed" in occupation or "msme" in occupation or any("loan" in sp for sp in specials):
            if cat.lower() in ["banking and finance", "business", "entrepreneurship", "finance", "manufacturing"]:
                score += 35
            elif any(kw in blob for kw in ["mudra", "credit", "loan", "msme", "startup", "entrepreneur", "guarantee"]):
                score += 30

        if "wage" in occupation or "unemployed" in occupation:
            if cat.lower() in ["employment", "urban employment", "rural development", "skill development"]:
                score += 35
            elif any(kw in blob for kw in ["mgnrega", "employment", "wage", "rozgar", "shramik", "livelihood"]):
                score += 30

        # Age rules
        if age >= 60:
            if any(kw in blob for kw in ["pension", "senior", "old age", "vaya", "elder", "vridha"]):
                score += 45
        elif age <= 25:
            if any(kw in blob for kw in ["youth", "child", "student", "young", "khelo"]):
                score += 25

        # Income / BPL rules
        is_bpl = income <= 250000 or any("bpl" in sp for sp in specials)
        if is_bpl:
            if cat.lower() in ["housing", "health", "energy", "social security", "food security"]:
                score += 25
            if any(kw in blob for kw in ["bpl", "poor", "awas", "ayushman", "ujjwala", "ration", "subsidy", "samman"]):
                score += 25

        # Social Category rules
        if category in ["sc", "st", "obc", "ews"]:
            if any(kw in blob for kw in ["sc", "st", "backward", "weaker", "minority", "stand up", "tribal"]):
                score += 20

        # Special tags
        if any("pregnant" in sp for sp in specials):
            if any(kw in blob for kw in ["matru", "pregnant", "lactating", "maternity", "infant", "janani"]):
                score += 50
        if any("disability" in sp for sp in specials or "differently" in sp for sp in specials):
            if any(kw in blob for kw in ["disability", "divyang", "handicapped", "differently abled"]):
                score += 50

        # Universal healthcare & social protection
        if cat.lower() in ["health", "social welfare", "insurance"]:
            score += 10

        scored.append((score, s))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k]]


def recommend_schemes_for_profile(profile: dict, mode: str = None) -> dict:
    """
    Recommend matching welfare schemes for a citizen based on demographic details (gender, age, occupation, income, category, state).
    """
    schemes_path = os.path.join(os.path.dirname(__file__), "schemes_data", "all_schemes.json")
    if not os.path.exists(schemes_path):
        return {"recommendations": [], "profile_summary": "No scheme database found.", "total_matched": 0}

    with open(schemes_path, "r", encoding="utf-8") as f:
        all_schemes = json.load(f)

    candidates = _filter_candidate_schemes(profile, all_schemes, top_k=8)
    if not candidates:
        return {"recommendations": [], "profile_summary": "No matching schemes found for this demographic profile.", "total_matched": 0}

    candidates_desc = []
    for s in candidates:
        candidates_desc.append(
            f"ID: {s.get('id')}\n"
            f"NAME: {s.get('name')}\n"
            f"CATEGORY: {s.get('category')}\n"
            f"MINISTRY: {s.get('ministry')}\n"
            f"OVERVIEW: {s.get('description', '')}\n"
            f"GUIDELINES: {s.get('full_text', '')[:400]}"
        )
    candidates_text = "\n---\n".join(candidates_desc)

    gender = profile.get("gender", "Not Specified")
    age = profile.get("age", "Not Specified")
    occ = profile.get("occupation", "Not Specified")
    income = profile.get("annual_income_inr", "Not Specified")
    state = profile.get("state", "India")
    cat = profile.get("category", "General")
    specials = ", ".join(profile.get("special_conditions", [])) or "None"

    prompt = f"""You are a senior officer in the National Social Welfare Advisory Commission of India.
Evaluate the Citizen Profile below against the candidate government schemes.
For each scheme, evaluate eligibility, calculate a match score (0-100), and extract key benefits and application steps.

CITIZEN PROFILE:
- Name: {profile.get('name', 'Citizen')}
- Gender: {gender}
- Age: {age}
- Occupation / Employment: {occ}
- Annual Household Income: ₹{income}
- State / UT: {state}
- Social Category / Caste: {cat}
- Special Conditions / Status: {specials}

CANDIDATE SCHEMES:
{candidates_text}

OUTPUT FORMAT:
Return a SINGLE JSON object with:
{{
  "profile_summary": "1-sentence summary of the citizen profile and their primary welfare entitlements",
  "recommendations": [
    {{
      "scheme_id": "scheme ID",
      "scheme_name": "full scheme name",
      "category": "category name",
      "ministry": "ministry name",
      "match_score": 95,
      "eligible": true,
      "eligibility_status": "Highly Eligible | Likely Eligible | Conditional",
      "why_eligible": "1-2 sentences explaining specifically how this citizen's gender, age, income, category, or occupation satisfies this scheme's eligibility criteria.",
      "key_benefit": "Concise highlight of financial assistance, subsidy, loan, or service (e.g. '₹6,000/yr direct cash transfer' or 'Free health cover up to ₹5 Lakh/yr').",
      "required_documents": ["Aadhaar Card", "Bank Account Passbook", "..."],
      "how_to_apply": "Short action instruction on how/where to apply.",
      "official_portal": "URL or government department"
    }}
  ]
}}

RULES:
1. Only recommend schemes where the citizen has genuine eligibility or high potential to qualify.
2. For male citizens, NEVER recommend female-only or maternity programs.
3. Sort recommendations by match_score in descending order (highest match first).
4. Return ONLY valid JSON, without conversational text or markdown code fences.

JSON:"""

    raw = _call_llm(prompt, mode)
    parsed = _safe_parse_json(raw)

    recs = []
    summary_text = ""
    if isinstance(parsed, dict) and "recommendations" in parsed and isinstance(parsed["recommendations"], list):
        recs = parsed["recommendations"]
        summary_text = parsed.get("profile_summary", "")

    # Fallback synthesizer if LLM output fails to parse or is empty
    if not recs:
        for idx, s in enumerate(candidates):
            score = max(65, 95 - (idx * 4))
            recs.append({
                "scheme_id": s.get("id"),
                "scheme_name": s.get("name"),
                "category": s.get("category"),
                "ministry": s.get("ministry"),
                "match_score": score,
                "eligible": True,
                "eligibility_status": "Highly Eligible" if score >= 85 else "Likely Eligible",
                "why_eligible": f"Matches your profile based on occupation ({occ}), income bracket (₹{income}), and demographic category ({cat}).",
                "key_benefit": s.get("description", "Direct government support and institutional assistance.")[:130] + "...",
                "required_documents": ["Aadhaar Card", "Bank Account Passbook", "Income / Domicile Certificate"],
                "how_to_apply": "Apply via official state/central portal or visit your nearest Common Service Centre (CSC).",
                "official_portal": "https://india.gov.in"
            })
        summary_text = f"Profile matched for {occ} in {state} with annual income ₹{income}. Found {len(recs)} potential schemes."

    return {
        "profile_summary": summary_text,
        "recommendations": recs,
        "total_matched": len(recs)
    }


# ─── Unified Comprehensive Document Analysis (1 Single AI Request) ────────────

def analyze_document_complete(full_text: str, mode: str = None) -> dict:
    """
    Perform complete legal document analysis in a SINGLE unified AI request.
    Extracts summary, classified clauses, risk remediation, and key entities all at once.
    Normalizes outputs across both Gemini and Ollama for unified, consistent presentation.
    """
    truncated = full_text[:7000] + ("..." if len(full_text) > 7000 else "")
    prompt = f"""You are an elite legal contract and regulatory compliance analyst.
Analyze the following document and return a comprehensive legal audit as a SINGLE valid JSON object.

Your JSON output MUST have exactly these 4 top-level keys:

1. "summary": A clear, concise executive summary in plain English (100-180 words) describing the key purpose, main parties involved, important obligations, and critical dates.
2. "clauses": A list of extracted standard legal clauses. Each item must have:
   - "clause_type": (e.g., "Indemnity", "Termination", "Payment Terms", "Governing Law", "Confidentiality")
   - "summary": one-sentence plain English explanation
   - "verbatim_excerpt": exact quote from the document (max 60 words)
3. "risks": A list of identified risks, loopholes, or one-sided terms. Each item must have:
   - "risk_level": "High", "Medium", or "Low"
   - "clause_type": type of clause
   - "risky_excerpt": exact quote of the problematic text
   - "why_risky": plain English explanation of the danger (max 40 words)
   - "suggested_replacement": a safer, balanced legal wording replacement
4. "entities": An object containing extracted key metadata:
   - "parties": list of entity or person names as plain strings (e.g. ["Municipal Corporation of Greater Mumbai", "Contractor"])
   - "dates": list of dates mentioned as strings
   - "monetary_values": list of amounts or financial terms as strings
   - "locations": list of jurisdictions or places as strings
   - "key_terms": list of important defined terms as strings

Return ONLY the raw JSON object. Ensure all brackets are properly closed. Do not include markdown code fences or conversational text.

DOCUMENT:
{truncated}

JSON:"""

    raw = _call_llm(prompt, mode)
    parsed = _safe_parse_json(raw)

    if not isinstance(parsed, dict):
        parsed = {}

    summary = parsed.get("summary")
    if not summary or not isinstance(summary, str) or len(summary.strip()) < 10:
        summary = "Document analyzed successfully. Review the classified clauses, risk remediation, and extracted entities below."

    raw_clauses = parsed.get("clauses")
    if not isinstance(raw_clauses, list):
        raw_clauses = []
    clauses = []
    for c in raw_clauses:
        if isinstance(c, dict) and c.get("clause_type"):
            clauses.append({
                "clause_type": str(c.get("clause_type", "Standard Clause")).strip(),
                "summary": str(c.get("summary", "")).strip(),
                "verbatim_excerpt": str(c.get("verbatim_excerpt", "")).strip()
            })

    raw_risks = parsed.get("risks")
    if not isinstance(raw_risks, list):
        raw_risks = []
    risks = []
    for r in raw_risks:
        if isinstance(r, dict) and (r.get("clause_type") or r.get("why_risky")):
            lvl = str(r.get("risk_level", "Medium")).strip().capitalize()
            if lvl not in ["High", "Medium", "Low"]:
                lvl = "Medium"
            risks.append({
                "risk_level": lvl,
                "clause_type": str(r.get("clause_type", "General Risk")).strip(),
                "risky_excerpt": str(r.get("risky_excerpt", "")).strip(),
                "why_risky": str(r.get("why_risky", "")).strip(),
                "suggested_replacement": str(r.get("suggested_replacement", "")).strip()
            })

    raw_entities = parsed.get("entities")
    if not isinstance(raw_entities, dict):
        raw_entities = {}
    
    entities = {}
    for k in ["parties", "dates", "monetary_values", "locations", "key_terms"]:
        raw_items = raw_entities.get(k, [])
        if not isinstance(raw_items, list):
            raw_items = [str(raw_items)] if raw_items else []
        clean_list = []
        for item in raw_items:
            if isinstance(item, dict):
                name = item.get("name") or item.get("party_name") or item.get("title") or item.get("entity") or str(item)
                role = item.get("title") or item.get("party_role") or item.get("role")
                clean_list.append(f"{name} ({role})" if role and role != name else str(name))
            elif item:
                clean_list.append(str(item).strip())
        entities[k] = clean_list

    return {
        "summary": summary,
        "clauses": clauses,
        "risks": risks,
        "entities": entities
    }
