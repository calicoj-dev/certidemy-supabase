/**
 * check-cited-clauses-resolve.mjs -- does every clause the live bank cites resolve to
 * a passage in the library? And which sources does the bank cite that we do not hold?
 *
 * READ-ONLY. Unknown flags exit 2. This is section 1's assertion and gap report.
 *
 * ============ WHAT A "GAP" IS AND WHAT IT IS NOT ============
 *
 * Three different things look the same from a distance and need opposite responses:
 *
 *   UNRESOLVED   the source IS held and the clause is not in it. Either the item
 *                invented the address or the extractor missed it -- and those need
 *                opposite fixes, so the two are separated by checking whether any
 *                NEIGHBOURING clause of the same document resolved.
 *   UNHELD       the source is not on disk at all. Nothing can be checked. Report the
 *                item count that depends on it and let Juan decide what to acquire.
 *   UNCITED      a passage nothing cites. Not a defect; the library is allowed to be
 *                larger than the bank.
 *
 * Reporting one number for all three is the collapse this repository keeps paying for.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY"); process.exitCode = 2; process.exit();
}

/* ASSEMBLED FROM CHARACTER CODES, NEVER TYPED. A zero-width space written into a source
 * literal is invisible, survives review, and is what invariant 10 exists to catch -- and
 * I had just typed four of them into this regex. The characters are U+200B/C/D and the
 * byte-order mark; they sit between an ISO heading's number and its title and must come
 * out before any heading match. */
const ZERO_WIDTH = new RegExp("[" +
  [0x200b, 0x200c, 0x200d, 0xfeff].map((c) => String.fromCharCode(c)).join("") + "]", "g");

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const held = new Map();      // "source|edition" -> Set(clause)
const heldSources = new Set();
for (const p of lib.passages) {
  heldSources.add(p.source_id);
  const k = p.source_id;
  if (!held.has(k)) held.set(k, new Set());
  held.get(k).add(p.clause);
}

/* ============ THE CITATION VOCABULARY ============
 *
 * A standard is named many ways in item text. These patterns map a mention to the
 * library's source_id, and the ones with no library entry are the gap list. Each
 * carries the ADDRESS SHAPE it can be followed by, because a bare decimal near a
 * standard name is not an address -- the anchored-address rule already recorded here.
 */
const SOURCES = [
  { id: "ISO/IEC 42001", held: true, re: /\b(?:ISO\/IEC\s*)?42001\b/gi },
  { id: "ISO/IEC 27001", held: true, re: /\b(?:ISO\/IEC\s*)?27001\b/gi },
  { id: "ISO/IEC 27002", held: true, re: /\b(?:ISO\/IEC\s*)?27002\b/gi },
  { id: "ISO 19011", held: true, re: /\b(?:ISO\s*)?19011\b/gi },
  { id: "Scrum Guide", held: true, re: /\bScrum Guide\b/gi },
  /* NOT HELD -- these are the acquisition decisions */
  { id: "ITIL 4", held: false, re: /\bITIL\b/gi },
  { id: "EU AI Act", held: false, re: /\b(?:EU\s*)?AI Act\b/gi },
  { id: "NYC Local Law 144", held: false, re: /\bLL\s*144\b|\bLocal Law 144\b/gi },
  { id: "Colorado SB 24-205", held: false, re: /\bSB\s*24-205\b/gi },
  { id: "ISO/IEC 17021", held: false, re: /\b17021\b/gi },
  { id: "ISO/IEC 17024", held: false, re: /\b17024\b/gi },
  { id: "EBM Guide", held: false, re: /\bEvidence[- ]Based Management\b|\bEBM\b/g },
  { id: "ISO/IEC 20000", held: false, re: /\b20000\b/gi },
  { id: "ISO/IEC 22989", held: false, re: /\b22989\b/gi },
  { id: "NIST AI RMF", held: false, re: /\bNIST AI RMF\b|\bAI RMF\b/gi },
];

/* ============ AN UNQUALIFIED CLAUSE REFERENCE MEANS THE CERTIFICATION'S OWN STANDARD
 *
 * CLAUDE.md records this rule and the first version of this script did not apply it, so
 * 96 distinct addresses landed in a bucket labelled "no held source named" and were
 * reported as unattributable. They are not: an ISMS-IA item writing "clause 8.2 requires"
 * means ISO/IEC 27001, and an AIMS-F item means ISO/IEC 42001. The default is per
 * certification and it is the only thing that makes a bare address checkable at all.
 *
 * The auditor certifications are the hard case: they examine an auditing standard AND a
 * management-system standard, so a bare address there is genuinely ambiguous between two
 * documents whose clause 4 and clause 5 collide. Those keep the ambiguous bucket rather
 * than being guessed -- which is the (standard, address) keying rule, not a shortfall. */
