#!/usr/bin/env python
"""
decolumn-a54.py -- recover ISO/IEC 42001 Annex A control A.5.4 from the PDF's own character coordinates.

READ-ONLY on the PDF. Prints one JSON override candidate to stdout; the Node side applies it.

============ WHY COORDINATES, AND WHY pypdfium2 ============

Ruled PROMPT-98 s3. A.5.4 is held in the library as:

    title: ""
    text:  "Assessing AI system impact on inThe organization shall assess and document the potential
            dividuals or groups of individuals impacts of AI systems to individuals or groups of
            individuals throughout the system's life cycle."

Table A.1 has TWO COLUMNS -- Topic on the left, Control on the right. `pdftotext -layout` interleaved them:
the title wrapped and hyphenated as "in|dividuals", and the statement was spliced into the middle of that word.
The title ended up EMPTY and the statement ended up carrying fragments of the title.

CLAUDE.md records that `pdfplumber` reads ZERO pages from this document -- pdfminer reports its catalog as
empty -- so the coordinate route was declared unreachable for 42001. **pypdfium2 reads all 62 pages.**
Measured, not assumed, and it is the only reason this repair is possible.

============ CHARACTER BOXES, NOT RECTS ============

My first version used `count_rects()` / `get_rect()`. Those are TEXT RUNS, not words: the whole two-column row
came back as seven rects and the "widest gap" between them was 250pt of nothing. The column detection was
meaningless and the output interleaved exactly as badly as pdftotext had.

`get_charbox(i)` gives a box PER CHARACTER, which is the primitive that actually carries the geometry.
Characters are grouped into lines by their y centre and into columns by x.

============ THE SPLIT IS FOUND IN THE DATA, NOT PICKED ============

The row's characters cluster into two x bands with an empty corridor between them. The boundary is the midpoint
of the widest corridor that no character crosses. A hand-picked x is a number that works on this page and
breaks on the next.
"""
import json
import os
import re
import sys

import pypdfium2 as pdfium

PDF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                   "iso-corpus", "iso-iec-42001-2023.pdf")
CLAUSE = "A.5.4"
NEXT_LABEL = re.compile(r"^A\.\d")


def chars_on_page(page):
    """(char, x_left, x_right, y_centre) for every character, from the PDF's own boxes."""
    tp = page.get_textpage()
    text = tp.get_text_range()
    out = []
    for i, ch in enumerate(text):
        if ch in "\r\n":
            continue
        try:
            l, b, r, t = tp.get_charbox(i)
        except Exception:
            continue
        if r <= l:
            continue
        out.append({"c": ch, "l": l, "r": r, "y": (b + t) / 2.0})
    return out


def group_lines(chars, tol=2.5):
    """Characters into visual lines by y centre, each line left-to-right."""
    lines = []
    for ch in sorted(chars, key=lambda c: (-c["y"], c["l"])):
        if lines and abs(lines[-1]["y"] - ch["y"]) <= tol:
            lines[-1]["chars"].append(ch)
            lines[-1]["y"] = (lines[-1]["y"] + ch["y"]) / 2.0
        else:
            lines.append({"y": ch["y"], "chars": [ch]})
    for ln in lines:
        ln["chars"].sort(key=lambda c: c["l"])
        ln["text"] = "".join(c["c"] for c in ln["chars"])
    return lines


def widest_corridor(chars):
    """Midpoint of the widest x interval no character occupies."""
    spans = sorted((c["l"], c["r"]) for c in chars)
    best = (0.0, None)
    cur = spans[0][1]
    for l, r in spans[1:]:
        if l > cur:
            gap = l - cur
            if gap > best[0]:
                best = (gap, (cur + l) / 2.0)
        cur = max(cur, r)
    return best


def clean(s):
    """Collapse whitespace, drop control bytes, and normalise the quotation mark the font encodes oddly."""
    # control bytes AND the noncharacters this font emits. U+FFFE appeared in the first run and killed the
    # writer on a cp1252 console -- a transport failure on the way OUT of the extractor, not in the PDF.
    s = "".join(ch for ch in s
                if (ch >= " " or ch == "\t")
                and not (0xFDD0 <= ord(ch) <= 0xFDEF)
                and (ord(ch) & 0xFFFE) != 0xFFFE)
    s = s.replace("", "'").replace("�", "'")
    return re.sub(r"\s+", " ", s).strip()


