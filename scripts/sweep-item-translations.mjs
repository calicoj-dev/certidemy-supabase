/**
 * sweep-item-translations.mjs -- every mechanical check we own, over every
 * translated item, AT FIELD GRAIN.
 *
 * READ-ONLY. There is no --apply and no write path. Unknown flags exit 2.
 *
 * ============ WHY FIELD GRAIN AND NOT ITEM GRAIN ============
 *
 * An item is not one text. It is a stem, two to four options and an
 * explanation, and every gate here compares a translation against its English.
 * Compared whole-item, an inserted modal is undetectable BY CONSTRUCTION: the
 * aligned English always has a modal SOMEWHERE across 4,000 characters, so G3
 * can never fire. That is exactly the defect the checkpoint work found at block
 * grain, and an item has the same shape.
 *
 * So fields pair by ID -- option "c" against option "c" -- never by position. A
 * reordered or dropped option is reported as UNALIGNABLE rather than compared
 * against its neighbour, because comparing b-against-c manufactures findings in
 * both directions at once.
 *
 * ============ THE THREE STATES ============
 *
 * A field is CHECKED, FLAGGED, or UNALIGNABLE. A translated row with no English
 * sibling, or an option id the English does not carry, is UNALIGNABLE -- its own
 * state, never folded into "clean". A check that examined zero fields reports
 * VACUOUS, because a pass over an empty input is not a pass.
 *
 * ============ CONTROLS ============
 *
 * Every detector class carries a positive control that must fire. If any control
 * fails the script prints NO findings and exits 2, because a broken classifier
 * reports clean and a clean report is the one people act on.
 *
 * ============ NO CONTROL CHARACTER IS TYPED IN THIS FILE ============
 *
 * The control-byte detector is built from String.fromCharCode. An earlier draft
 * of this very script typed the bytes into a character class and landed as a
 * binary file -- the defect it exists to find, committed by the finder.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { g3ModalInserted, g4Terms, g7Pins } from "./lib/render-gates.mjs";
import { checkPins } from "./lib/pin-compliance.mjs";
import { REFUSAL } from "./lib/refusal-pattern.mjs";
import { strip, bothFormsCorrect, isCarriedEnglish } from "./lib/accent-classes.mjs";
import { auditItem, keyIsStrictLongest, CUE_CFG } from "./lib/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ---- flags: unknown ones abort, because a flag someone believed in that
   silently did nothing is how a script runs in a mode nobody chose. ---- */
const KNOWN = new Set(["--json", "--verbose", "--accent-floor"]);
for (const a of process.argv.slice(2)) {
  const name = a.split("=")[0];
  if (!KNOWN.has(name)) {
    console.error("unknown flag " + JSON.stringify(a));
    console.error("This script is READ-ONLY. It takes no --apply and no --dry.");
    console.error("Known flags: " + [...KNOWN].join(", "));
    process.exitCode = 2;
    process.exit();
  }
}
const arg = (n, d) => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(n + "="));
  return hit ? hit.slice(n.length + 1) : d;
};
const VERBOSE = process.argv.includes("--verbose");

/* A THRESHOLD IS JUSTIFIED AGAINST WHAT IT HIDES, IN THE SAME BREATH THAT IT IS
   SET. The accent detector's length floor once hid `nao` -- the most common
   accented word in Portuguese -- so this one is declared, overridable, and the
   report states which accented tokens fell inside it. */
const ACCENT_FLOOR = Number(arg("--accent-floor", "3"));

/* Control bytes, built rather than typed. Tab, LF and CR are legal text. */
const CTRL = new Set();
for (let c = 0; c <= 0x1f; c++) if (c !== 9 && c !== 10 && c !== 13) CTRL.add(String.fromCharCode(c));
for (const c of [0x7f, 0xfeff, 0x200b, 0x200c, 0x200d]) CTRL.add(String.fromCharCode(c));
function controlByte(s) {
  for (const ch of String(s)) if (CTRL.has(ch)) return ch;
  return null;
}
const codeOf1 = (ch) => "U+" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0");

const WORDS = /[\p{L}\p{M}]+/gu;

