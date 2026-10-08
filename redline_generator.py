"""
redline_generator.py — Direct Visual Redlining on Contract PDFs.
Draws visual red lines (strikethrough lines, highlight bounding boxes, and risk badges)
directly onto the original uploaded PDF across all risky text and clauses.
"""
import io
import os
import re
import json
import logging
from typing import List, Dict, Any, Union

import pymupdf as fitz

logger = logging.getLogger(__name__)

def find_clause_rects_on_page(page: fitz.Page, excerpt: str) -> List[fitz.Rect]:
    """
    Locates the bounding rectangles for a given risky excerpt on a PDF page.
    Uses multi-stage matching:
    1. Direct exact phrase search
    2. Sub-phrase search (5-word windows)
    3. Word-sequence matching across multi-line breaks
    """
    if not excerpt or not excerpt.strip():
        return []

    clean_excerpt = excerpt.strip()

    # 1. Direct search_for
    direct_rects = page.search_for(clean_excerpt)
    if direct_rects:
        return direct_rects

    words = clean_excerpt.split()
    if not words:
        return []

    # 2. Try sub-phrases (e.g. windows of 5 words)
    if len(words) >= 4:
        sub_rects = []
        seg_size = 5
        for k in range(0, len(words), seg_size):
            segment = " ".join(words[k:k + seg_size])
            if segment:
                r_seg = page.search_for(segment)
                if r_seg:
                    sub_rects.extend(r_seg)
        if sub_rects:
            return sub_rects

    # 3. Robust word sequence matcher (handles line wraps, extra whitespace, punctuation variances)
    raw_words = page.get_text("words")  # (x0, y0, x1, y1, word, block_no, line_no, word_no)
    if not raw_words:
        return []

    norm_target = [re.sub(r"[^\w]", "", w.lower()) for w in words if re.sub(r"[^\w]", "", w.lower())]
    if not norm_target:
        return []

    norm_page = []
    for w in raw_words:
        clean = re.sub(r"[^\w]", "", w[4].lower())
        norm_page.append({
            "clean": clean,
            "rect": fitz.Rect(w[0], w[1], w[2], w[3]),
            "line": (w[5], w[6])
        })

    n_target = len(norm_target)
    best_start = -1
    best_len = 0

    for i in range(len(norm_page)):
        matched = 0
        for j in range(min(n_target, len(norm_page) - i)):
            if norm_page[i + j]["clean"] == norm_target[j]:
                matched += 1
            else:
                break
        if matched > best_len:
            best_len = matched
            best_start = i

    # Require at least 3 matched words (or all words if target has fewer than 3)
    min_required = min(3, n_target)
    if best_len >= min_required:
        matched_slice = norm_page[best_start: best_start + best_len]
        # Group contiguous words by line into unified line rectangles
        lines: Dict[Any, fitz.Rect] = {}
        for item in matched_slice:
            ln = item["line"]
            if ln not in lines:
                lines[ln] = item["rect"]
            else:
                lines[ln] = lines[ln] | item["rect"]
        return list(lines.values())

    return []


