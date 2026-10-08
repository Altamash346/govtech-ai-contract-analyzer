"""
report_generator.py — Compiles AI analysis results into a downloadable PDF report.
Uses ReportLab to build a structured, multi-section PDF.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)


def _get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontSize=14,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a3c5e"),
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name="SubTitle",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#2c6fad"),
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name="BodySmall",
        fontSize=9,
        fontName="Helvetica",
        textColor=colors.black,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name="RiskHigh",
        fontSize=9,
        fontName="Helvetica",
        textColor=colors.red,
        spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        name="RiskMedium",
        fontSize=9,
        fontName="Helvetica",
        textColor=colors.HexColor("#e67e00"),
        spaceAfter=2
    ))
    return styles


def generate_report(
    filename: str,
    doc_type: str,
    summary: str,
    risks: list,
    clauses: list,
    entities: dict,
    qa_history: list,
    scheme_result: dict = None
) -> bytes:
    """
    Generate a PDF report and return it as bytes for download.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    styles = _get_styles()
    story = []

    # ── Cover Header ──────────────────────────────────────────────────────────
    story.append(Paragraph("AI Contract & Scheme Analysis Report", styles["Title"]))
    story.append(Paragraph(f"Document: {filename} | Type: {doc_type.upper()} | Generated: {datetime.now().strftime('%B %d, %Y %H:%M')}", styles["Normal"]))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a3c5e")))
    story.append(Spacer(1, 0.5*cm))

    # ── Section 1: Executive Summary ──────────────────────────────────────────
    story.append(Paragraph("1. Executive Summary", styles["SectionTitle"]))
    story.append(Paragraph(summary or "No summary generated.", styles["BodySmall"]))
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 0.3*cm))

    # ── Section 2: Risk Analysis ──────────────────────────────────────────────
    story.append(Paragraph("2. Risk Analysis", styles["SectionTitle"]))
    if risks:
        for risk in risks:
            level = risk.get("risk_level", "Unknown")
            risk_style = "RiskHigh" if level == "High" else ("RiskMedium" if level == "Medium" else "BodySmall")
            story.append(Paragraph(f"● [{level} RISK] {risk.get('clause_type', 'Unknown Clause')}", styles[risk_style]))
            story.append(Paragraph(f"<i>Risky Text:</i> \"{risk.get('risky_excerpt', '')}\"", styles["BodySmall"]))
            story.append(Paragraph(f"<b>Why Risky:</b> {risk.get('why_risky', '')}", styles["BodySmall"]))
            story.append(Paragraph(f"<b>Suggested Fix:</b> {risk.get('suggested_replacement', '')}", styles["BodySmall"]))
            story.append(Spacer(1, 0.3*cm))
    else:
        story.append(Paragraph("No significant risks detected.", styles["BodySmall"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 0.3*cm))

    # ── Section 3: Clause Classification ─────────────────────────────────────
    story.append(Paragraph("3. Clause Classification", styles["SectionTitle"]))
    if clauses:
        for clause in clauses:
            story.append(Paragraph(f"<b>{clause.get('clause_type', 'Clause')}:</b> {clause.get('summary', '')}", styles["BodySmall"]))
            excerpt = clause.get("verbatim_excerpt", "")
            if excerpt:
                story.append(Paragraph(f"<i>\"{excerpt}\"</i>", styles["BodySmall"]))
            story.append(Spacer(1, 0.2*cm))
    else:
        story.append(Paragraph("No clauses classified.", styles["BodySmall"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 0.3*cm))

    # ── Section 4: Key Entities ───────────────────────────────────────────────
    story.append(Paragraph("4. Key Entities Extracted", styles["SectionTitle"]))
    if entities:
        entity_data = [["Category", "Values"]]
        for key, values in entities.items():
            if values:
                entity_data.append([key.replace("_", " ").title(), ", ".join(str(v) for v in values)])
        if len(entity_data) > 1:
            table = Table(entity_data, colWidths=[5*cm, 12*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3c5e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
            ]))
            story.append(table)
    else:
        story.append(Paragraph("No entities extracted.", styles["BodySmall"]))
    story.append(Spacer(1, 0.5*cm))

    # ── Section 5: Scheme Eligibility (if applicable) ─────────────────────────
    if scheme_result:
        story.append(PageBreak())
        story.append(Paragraph("5. Scheme Eligibility Result", styles["SectionTitle"]))
        score = scheme_result.get("match_score", 0)
        story.append(Paragraph(f"<b>Match Score: {score}%</b> | Eligible: {'Yes ✓' if scheme_result.get('eligible') else 'No ✗'}", styles["SubTitle"]))
        story.append(Paragraph(scheme_result.get("recommendation", ""), styles["BodySmall"]))
        story.append(Spacer(1, 0.3*cm))
        if scheme_result.get("criteria_met"):
            story.append(Paragraph("Criteria Met:", styles["SubTitle"]))
            for c in scheme_result["criteria_met"]:
                story.append(Paragraph(f"✅ {c.get('criterion', '')} — {c.get('evidence', '')}", styles["BodySmall"]))
        if scheme_result.get("criteria_failed"):
            story.append(Paragraph("Criteria Not Met:", styles["SubTitle"]))
            for c in scheme_result["criteria_failed"]:
                story.append(Paragraph(f"❌ {c.get('criterion', '')} — {c.get('reason', '')}", styles["RiskHigh"]))

    # ── Section 6: Q&A History ────────────────────────────────────────────────
    if qa_history:
        story.append(PageBreak())
        story.append(Paragraph("6. Q&A Session History", styles["SectionTitle"]))
        for i, qa in enumerate(qa_history, 1):
            story.append(Paragraph(f"Q{i}: {qa.get('question', '')}", styles["SubTitle"]))
            story.append(Paragraph(f"A: {qa.get('answer', '')}", styles["BodySmall"]))
            if qa.get("citations"):
                story.append(Paragraph(f"<i>Sources: Pages {', '.join(str(p) for p in qa['citations'])}</i>", styles["BodySmall"]))
            story.append(Spacer(1, 0.3*cm))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