/* ============ G3, WITH BOUNDARIES THAT WORK ============
 *
 * `render-gates.mjs` builds its deontic patterns from
 *     const L = "\p{L}\p{N}_";
 * and `\p` is NOT an escape sequence inside a STRING literal, so the backslash
 * is dropped and L becomes the literal six-character set {p, {, L, }, N, _}.
 * The lookarounds therefore guard against nothing: `deve` matches inside
 * `dever`, `debe` inside `deber`, and `tem que` inside `permitem que`.
 *
 * This is the `\b`-is-ASCII-only defect wearing a new costume, and invariant 13
 * cannot see it -- that guard looks for `\b` beside a non-ASCII letter in a
 * REGEX literal, and this is a lookbehind assembled from a string with no `\b`
 * anywhere. A mangled escape that still parses is the worst kind.
 *
 * [FIXED IN THE LIBRARY 2026-09-25, approved after a regression over the accepted
 * corpus showed 0 new refusals. `render-gates.mjs` now carries the doubled class
 * AND the English obligation forms this sweep found missing. The measured path:
 *
 *     806   the shipped gate, boundaries dead
 *     350   boundaries fixed, old English list      <- what THIS copy still is
 *     286   boundaries fixed AND English widened    <- what the library is now
 *
 * This local copy is kept as the INTERMEDIATE, so the two halves of the repair
 * stay separately attributable. It is not a second implementation of the gate:
 * `G3-modal` in the output is the library, and it is the authority.]
 */
const UL = "\\p{L}\\p{N}_";
const UEDGE = (alts) => new RegExp("(?<![" + UL + "])(?:" + alts + ")(?![" + UL + "])", "iu");
const DEONTIC_EN_OK = UEDGE("shall|must|should|is to be|are to be|is required|are required"
  + "|has to|have to|is mandatory|are mandatory|is obligatory|are obligatory"
  + "|is compulsory|are compulsory");
const DEONTIC_TR_OK = {
  "es-419": UEDGE("debe|deben|deberá|deberán|debería|deberían"
    + "|tiene que|tienen que|es obligatorio|es obligatoria|son obligatorios|son obligatorias"),
  "pt-BR": UEDGE("deve|devem|deverá|deverão|deveria|deveriam"
    + "|tem que|têm que|é obrigatório|é obrigatória|são obrigatórios|são obrigatórias"),
};
function g3Corrected(en, tr, lang) {
  const re = DEONTIC_TR_OK[lang];
  if (!re) return [];
  if (DEONTIC_EN_OK.test(en)) return [];
  const m = tr.match(re);
  return m ? [{ detail: "modal `" + m[0] + "` with none in the aligned English" }] : [];
}

/* Severity. Rank 1 is the worst thing an item can do to a candidate: change
   which answer is right, or how many answers there are, in a secure exam. */
const SEVERITY = [
  ["key-integrity/secure", 1, "the answer key or option set differs from the English, in the exam pool"],
  ["key-integrity/practice", 2, "the answer key or option set differs from the English"],
  ["refusal", 3, "the field is a model refusal, not a translation"],
  ["control-bytes", 4, "the field carries a control or zero-width byte"],
  ["cue-introduced/secure", 5, "the key became a length cue in translation, in the exam pool"],
  ["cue-introduced/practice", 6, "the key became a length cue in translation"],
  ["inserted-obligation", 7, "the translation requires something the English does not"],
  ["G3-modal", 8, "a deontic modal with none in the aligned English (the shipped gate)"],
  ["G3-boundary-only", 8.5, "the same with boundaries fixed but the OLD English list -- the intermediate"],
  ["G4-term", 9, "a house term rendered against the pin"],
  ["G7-pin", 10, "a pinned phrase rendered against the pin"],
  ["pin-other", 11, "a pin-compliance rule other than cadence"],
  ["accent", 12, "a word unaccented where the corpus overwhelmingly accents it"],
  ["cue-advisory", 13, "ADVISORY: the key became the longest option, below the cue guard margin"],
];
const RANK = new Map(SEVERITY.map(([k, r]) => [k, r]));
const WHY = new Map(SEVERITY.map(([k, , w]) => [k, w]));

/* ------------------------------------------------------- item-level checks */
function optMap(q) {
  const m = new Map();
  if (Array.isArray(q && q.options)) {
    for (const o of q.options) if (o && typeof o.id === "string") m.set(o.id, String(o.text == null ? "" : o.text));
  }
  return m;
}