def main():
    doc = pdfium.PdfDocument(PDF)
    page_i = None
    for i in range(len(doc)):
        txt = doc[i].get_textpage().get_text_range()
        if CLAUSE in txt and "Assessing AI system impact" in txt:
            page_i = i
            break
    if page_i is None:
        print(json.dumps({"error": "A.5.4 and its title are not on any one page"}))
        return 2

    lines = group_lines(chars_on_page(doc[page_i]))

    # the row: from the line carrying A.5.4 down to the line before the next A.x label
    start = next((k for k, ln in enumerate(lines) if CLAUSE in ln["text"]), None)
    if start is None:
        print(json.dumps({"error": "no line carries the clause label", "page": page_i}))
        return 2
    end = len(lines)
    for k in range(start + 1, len(lines)):
        stripped = lines[k]["text"].lstrip()
        if NEXT_LABEL.match(stripped) and not stripped.startswith(CLAUSE):
            end = k
            break
    row_lines = lines[start:end]
    row_chars = [c for ln in row_lines for c in ln["chars"]]
    if not row_chars:
        print(json.dumps({"error": "the row has no characters", "page": page_i}))
        return 2

    # the clause label itself is part of neither column
    label_right = 0.0
    for ln in row_lines:
        t = ln["text"]
        if CLAUSE in t:
            j = t.index(CLAUSE)
            label_right = max(label_right, ln["chars"][min(j + len(CLAUSE), len(ln["chars"])) - 1]["r"])
            break
    body = [c for c in row_chars if c["l"] >= label_right - 0.5]
    gap, split = widest_corridor(body)
    if split is None:
        print(json.dumps({"error": "no corridor: the row is one column", "page": page_i}))
        return 2

    # ============ A WRAP INSIDE A WORD WITH NO HYPHEN, AND THE DOCUMENT SETTLES IT ============
    #
    # A narrow table cell wraps mid-word and the PDF carries NO hyphen, so the column came out as
    # "Assessing AI system impact on in dividuals or groups" and "individu als throughout". Joining on a
    # hyphen cannot see it, and joining every line break would destroy real word boundaries.
    #
    # The document decides. Measured over all 62 pages:
    #
    #     individuals  53      <- a real word of this document
    #     dividuals     1      individu  1      als  1      <- each occurs ONLY in this cell
    #
    # So: join the tail of one line to the head of the next when BOTH fragments are rare (they appear once,
    # here) and the concatenation is a word the document uses repeatedly. That is evidence, not a guess, and it
    # refuses to join two ordinary words -- "on" + "individuals" would fail the test on both halves.
    vocab = {}
    for i in range(len(doc)):
        for t in re.findall(r"[A-Za-z]{2,}", doc[i].get_textpage().get_text_range()):
            t = t.lower()
            vocab[t] = vocab.get(t, 0) + 1
    RARE = 2          # a fragment created by this wrap appears once; anything commoner is a real word

    def joinable(tail, head):
        """The HEAD carries the evidence. The tail's own frequency is irrelevant.

        My first version required BOTH fragments to be rare, and it repaired the statement
        ("individu|als") while leaving the title broken ("in|dividuals") -- because "in" is a real word with 255
        occurrences, so the tail test refused. The tail of a wrapped word can be an ordinary word; what cannot
        happen is a line BEGINNING with a fragment the document never uses. That is the discriminator, and it
        is one condition rather than two.

        It still refuses an ordinary break: "of" / "individuals" fails because the head occurs 53 times.
        """
        a, b = tail.lower(), head.lower()
        if not a.isalpha() or not b.isalpha():
            return False
        if vocab.get(b, 0) >= RARE:
            return False
        return vocab.get(a + b, 0) >= RARE

    def column(pred):
        parts = []
        for ln in row_lines:
            seg = "".join(c["c"] for c in ln["chars"] if c["l"] >= label_right - 0.5 and pred(c))
            seg = clean(seg)
            if not seg:
                continue
            if parts and parts[-1].endswith("-"):
                parts[-1] = parts[-1][:-1] + seg
                continue
            if parts:
                tail = parts[-1].split(" ")[-1]
                head = seg.split(" ")[0]
                if joinable(tail, head):
                    parts[-1] = parts[-1][: -len(tail)] + tail + head
                    seg = seg[len(head):].strip()
                    if seg:
                        parts[-1] += " " + seg
                    continue
            parts.append(seg)
        return clean(" ".join(parts))

    title = column(lambda c: c["r"] <= split)
    text = column(lambda c: c["l"] > split)
    out = {
        "clause": CLAUSE,
        "page_index": page_i,
        "column_split_x": round(split, 2),
        "corridor_width_pt": round(gap, 2),
        "row_lines": len(row_lines),
        "title": title,
        "text": text,
    }
    # WRITTEN TO A FILE in utf-8, never to stdout. This console is cp1252 and the first run died ENCODING the
    # output rather than producing it -- the same transport class as every other note in CLAUDE.md, on the way
    # out instead of the way in.
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "A54-DECOLUMNED.json")
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print("wrote A54-DECOLUMNED.json  page=" + str(page_i) +
          "  split=" + str(round(split, 2)) + "  corridor=" + str(round(gap, 2)) + "pt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
