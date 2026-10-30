"""
redline_generator.py — Direct Visual Redlining on Contract PDFs.
Draws clean visual red highlights and risk badges (no cutting lines)
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

def find_clause_rects_on_page(page: fitz.Page, excerpt: str, ocr_tp=None) -> List[fitz.Rect]:
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

    # If the page is a scanned image with no/sparse text, use an OCR textpage
    if ocr_tp is None and len(page.get_text().strip()) < 30:
        try:
            ocr_tp = page.get_textpage_ocr(dpi=150)
        except Exception as ocr_e:
            logger.debug(f"OCR textpage notice on page: {ocr_e}")

    tp_kw = {"textpage": ocr_tp} if ocr_tp is not None else {}

    # 1. Direct search_for
    direct_rects = page.search_for(clean_excerpt, **tp_kw)
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
                r_seg = page.search_for(segment, **tp_kw)
                if r_seg:
                    sub_rects.extend(r_seg)
        if sub_rects:
            return sub_rects

    # 3. Robust word sequence matcher (handles line wraps, extra whitespace, punctuation variances)
    raw_words = page.get_text("words", **tp_kw)  # (x0, y0, x1, y1, word, block_no, line_no, word_no)
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
    Annotates the PDF document by drawing clean translucent red highlights
    and risk warning tags directly over all risky text without cutting strikethroughs.
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

        # Pre-cache OCR textpages for scanned pages once to ensure maximum performance
        ocr_cache = {}
        for page in doc:
            if len(page.get_text().strip()) < 30:
                try:
                    ocr_cache[page.number] = page.get_textpage_ocr(dpi=150)
                except Exception:
                    pass

        # Iterate through each detected risk
        for risk in risks:
            excerpt = risk.get("risky_excerpt", "")
            risk_level = risk.get("risk_level", "High").upper()
            clause_type = risk.get("clause_type", "Risky Clause").upper()
            if not excerpt:
                continue

            # Determine colors based on risk level (clean translucent highlights)
            if "HIGH" in risk_level:
                fill_color   = (1.0, 0.15, 0.15)      # Clear Vivid Red Highlight
                fill_opacity = 0.28
                badge_bg     = (0.85, 0.05, 0.05)
            elif "MED" in risk_level:
                fill_color   = (1.0, 0.55, 0.05)      # Clear Amber/Orange Highlight
                fill_opacity = 0.28
                badge_bg     = (0.85, 0.35, 0.0)
            else:
                fill_color   = (0.95, 0.80, 0.05)      # Clear Golden Yellow Highlight
                fill_opacity = 0.32
                badge_bg     = (0.75, 0.55, 0.05)

            # Search across all pages
            matched_on_any_page = False
            for page in doc:
                rects = find_clause_rects_on_page(page, excerpt, ocr_tp=ocr_cache.get(page.number))
                if not rects:
                    continue

                matched_on_any_page = True

                # Sort rects top-to-bottom
                rects.sort(key=lambda r: (r.y0, r.x0))

                for r in rects:
                    # Draw clean translucent red highlight directly over the text (NO strikethrough cut line, NO borders)
                    page.draw_rect(
                        r,
                        color=None,
                        fill=fill_color,
                        fill_opacity=fill_opacity
                    )

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