def generate_redlined_pdf(pdf_source: Union[str, bytes], risks: List[Dict[str, Any]]) -> bytes:
    """
    Annotates the PDF document by drawing visible red strikethrough lines,
    red highlight rectangles, and risk warning tags directly over all risky text.
    Returns the marked-up PDF file as bytes.
    """
    try:
        if isinstance(pdf_source, str):
            doc = fitz.open(pdf_source)
        else:
            doc = fitz.open(stream=pdf_source, filetype="pdf")

        if not risks:
            logger.info("No risks provided to redline_generator.")
            output = io.BytesIO()
            doc.save(output)
            return output.getvalue()

        # Iterate through each detected risk
        for risk in risks:
            excerpt = risk.get("risky_excerpt", "")
            risk_level = risk.get("risk_level", "High").upper()
            clause_type = risk.get("clause_type", "Risky Clause").upper()
            if not excerpt:
                continue

            # Determine colors based on risk level
            if "HIGH" in risk_level:
                line_color = (0.85, 0.05, 0.05)      # Deep Red
                fill_color = (1.0, 0.88, 0.88)      # Light Red
                badge_bg   = (0.85, 0.05, 0.05)
            elif "MED" in risk_level:
                line_color = (0.85, 0.35, 0.0)       # Amber/Orange
                fill_color = (1.0, 0.93, 0.85)      # Light Amber
                badge_bg   = (0.85, 0.35, 0.0)
            else:
                line_color = (0.75, 0.55, 0.05)      # Golden Yellow
                fill_color = (1.0, 0.97, 0.88)
                badge_bg   = (0.75, 0.55, 0.05)

            # Search across all pages
            matched_on_any_page = False
            for page in doc:
                rects = find_clause_rects_on_page(page, excerpt)
                if not rects:
                    continue

                matched_on_any_page = True

                # Sort rects top-to-bottom
                rects.sort(key=lambda r: (r.y0, r.x0))

                for r in rects:
                    # 1. Draw subtle background highlight box
                    page.draw_rect(
                        r,
                        color=line_color,
                        fill=fill_color,
                        fill_opacity=0.35,
                        width=0.8
                    )

                    # 2. Draw prominent RED strikethrough line through center of line
                    y_mid = (r.y0 + r.y1) / 2.0
                    page.draw_line(
                        fitz.Point(r.x0, y_mid),
                        fitz.Point(r.x1, y_mid),
                        color=line_color,
                        width=2.2
                    )

                    # 3. Add native strikeout PDF annotation for Acrobat/Edge compatibility
                    try:
                        annot = page.add_strikeout_annot(r)
                        annot.set_colors(stroke=line_color)
                        annot.set_info(
                            content=f"RISK: {risk.get('why_risky', '')}\nREPLACEMENT: {risk.get('suggested_replacement', '')}",
                            title=f"{risk_level} - {clause_type}"
                        )
                        annot.update()
                    except Exception as annot_err:
                        logger.debug(f"Annotation notice: {annot_err}")

                # 4. Draw Risk Badge Tag above the first line
                first_r = rects[0]
                badge_w = min(160.0, max(110.0, len(clause_type) * 6.5 + 40.0))
                badge_h = 11.0
                badge_y0 = max(2.0, first_r.y0 - badge_h - 2.0)
                badge_rect = fitz.Rect(first_r.x0, badge_y0, first_r.x0 + badge_w, badge_y0 + badge_h)

                page.draw_rect(badge_rect, color=badge_bg, fill=badge_bg)
                badge_label = f"⚠ {risk_level} RISK · {clause_type[:15]}"
                page.insert_text(
                    fitz.Point(first_r.x0 + 4, badge_y0 + 8.5),
                    badge_label,
                    fontsize=6.5,
                    color=(1.0, 1.0, 1.0),
                    fontname="helv"
                )

        output = io.BytesIO()
        doc.save(output)
        doc.close()
        return output.getvalue()

    except Exception as e:
        logger.error(f"Error generating redlined PDF: {e}", exc_info=True)
        return b""


def generate_fallback_pdf_from_text(chunks_data: List[Dict[str, Any]], risks: List[Dict[str, Any]]) -> bytes:
    """
    Creates an A4 PDF from chunk texts if the original PDF is not on disk,
    and applies redline markings directly.
    """
    try:
        pages_dict: Dict[int, List[str]] = {}
        for c in chunks_data:
            p = c.get("page", 1)
            pages_dict.setdefault(p, []).append(c.get("text", ""))

        doc = fitz.open()
        for p_num in sorted(pages_dict.keys()):
            page = doc.new_page(width=595, height=842)  # Standard A4
            full_page_text = "\n\n".join(pages_dict[p_num])
            page.insert_textbox(
                fitz.Rect(50, 50, 545, 792),
                full_page_text,
                fontsize=10,
                fontname="helv"
            )

        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()

        # Annotate with red lines
        return generate_redlined_pdf(pdf_bytes.getvalue(), risks)
    except Exception as e:
        logger.error(f"Error synthesizing fallback redline PDF: {e}")
        return b""