const CERT_STANDARD = {
  "AIMS-F": "ISO/IEC 42001",
  "ISMS-F": "ISO/IEC 27001",
  "AIMS-IA": null,   /* 42001 + 19011 -- ambiguous by construction */
  "ISMS-IA": null,   /* 27001 + 19011 -- ambiguous by construction */
};

/* An address is ANCHORED: introduced by clause/annex/control/section/subclause, or
 * carrying a lettered sub-item. A bare decimal is a number. */
const ADDRESS = /\b(?:clause|clauses|annex|control|controls|section|subclause)\s+((?:A|B)?\.?\d+(?:\.\d+){0,3})/gi;

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("check-cited-clauses-resolve");
try {
  const certs = await getAll(KEY, "certifications?select=id,code&order=code");
  const codeOf = new Map(certs.map((c) => [c.id, c.code]));
  /* English only: a citation is a property of the item, and the translations carry the
   * same addresses. Narrow columns, because the wide read on this table times out. */
  const rows = await getAll(KEY,
    "quiz_questions?select=id,certification_id,question_text,options,explanation&language=eq.en&status=eq.approved&retired_at=is.null&order=id");

  const textOf = (q) => [String(q.question_text || ""), String(q.explanation || ""),
    ...(Array.isArray(q.options) ? q.options.map((o) => String((o && o.text) || "")) : [])].join("\n");

  const citedBySource = new Map();   // source -> Map(clause -> count)
  const itemsBySource = new Map();   // source -> Map(cert -> Set(itemId))
  for (const q of rows) {
    const t = textOf(q);
    const cert = codeOf.get(q.certification_id);
    /* which sources this item mentions */
    const mentioned = SOURCES.filter((s) => { s.re.lastIndex = 0; return s.re.test(t); });
    for (const s of mentioned) {
      if (!itemsBySource.has(s.id)) itemsBySource.set(s.id, new Map());
      const m = itemsBySource.get(s.id);
      if (!m.has(cert)) m.set(cert, new Set());
      m.get(cert).add(q.id);
    }
    /* addresses, attributed to the ONLY mentioned held source when unambiguous.
     * With two held sources mentioned there is no way to tell which an address
     * belongs to, so it is counted as AMBIGUOUS rather than guessed -- the
     * standard-collision rule this repository records for clause 4.x. */
    const heldMentioned = mentioned.filter((s) => s.held);
    ADDRESS.lastIndex = 0;
    let m;
    while ((m = ADDRESS.exec(t)) !== null) {
      const clause = m[1].replace(/^\./, "").replace(/^([AB])(\d)/, "$1.$2");
      const target = heldMentioned.length === 1 ? heldMentioned[0].id
        : (heldMentioned.length === 0 ? (CERT_STANDARD[cert] || null) : null);
      const key = target || "(ambiguous: " + (heldMentioned.map((s) => s.id).join(" + ") || "no held source named") + ")";
      if (!citedBySource.has(key)) citedBySource.set(key, new Map());
      const cm = citedBySource.get(key);
      cm.set(clause, (cm.get(clause) || 0) + 1);
    }
  }

  console.log("CITED CLAUSES vs THE LIBRARY -- read-only");
  console.log("  library            " + lib.passages.length + " passages across " + heldSources.size + " sources");
  console.log("  live English items " + rows.length);
  console.log("");

  /* ============ FIVE STATES, AND THE SIBLING HEURISTIC WAS WORTH NOTHING ============
   *
   * The first version of this asked whether any clause sharing a top-level number had
   * resolved, and called the address INVENTED if so. It reported 78 invented addresses,
   * and reading the members showed almost none was:
   *
   *   "clause 8" of ISO/IEC 42001, cited 33 times -- a CONTAINER. The library splits it
   *      into 8.1 to 8.4, so the parent has no row of its own and never will.
   *   "control 5.35" of ISO/IEC 27001, cited 13 times -- an ANNEX CONTROL cited without
   *      its A. prefix, which is how practitioners write it. A.5.35 is in the library.
   *   "clause 10.1", cited 4 times -- real, and my extractor missed it.
   *
   * One heuristic, three causes, three different fixes, and the label named none of
   * them. So the classifier asks the DOCUMENT instead: is there a heading for this
   * address in the source's own text? That is a direct measurement rather than a guess
   * about neighbours, and the only remaining judgement is between an extractor gap and
   * an address the standard does not contain.
   *
   * A NEGATIVE ANSWER NEEDS A POSITIVE CONTROL, so each document's probe must first
   * find a heading known to be present; if it cannot, every NOT IN THE DOCUMENT verdict
   * from that document is discarded as UNVERIFIABLE rather than reported.
   */
  const docText = new Map();
  const probeOk = new Map();
  const PROBE_CONTROL = {
    "ISO/IEC 42001": "9.3.2", "ISO/IEC 27001": "4.3",
    "ISO/IEC 27002": "5.1", "ISO 19011": "5.1",
  };
  const PDF = {
    "ISO/IEC 42001": "iso-iec-42001-2023.pdf", "ISO/IEC 27001": "iso-iec-27001-2022.pdf",
    "ISO/IEC 27002": "iso-iec-27002-2022.pdf", "ISO 19011": "iso-19011-2026.pdf",
  };
  const CORPUS = join(ROOT, "..", "iso-corpus");
  const headingIn = (sid, addr) => {
    if (!docText.has(sid)) {
      let t = "";
      try {
        t = execFileSync("pdftotext", ["-q", "-enc", "UTF-8", join(CORPUS, PDF[sid] || ""), "-"],
          { encoding: "utf8", maxBuffer: 268435456 });
      } catch { t = ""; }
      /* Zero-width characters sit between a number and its title -- the defect that
       * made the extractor under-cover every document. Strip before matching. */
      t = t.replace(ZERO_WIDTH, "");
      const lines = t.split(/\r?\n/).filter((l) => !/\.{4,}\s*\d+\s*$/.test(l));
      docText.set(sid, lines);
      const ctl = PROBE_CONTROL[sid];
      probeOk.set(sid, !!ctl && lines.some((l) =>
        new RegExp("^\\s{0,8}(?:A\\.)?" + ctl.replace(/\./g, "\\.") + "[\\s\\t]").test(l)));
    }
    const lines = docText.get(sid);
    const esc = String(addr).replace(/\./g, "\\.");
    const re = new RegExp("^\\s{0,8}(?:A\\.)?" + esc + "[\\s\\t]");
    return lines.some((l) => re.test(l));
  };

  const unresolved = [];
  const byState = new Map();
  console.log("RESOLUTION, per held source");
  console.log("  source                cited clauses   resolved   unresolved");
  for (const s of SOURCES.filter((x) => x.held)) {
    const cm = citedBySource.get(s.id) || new Map();
    const heldSet = held.get(s.id) || new Set();
    const miss = [...cm.keys()].filter((c) => !heldSet.has(c));
    console.log("  " + s.id.padEnd(22) + String(cm.size).padStart(13) +
      String(cm.size - miss.length).padStart(11) + String(miss.length).padStart(13));
    for (const c of miss.sort()) {
      const children = [...heldSet].filter((h) => String(h).startsWith(c + ".")).length;
      let state, note;
      if (children > 0) {
        state = "CONTAINER";
        note = children + " subclause(s) held; the parent is split, not missing";
      } else if (heldSet.has("A." + c)) {
        state = "ANNEX CONTROL, cited without its A. prefix";
        note = "resolves to A." + c;
      } else if (!probeOk.get(s.id) && PDF[s.id] && (headingIn(s.id, c), !probeOk.get(s.id))) {
        state = "UNVERIFIABLE";
        note = "the document probe could not find its own positive control";
      } else if (headingIn(s.id, c)) {
        state = "EXTRACTOR GAP";
        note = "the heading is in the document and the library does not have it";
      } else {
        /* BEFORE CALLING AN ADDRESS INVENTED, ASK WHETHER ANOTHER HELD STANDARD HAS IT.
         * The attribution rule above gives an address to the single held source the item
         * names, and an internal-auditor item names ISO 19011 while citing ISO/IEC
         * 27001's clause numbers freely. ISO 19011:2026 has no clause 10 -- its top
         * level ends at 7 -- so "clause 10.2", cited 35 times, cannot be a 19011
         * address; it is 27001's Nonconformity clause, which is exactly what an auditor
         * item cites. Reported as INVENTED it would have sent someone to rewrite 35
         * correct items.
         *
         * This does not clear the citation: an item that names one standard and cites
         * another's clause is still unclear about its source, and the grounded
         * generator's anchor must carry (standard, clause) as a pair. But it is a
         * different defect from an address nothing contains, and it needs a different
         * fix. */
        const elsewhere = [...held.entries()]
          .filter(([sid, set]) => sid !== s.id && (set.has(c) || set.has("A." + c)))
          .map(([sid]) => sid);
        if (elsewhere.length) {
          state = "RESOLVES IN ANOTHER HELD STANDARD";
          note = "attribution unclear -- present in " + elsewhere.join(", ");
        } else {
          state = "NOT IN THE DOCUMENT";
          note = "no heading for this address in this source, and no other held standard has it";
        }
      }
      unresolved.push({ source: s.id, clause: c, cited: cm.get(c), state, note });
      byState.set(state, (byState.get(state) || 0) + (1));
    }
  }

  console.log("");
  console.log("DOCUMENT PROBE, positive control per source (a negative verdict is void without it)");
  for (const [sid, ok] of probeOk) {
    console.log("  " + sid.padEnd(22) + (ok ? "control " + PROBE_CONTROL[sid] + " found -- absences are meaningful"
      : "CONTROL NOT FOUND -- absences from this document are UNVERIFIABLE"));
  }

  console.log("");
  console.log("UNRESOLVED ADDRESSES  " + unresolved.length + ", by state");
  for (const [st, n] of [...byState].sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(n).padStart(4) + "  " + st);
  }
  /* Only two states are anybody's work. A container and an unprefixed control are the
   * citation being written the way a practitioner writes it, and the generator's
   * resolver has to accept both -- that is a fix in the RESOLVER, not in the bank. */
  for (const st of ["NOT IN THE DOCUMENT", "EXTRACTOR GAP", "RESOLVES IN ANOTHER HELD STANDARD", "UNVERIFIABLE"]) {
    const rows = unresolved.filter((u) => u.state === st);
    if (!rows.length) continue;
    console.log("");
    console.log("  === " + st + " === " + rows.length +
      (st === "NOT IN THE DOCUMENT" ? "   <- the bank is wrong here" :
       st === "EXTRACTOR GAP" ? "   <- the library is wrong here" : ""));
    for (const u of rows.sort((a, b) => b.cited - a.cited)) {
      console.log("    " + (u.source + " " + u.clause).padEnd(28) + "cited " + String(u.cited).padStart(3) + "x");
    }
  }

  const ambiguous = [...citedBySource.keys()].filter((k) => k.startsWith("(ambiguous"));
  console.log("");
  console.log("AMBIGUOUS ADDRESS BUCKETS  " + ambiguous.length +
    "   (an address with two held standards named, or none -- not guessed)");
  for (const a of ambiguous) {
    console.log("  " + a + "  " + (citedBySource.get(a) || new Map()).size + " distinct address(es)");
  }

  console.log("");
  console.log("SOURCES THE BANK CITES AND WE DO NOT HOLD");
  console.log("  source                  items   by certification");
  const gaps = [];
  for (const s of SOURCES.filter((x) => !x.held)) {
    const m = itemsBySource.get(s.id);
    if (!m) continue;
    const total = [...m.values()].reduce((a, b) => a + b.size, 0);
    const per = [...m].map(([c, set]) => c + "=" + set.size).sort();
    gaps.push({ source: s.id, items: total, per_cert: Object.fromEntries([...m].map(([c, set]) => [c, set.size])) });
    console.log("  " + s.id.padEnd(24) + String(total).padStart(6) + "   " + per.join(" "));
  }

  const citedClauses = new Set();
  for (const [k, cm] of citedBySource) { if (!k.startsWith("(ambiguous")) for (const c of cm.keys()) citedClauses.add(k + "|" + c); }
  const uncited = lib.passages.filter((p) => !citedClauses.has(p.source_id + "|" + p.clause)).length;
  console.log("");
  console.log("UNCITED PASSAGES  " + uncited + " of " + lib.passages.length +
    "   (not a defect -- the library may be larger than the bank)");

  writeFileSync(join(ROOT, "CITED-CLAUSE-RESOLUTION.json"), JSON.stringify({
    library_passages: lib.passages.length, items: rows.length,
    unresolved, ambiguous_buckets: ambiguous, gaps, uncited_passages: uncited,
  }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote CITED-CLAUSE-RESOLUTION.json");
} finally { release(); }
