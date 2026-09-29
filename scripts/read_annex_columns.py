#!/usr/bin/env python
"""read_annex_columns.py -- read ISO/IEC 42001 Annex A controls COLUMN-WISE with PDFium char boxes.

Emits JSON on stdout: [{"clause", "title", "text", "page"}]. Reads only; writes nothing.

============ WHY COORDINATES AND NOT SPACES ============

The Node extractor infers columns from runs of spaces in `pdftotext -layout` output. That works on a
control's LEAD line and fails on its continuation lines, so the title's tail and the statement's tail
concatenate in reading order:

    title      "AI system requirements and spec-  The organization shall specify and document require-"
    statement  "...require-  ification  ments for new AI systems..."

Measured on page 25, the columns are at fixed x:

    control id   39.6 -  56.8
    title       107.7 - 251.2
    statement   266.2 - 515.3     a 15pt gap before "The organization"

So "on inThe organization" is the title column's tail abutting the statement column's head. Coordinates
separate them; spaces cannot, because on a continuation line there is no wide gap to find.

============ WHAT THIS REFUSES TO GUESS ============

A lead line with no statement column is a GROUP HEADING (A.6.1, A.6.2) -- a container. It is skipped and
counted, never emitted with an empty statement, because a container with a plausible-looking statement is
the junk-at-a-real-address defect.

PDFium returns U+FFFE for some glyphs. They are dropped at the source, not at the print: a noncharacter
inside a passage would reach the verbatim gate.
"""
import io
import json
import re
import sys

import pypdfium2 as pdfium

PDF = r"C:\Users\Juan\Documents\certidemy\iso-corpus\iso-iec-42001-2023.pdf"
BAD = {"\ufffe", "\uffff", "\x00"}
LEAD = re.compile(r"^\s*(A\.\d+(?:\.\d+){1,2})\s")
LINE_TOL = 3.0          # baseline clustering tolerance, points
MIN_COL_GAP = 10.0      # a column edge is a gap of at least this, to the right of the title start
TITLE_LEFT = 90.0       # the title column starts well right of the control id


def page_lines(tp):
    """Characters grouped into visual lines by baseline, each sorted left to right."""
    chars = []
    for k in range(tp.count_chars()):
        try:
            box = tp.get_charbox(k)
            ch = tp.get_text_range(k, 1)
        except Exception:
            continue
        if not box or not ch or ch in BAD:
            continue
        chars.append({"l": box[0], "b": box[1], "r": box[2], "t": box[3], "c": ch})
    chars.sort(key=lambda c: (-c["b"], c["l"]))
    lines = []
    for c in chars:
        if lines and abs(lines[-1]["b"] - c["b"]) <= LINE_TOL:
            lines[-1]["cs"].append(c)
        else:
            lines.append({"b": c["b"], "t": c["t"], "cs": [c]})
    for ln in lines:
        ln["cs"].sort(key=lambda c: c["l"])
        ln["txt"] = "".join(c["c"] for c in ln["cs"])
        ln["t"] = max(c["t"] for c in ln["cs"])
    return lines


def statement_left(ln):
    """The x where the statement column starts on this lead line, or None if there is no second column."""
    best = None
    prev = None
    for c in ln["cs"]:
        if prev is not None and c["l"] > TITLE_LEFT + 20 and (c["l"] - prev["r"]) >= MIN_COL_GAP:
            if best is None or (c["l"] - prev["r"]) > best[1]:
                best = (c["l"], c["l"] - prev["r"])
        prev = c
    return best[0] if best else None


def clean(s):
    """Join within a column: de-hyphenate a wrap, drop noncharacters, collapse whitespace."""
    for b in BAD:
        s = s.replace(b, "")
    s = re.sub(r"([A-Za-z])-\s+([a-z])", r"\1\2", s)
    return re.sub(r"\s+", " ", s).strip()


def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="strict")
    doc = pdfium.PdfDocument(PDF)
    out = []
    containers = []
    for pno in range(len(doc)):
        page = doc[pno]
        tp = page.get_textpage()
        if not re.search(r"\bA\.\d+\.\d+\b", tp.get_text_bounded() or ""):
            continue
        lines = page_lines(tp)
        leads = [(i, ln) for i, ln in enumerate(lines) if LEAD.match(ln["txt"])]
        if not leads:
            continue
        width = page.get_width()
        for n, (idx, ln) in enumerate(leads):
            clause = LEAD.match(ln["txt"]).group(1)
            sl = statement_left(ln)
            if sl is None:
                containers.append({"clause": clause, "page": pno})
                continue
            # the row's y-band: from this lead line's top down to the next lead line's top
            top = ln["t"] + 1.0
            if n + 1 < len(leads):
                bottom = leads[n + 1][1]["t"] + 1.0
            else:
                bottom = min(c["b"] for c in lines[-1]["cs"]) - 1.0
            title = tp.get_text_bounded(left=TITLE_LEFT, bottom=bottom, right=sl - 3.0, top=top)
            text = tp.get_text_bounded(left=sl - 1.0, bottom=bottom, right=width, top=top)
            out.append({"clause": clause, "page": pno, "statement_left": round(sl, 1),
                        "title": clean(title or ""), "text": clean(text or "")})
    json.dump({"source_id": "ISO/IEC 42001", "edition": "2023", "controls": out,
               "containers_skipped": containers}, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