function keyIntegrity(en, tr) {
  const out = [];
  const eo = optMap(en), to = optMap(tr);
  if (eo.size !== to.size) out.push("option count " + to.size + " against English " + eo.size);
  const eIds = [...eo.keys()].sort().join(","), tIds = [...to.keys()].sort().join(",");
  if (eIds !== tIds) out.push("option ids [" + tIds + "] against English [" + eIds + "]");
  const ek = Array.isArray(en && en.correct_answer) ? [...en.correct_answer].sort().join(",") : "?";
  const tk = Array.isArray(tr && tr.correct_answer) ? [...tr.correct_answer].sort().join(",") : "?";
  if (ek !== tk) out.push("key [" + tk + "] against English [" + ek + "]");
  const seen = new Map();
  for (const [id, text] of to) {
    const norm = text.trim().toLowerCase().replace(/\s+/g, " ");
    if (!norm) { out.push("option " + id + " is empty"); continue; }
    if (seen.has(norm)) out.push("options " + seen.get(norm) + " and " + id + " are the same text");
    else seen.set(norm, id);
  }
  return out;
}

/** A cue the TRANSLATION introduced: the key is NOTICEABLY longer here and was
 *  not in the English. A key that is long in both is an authoring choice the
 *  English review already owns, and reporting it here would blame the
 *  translator for the source.
 *
 *  THE ENGLISH-SIDE PREDICATE IS THE CUE GUARD, NOT `keyIsStrictLongest`, and
 *  the control is what forced that. Strict-longest disqualifies an English item
 *  whose key is ONE CHARACTER longer than its rivals -- which is most items, and
 *  none of them is a cue. Using it as the baseline would have silently
 *  suppressed the majority of real differential findings while reporting clean:
 *  a conservative error, the kind this codebase records as the hardest to see.
 *  `keyIsStrictLongest` is reported separately below as an advisory, never as
 *  the gate. */
function cueIntroduced(en, tr) {
  if (!auditItem(en, CUE_CFG).ok) return [];
  const a = auditItem(tr, CUE_CFG);
  return a.ok ? [] : ["cue guard: " + a.reason];
}

/** Advisory, strictly weaker: the key became the longest option in translation
 *  and was not in the English. Below the cue guard's margin by construction, so
 *  it is a watch list and not a finding. */
function keyBecameLongest(en, tr) {
  return !keyIsStrictLongest(en) && keyIsStrictLongest(tr);
}

