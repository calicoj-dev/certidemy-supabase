# Extraction backlog — closed for this cycle

**Ruled PROMPT-91 s1. No more work on extraction this cycle.** `quote-noise` refuses a span carrying
noise, and the served bank is clean (28,181 rows, 155,863 served spans, zero hits). The rollout table
counts `quote-noise` rejections per task, and that count is what will say later whether this repair is
worth money.

This file exists so the next attempt starts from evidence rather than from the beginning.

---

## What is wrong, and it is ONE defect with four symptoms

The Annex A control table is **two columns**, and the Node extractor infers columns from runs of spaces in
`pdftotext -layout` output. That works on a control's **lead line** and fails on its **continuation
lines**, where there is no wide gap to find. The two columns then concatenate in reading order.

Measured, ISO/IEC 42001 `A.6.2.2`:

```
title : "AI system requirements and spec-  The organization shall specify and document require-"
text  : "AI system requirements and spec-  The organization shall specify and document require-
         ification ments for new AI systems or material enhancements to existing systems."
```

Correct: title *"AI system requirements and specification"*, text *"The organization shall specify and
document requirements for new AI systems or material enhancements to existing systems."*

The title's continuation (`ification`) and the statement's (`ments for...`) interleave. That single defect
produces `column-interleave`, `hyphen-break` and `run-together` together, so four census signatures are
not four jobs.

## The column geometry, measured — start here

PDFium (`pypdfium2` 5.13.0) **does** open `iso-iec-42001-2023.pdf`: 62 pages. pdfminer/pdfplumber does
not — it reports an empty catalog and zero pages, and `repair=True` needs Ghostscript, which is not
installed. Xpdf's `pdftotext` reads it fine. Two parsers, one file, opposite answers.

Page 25, the `A.5.4` lead line, from `get_charbox`:

| column | x range |
|---|---|
| control id | 39.6 – 56.8 |
| title | 107.7 – 251.2 |
| statement | **266.2** – 515.3 |

The gap before the statement column is **15pt**. Line clustering that works: sort by baseline descending,
group within **3pt**, sort each line left to right. That yields 59 lines and 4 lead lines on page 25.

`scripts/read_annex_columns.py` holds this and is read-only. It is **not** a working extractor — see below.

## The three defects in that reader, which is where the next attempt must begin

1. **Missed lead lines.** It matches a lead line by its *text* starting with a control id. Where the id
   clusters as its own line, that test never fires: **9 of ~38 controls detected**. Detect the lead by the
   id's **x-position** (the leftmost column, ~39.6) instead of by line text.

2. **Band overrun.** The row's y-band runs from one lead line to the next, so with 4 leads found where
   there are a dozen, a band spans several controls: `A.5.4`'s title came back carrying `A.5.5`'s and
   more. Fixing (1) mostly fixes this, but the band still needs a floor at the page's content bottom.

3. **U+0002 inside words.** PDFium returns control bytes mid-word — `"individuals"`. The filter
   dropped U+FFFE and U+FFFF only. **Drop every C0 control byte except tab, LF and CR**, at the source: a
   control byte inside a passage reaches the verbatim gate and `check-control-bytes` does not scan
   `SOURCE-PASSAGES.json`.

## Scope when it resumes

**54 damaged passages are primary for a task** of the four ISO certifications, of 125 damaged in the
library. `DAMAGED-PRIMARIES.md` lists them. **33 of the 54 are in 42001** — the file only PDFium opens.
The other 21 are reachable with pdfplumber today.

The remaining 71 damaged passages are supporting-only or unlinked and cost nothing: nothing can anchor
in them.

## What is already protected

- `quote-noise` (18 controls) refuses any key or distractor support span carrying a signature. The two
  task 1.3 items held for cue flags **also** failed this gate independently, on A.6.2.3's `"docu- mented"`.
- `served-noise` (7 controls) refuses the same signatures in a stem, an option, or a practice explanation.
- The served bank was swept: **zero** extraction noise reaches a candidate.
