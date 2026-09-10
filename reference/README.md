# reference/

Third-party normative documents, verbatim. **Nothing in this folder is a Certidemy
work product**, which is why it is not in `jta/` — everything there is ours, and
*"the Guide says"* and *"our JTA says"* are different kinds of claim that a shared
directory would blur.

---

## `scrum-guide-2020.pdf` / `scrum-guide-2020.txt`

**The 2020 Scrum Guide. This is the source of truth for every claim about what Scrum
requires, permits, or does not mention.**

| | |
|---|---|
| Title | *The Scrum Guide — The Definitive Guide to Scrum: The Rules of the Game* |
| Authors | Ken Schwaber & Jeff Sutherland |
| Edition | **November 2020** — confirmed from the title page, not from the filename |
| Pages | 14 of content (15 page objects; the last is blank) |
| Words | 4,050 |
| Source | https://scrumguides.org/scrum-guide.html |
| Added | 2026-09-10 |

### Licence — why this is committed rather than gitignored

The Guide carries its own licence, on page 2 and again on page 14:

> *"This publication is offered for license under the **Attribution Share-Alike license
> of Creative Commons**, accessible at
> https://creativecommons.org/licenses/by-sa/4.0/legalcode and also described in summary
> form at https://creativecommons.org/licenses/by-sa/4.0/. By utilizing this Scrum Guide,
> you acknowledge and agree that you have read and agree to be bound by the terms of the
> Attribution Share-Alike license of Creative Commons."*

**CC BY-SA 4.0 expressly permits redistributing a verbatim copy with attribution
preserved**, and the attribution is inside the document. A gitignored copy would also
fail the requirement this exists to meet - that every session finds it - because a path
that exists on one machine is the dependency that breaks on a fresh clone.

### Which file to grep

**Grep `scrum-guide-2020.txt`.** It is the reflowed extraction: prose paragraphs are one
per line, so a fixed-string search for a sentence inside a paragraph matches.

A `-layout` extraction also exists in working notes and is **not** committed, because it
preserves the two-column contents page and wraps every sentence at PDF line breaks.

### BULLET LISTS STILL BREAK MID-SENTENCE, AND THAT IS WHERE YOU WILL WANT TO LOOK

**Reflowing joins paragraphs. It does not join bullets**, and 14 lines in this file end
mid-sentence - the licence block, the contents page, and **the Scrum Master service
lists**, which is the highest-traffic Guide territory in this scheme:

```
line 81 ends: ...understand and enact an empirical approach for complex
line 82 starts: work; and,  Removing barriers between stakeholders and Scrum Teams.
```

So `grep -F "Helping employees and stakeholders understand and enact an empirical approach
for complex work"` **returns 0, and the sentence is there.** That is a false absence, in
the exact shape `STYLE-GUIDE-SM-AI-II.md` §0.1 warns about: the pattern was wrong, not the
corpus. It was found on the instrument's first full lesson.

**When a search that should hit returns nothing, flatten before concluding:**

```
tr -d '\r' < reference/scrum-guide-2020.txt | tr '\n' ' ' | tr -s ' ' > /tmp/guide-flat.txt
grep -c -F "the sentence you are checking" /tmp/guide-flat.txt
```

All five sentences above - including the two that span a line break - return 1 against the
flattened form. **Search the line file first; flatten before recording an absence.**

### Reproducing the extraction

```
pdftotext scrum-guide-2020.pdf scrum-guide-2020.txt
```

`pdftotext` version 4.00 (Glyph & Cog). No flags. The `-layout` flag produces a
different, worse file for this purpose.

| file | md5 |
|---|---|
| `scrum-guide-2020.pdf` | `641355a705caf4d1b6820768da684ed0` |
| `scrum-guide-2020.txt` | `c69676b0a490c2f341df8501737f940a` |

**`.gitattributes` marks both files `-text`/`binary`** so git does not normalise line
endings on checkout. Without it the `.txt` is stored LF, checked out CRLF on Windows, and
the md5 above is true on one platform and false on another - **a verification instruction
that fails for the reader who most needs it.** The PDF md5 is the durable one; the `.txt`
is derivative.

### Verify the extraction before trusting it

**Three sentences known verbatim from independent verification. All three must match as
fixed strings**, and a fourth check must find nothing:

```
grep -c -F "A Sprint could be cancelled if the Sprint Goal becomes obsolete." scrum-guide-2020.txt
grep -c -F "The Sprint is a container for all other events." scrum-guide-2020.txt
grep -c -F "The Product Owner may do the above work or may delegate the responsibility to others." scrum-guide-2020.txt
grep -c    "have the Scrum Team do it\|have the Development Team do it" scrum-guide-2020.txt
```

Expect `1`, `1`, `1`, `0`. **The fourth is the negative control**: that sentence is the
2017 Guide's wording, and finding it would mean the wrong edition is in this folder.

### Encoding

**The Guide's own text is pure ASCII.** No curly apostrophes, no curly quotes, no em
dashes. The only two non-ASCII bytes in the file are the `(c)` symbols in the two
copyright lines, which extract as U+FFFD.

That matters in practice: **a pattern copied out of a lesson will match**, with none of
the smart-quote defeats that make mojibake detection necessary elsewhere in this repo.

### What this replaced, and why the folder exists at all

Every Guide verification before 2026-09-10 went through a URL fetch answered by a
summarizer. **That instrument failed four times**, each recorded in
`STYLE-GUIDE-SM-AI-II.md` §0.1: a miscounted term, a finding that a word was not the
Guide's when it opens a section heading, and two absence claims that could never be
established because a section read is a sample.

All four resolve here in under a second:

```
$ grep -o "forecast[a-z]*" scrum-guide-2020.txt | sort | uniq -c
      1 forecast          "Various practices exist to forecast progress..."
      1 forecasts         "...the more confident they will be in their Sprint forecasts."

$ grep -n "container" scrum-guide-2020.txt
     84: The Sprint is a container for all other events.
    157: Scrum exists only in its entirety and functions well as a container for
         other techniques, methodologies, and practices.

$ grep -c "assign"  scrum-guide-2020.txt     ->  0
$ grep -c "escalat" scrum-guide-2020.txt     ->  0
```

**The last two are the change that matters.** Against a summarizer an absence could only
ever be left unfalsified; against a complete local document it is a positive result. A
negative claim now costs exactly what a positive one costs.