/* ---------------------------------------------------------------- controls */
function controls() {
  const bad = [];
  const must = (cond, what) => { if (!cond) bad.push(what); };

  must(g3ModalInserted("The organization reviews the scope.",
    "La organizacion debe revisar el alcance.", "es-419").length === 1,
    "G3 did not fire on an inserted `debe`");
  must(g3ModalInserted("The organization shall review the scope.",
    "La organizacion debe revisar el alcance.", "es-419").length === 0,
    "G3 fired when the English carries `shall`");

  /* The corrected G3 must respect word boundaries in BOTH directions: fire on a
     standalone modal, stay silent inside a longer word. The second half is the
     whole point -- the shipped gate fails exactly there. */
  must(g3Corrected("The organization reviews it.", "A organizacao deve revisar.", "pt-BR").length === 1,
    "corrected G3 missed a standalone `deve`");
  must(g3Corrected("The manager assigns the task.", "O papel do gerente nao absorve o dever do analista.", "pt-BR").length === 0,
    "corrected G3 matched `deve` inside `dever`");
  must(g3Corrected("Attributes allow the set to be filtered.", "Os atributos permitem que o conjunto seja filtrado.", "pt-BR").length === 0,
    "corrected G3 matched `tem que` inside `permitem que`");
  must(g3Corrected("A new duty arises.", "Genera un nuevo deber de etiquetado.", "es-419").length === 0,
    "corrected G3 matched `debe` inside `deber`");

  must(REFUSAL.test("I need the actual English block content to translate."),
    "the refusal pattern missed its own founding instance");
  must(!REFUSAL.test("La organizacion debe determinar el alcance del sistema de gestion."),
    "the refusal pattern fired on ordinary Spanish");

  must(controlByte("a" + String.fromCharCode(8) + "b") !== null,
    "the control-byte detector missed a backspace");
  must(controlByte("x" + String.fromCharCode(0x200b) + "y") !== null,
    "the control-byte detector missed a zero-width space");
  must(controlByte("linea" + String.fromCharCode(10) + "con tab" + String.fromCharCode(9)) === null,
    "the control-byte detector fired on tab or newline");

  const enQ = { options: [{ id: "a", text: "one" }, { id: "b", text: "two" }, { id: "c", text: "three" }], correct_answer: ["c"] };
  must(keyIntegrity(enQ, { options: [{ id: "a", text: "uno" }, { id: "b", text: "dos" }], correct_answer: ["c"] }).length > 0,
    "key integrity missed a dropped option");
  must(keyIntegrity(enQ, { options: enQ.options, correct_answer: ["a"] }).length > 0,
    "key integrity missed a moved key");
  must(keyIntegrity(enQ, { options: [{ id: "a", text: "uno" }, { id: "b", text: "uno" }, { id: "c", text: "tres" }], correct_answer: ["c"] }).length > 0,
    "key integrity missed a duplicated option text");
  must(keyIntegrity(enQ, { options: [{ id: "a", text: "uno" }, { id: "b", text: "dos" }, { id: "c", text: "tres" }], correct_answer: ["c"] }).length === 0,
    "key integrity fired on a faithful translation");

  /* The English baseline must have a key that is NOT the longest option, or the
     advisory's own precondition is unmet and its control can never fire. */
  const even = { options: [{ id: "a", text: "x".repeat(22) }, { id: "b", text: "y".repeat(22) }, { id: "c", text: "z".repeat(20) }], correct_answer: ["c"] };
  const longKey = { options: [{ id: "a", text: "x".repeat(20) }, { id: "b", text: "y".repeat(20) }, { id: "c", text: "z".repeat(200) }], correct_answer: ["c"] };
  must(cueIntroduced(even, longKey).length > 0, "the cue check missed a key that became the length cue in translation");
  must(cueIntroduced(longKey, longKey).length === 0, "the cue check fired when the English key is equally dominant");
  must(keyBecameLongest(even, longKey) === true, "the advisory missed a key that became longest");
  must(keyBecameLongest(longKey, longKey) === false, "the advisory fired when the English key was already longest");

  return bad;
}

/* ------------------------------------------------------------------- main */
async function main() {
  const ctl = controls();
  if (ctl.length) {
    console.error("CONTROLS FAILED -- no findings printed, because a broken classifier reports clean:");
    for (const b of ctl) console.error("  " + b);
    process.exitCode = 2;
    return;
  }

  const KEY = requireKey(HERE);
  const releaseLock = await acquireHeavyReaderLock("sweep-item-translations");
  try {
    const certs = await getAll(KEY, "certifications?select=id,code&order=id");
    const codeOf = new Map(certs.map((c) => [c.id, c.code]));

    const sel = "id,certification_id,question_group_id,language,pool,is_exam_scope,question_text,options,correct_answer,explanation";
    const rows = await getAll(KEY,
      "quiz_questions?select=" + sel + "&status=eq.approved&retired_at=is.null&order=id");

    const groups = new Map();
    let noGroup = 0;
    for (const r of rows) {
      if (!r.question_group_id) { noGroup++; continue; }
      if (!groups.has(r.question_group_id)) groups.set(r.question_group_id, []);
      groups.get(r.question_group_id).push(r);
    }

    /* ---- accent vocabulary, built per language from this very corpus ---- */
    const textsOf = (r) => [String(r.question_text == null ? "" : r.question_text),
      String(r.explanation == null ? "" : r.explanation),
      ...[...optMap(r).values()]].join("\n");

    const vocab = new Map();
    const belowFloor = new Map();
    for (const r of rows) {
      if (r.language === "en") continue;
      if (!vocab.has(r.language)) { vocab.set(r.language, new Map()); belowFloor.set(r.language, new Set()); }
      const v = vocab.get(r.language);
      for (const tok of textsOf(r).toLowerCase().match(WORDS) || []) {
        if (tok.length < ACCENT_FLOOR) {
          if (strip(tok) !== tok) belowFloor.get(r.language).add(tok);
          continue;
        }
        const k = strip(tok);
        if (!v.has(k)) v.set(k, new Map());
        v.get(k).set(tok, (v.get(k).get(tok) || 0) + 1);
      }
    }

    function accentFindings(tr, lang, en) {
      const v = vocab.get(lang);
      if (!v) return [];
      const out = [];
      const seen = new Set();
      for (const tok of tr.toLowerCase().match(WORDS) || []) {
        if (tok.length < ACCENT_FLOOR) continue;
        if (strip(tok) !== tok) continue;
        if (seen.has(tok)) continue;
        const forms = v.get(tok);
        if (!forms) continue;
        let best = null, bestN = 0;
        for (const [f, n] of forms) if (f !== tok && n > bestN) { best = f; bestN = n; }
        if (!best) continue;
        const plainN = forms.get(tok) || 0;
        if (bestN < plainN * 10) continue;
        if (bothFormsCorrect(tok, best)) continue;
        if (isCarriedEnglish(tok, en)) continue;
        seen.add(tok);
        out.push(tok + " (" + plainN + ") where " + best + " (" + bestN + ") dominates");
      }
      return out;
    }

    /* ------------------------------------------------------ the sweep ---- */
    const buckets = new Map();
    const findings = [];
    let translatedRows = 0, unalignable = 0, fieldsChecked = 0, groupsWithoutEnglish = 0;
    const perCheck = new Map();
    const bump = (k) => perCheck.set(k, (perCheck.get(k) || 0) + 1);

    for (const [, sibs] of groups) {
      const en = sibs.find((s) => s.language === "en");
      for (const tr of sibs) {
        if (tr.language === "en") continue;
        translatedRows++;
        const cert = codeOf.get(tr.certification_id) || "UNKNOWN";
        const bk = cert + "|" + (tr.pool || "?") + "|" + tr.language;
        if (!buckets.has(bk)) {
          buckets.set(bk, { cert, pool: tr.pool, lang: tr.language, rows: 0, flagged: 0, unalignable: 0, checks: new Map() });
        }
        const b = buckets.get(bk);
        b.rows++;

        if (!en) { unalignable++; groupsWithoutEnglish++; b.unalignable++; continue; }

        const rowFindings = [];
        const add = (cls, field, detail) => {
          rowFindings.push({ cls, field, detail });
          bump(cls);
          b.checks.set(cls, (b.checks.get(cls) || 0) + 1);
        };

        const secure = tr.pool === "secure";
        for (const d of keyIntegrity(en, tr)) add("key-integrity/" + (secure ? "secure" : "practice"), "item", d);
        for (const d of cueIntroduced(en, tr)) add("cue-introduced/" + (secure ? "secure" : "practice"), "item", d);
        if (keyBecameLongest(en, tr)) add("cue-advisory", "item", "key is the longest option here and was not in English");

        const eo = optMap(en), to = optMap(tr);
        const pairs = [
          ["stem", String(en.question_text == null ? "" : en.question_text), String(tr.question_text == null ? "" : tr.question_text)],
          ["explanation", String(en.explanation == null ? "" : en.explanation), String(tr.explanation == null ? "" : tr.explanation)],
        ];
        for (const [id, text] of to) {
          if (!eo.has(id)) { b.unalignable++; unalignable++; continue; }
          pairs.push(["option:" + id, eo.get(id), text]);
        }

        for (const [field, e, t] of pairs) {
          if (!t.trim()) continue;
          fieldsChecked++;
          if (REFUSAL.test(t)) add("refusal", field, t.slice(0, 140));
          const cb = controlByte(t);
          if (cb) add("control-bytes", field, codeOf1(cb));
          for (const f of g3ModalInserted(e, t, tr.language)) add("G3-modal", field, f.detail);
          for (const f of g3Corrected(e, t, tr.language)) add("G3-boundary-only", field, f.detail);
          for (const f of g4Terms(e, t, tr.language)) add("G4-term", field, f.detail);
          for (const f of g7Pins(e, t, tr.language)) add("G7-pin", field, f.detail);
          for (const p of checkPins(t, tr.language, e)) {
            add(p.id === "inserted-cadence" ? "inserted-obligation" : "pin-other", field, p.id + ": " + p.hit);
          }
          for (const a of accentFindings(t, tr.language, e)) add("accent", field, a);
        }

        if (rowFindings.length) {
          b.flagged++;
          findings.push({
            id: tr.id, group: tr.question_group_id, cert, pool: tr.pool, lang: tr.language,
            is_exam_scope: tr.is_exam_scope,
            worst: Math.min(...rowFindings.map((f) => RANK.get(f.cls) || 99)),
            findings: rowFindings,
          });
        }
      }
    }

    findings.sort((a, b2) => a.worst - b2.worst || a.cert.localeCompare(b2.cert));

    /* ---- persist FIRST. The number that leaves the process is the one that
       has to be right, and a terminal is not what the next tool reads. ---- */
    const out = {
      note: "read-only sweep; no writes of any kind; fields paired by id",
      corpus: {
        approved_live_rows: rows.length,
        rows_without_a_group_key: noGroup,
        translated_rows: translatedRows,
        fields_compared: fieldsChecked,
        unalignable: unalignable,
        groups_without_an_english_sibling: groupsWithoutEnglish,
      },
      accent_floor: {
        chars: ACCENT_FLOOR,
        accented_tokens_it_hides: Object.fromEntries([...belowFloor].map(([l, s]) => [l, [...s].sort()])),
      },
      cue_config: CUE_CFG,
      per_check: Object.fromEntries([...perCheck].sort((a, b2) => (RANK.get(a[0]) || 99) - (RANK.get(b2[0]) || 99))),
      buckets: [...buckets.values()].map((b) => ({
        certification: b.cert, pool: b.pool, language: b.lang,
        rows: b.rows, rows_flagged: b.flagged, unalignable: b.unalignable,
        checks: Object.fromEntries([...b.checks].sort((x, y) => (RANK.get(x[0]) || 99) - (RANK.get(y[0]) || 99))),
      })).sort((a, b2) => a.certification.localeCompare(b2.certification)
        || String(a.pool).localeCompare(String(b2.pool)) || a.language.localeCompare(b2.language)),
      findings,
    };
    const path = join(ROOT, "ITEM-QUALITY-SWEEP.json");
    writeFileSync(path, JSON.stringify(out, null, 2) + "\n", "utf8");

    console.log("ITEM TRANSLATION SWEEP -- read-only, field grain, paired by id");
    console.log("  approved live rows            " + rows.length);
    console.log("  rows with no group key        " + noGroup);
    console.log("  translated rows swept         " + translatedRows);
    console.log("  fields compared               " + fieldsChecked);
    console.log("  UNALIGNABLE                   " + unalignable + (unalignable ? "   <- own state, not a pass" : ""));
    console.log("  rows with at least one flag   " + findings.length);
    if (!fieldsChecked) console.log("  VACUOUS: nothing was examined");
    console.log("");
    console.log("PER CHECK");
    for (const [k, n] of Object.entries(out.per_check)) {
      console.log("  " + String(n).padStart(7) + "  " + k.padEnd(24) + (WHY.get(k) || ""));
    }
    if (!Object.keys(out.per_check).length) console.log("  (nothing fired)");
    console.log("");
    console.log("PER CERTIFICATION x POOL x LANGUAGE");
    console.log("  cert       pool      lang      rows  flagged  unalign");
    for (const b of out.buckets) {
      console.log("  " + b.certification.padEnd(10) + " " + String(b.pool).padEnd(9) + " " +
        b.language.padEnd(8) + String(b.rows).padStart(6) + String(b.rows_flagged).padStart(9) +
        String(b.unalignable).padStart(9) +
        (Object.keys(b.checks).length ? "   " + Object.entries(b.checks).map(([k, n]) => k + "=" + n).join(" ") : ""));
    }

    const secureKey = findings.filter((f) => f.findings.some((x) => x.cls === "key-integrity/secure"));
    console.log("");
    console.log("EVERY SECURE KEY-INTEGRITY FAILURE (" + secureKey.length + ")");
    if (!secureKey.length) console.log("  none");
    for (const f of secureKey) {
      console.log("  " + f.cert + " " + f.lang + " " + f.id);
      for (const x of f.findings.filter((y) => y.cls === "key-integrity/secure")) console.log("      " + x.detail);
    }

    console.log("");
    console.log("wrote " + path);
    if (VERBOSE) console.log(JSON.stringify(out.per_check, null, 2));
  } finally {
    releaseLock();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
