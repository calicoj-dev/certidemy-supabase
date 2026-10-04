#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Re-anchor the audit's "modal-fidelity inflation" drops onto the
 * NORMATIVE twin of the passage the auditor chose, where the library holds one.
 *
 * Ruled PROMPT-113 s2. The auditor anchors a control item to ISO/IEC 27002 X.Y, which is phrased
 * `should` because 27002 is guidance. The SAME control is stated in 27001 Annex A as A.X.Y, and
 * 6.1.3 makes the Annex A controls normative through the Statement of Applicability. So the item's
 * requirement claim is licensed by the standard; the auditor simply picked the guidance copy.
 *
 * THE REMAP IS NUMBERING, NOT MEANING. 27002's clauses 5-8 are the Annex A controls of 27001 with an
 * `A.` prefix, and 42001's Annex B mirrors its Annex A the same way. Nothing here decides that two
 * passages say the same thing from their text -- it relies on the standards' own numbering, and a
 * clause with no held normative twin is left as a real inflation.
 *
 * A DEFINITION IS NOT A TWIN. A 27000 3.x definition imposes nothing whatever its notes say
 * (CLAUDE.md s13), so those are never remapped: they stay dropped for a human to read.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { attributesRequirementToStandard } from "./lib/grounded-gates.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = "ISMS-F";
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>. READ-ONLY, no model calls.");
  process.exit(2);
}
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* the library indexed on (source, clause) -- edition is not needed to ask "is there a normative twin" */
const held = new Map();
for (const p of lib.passages) held.set(p.source_id + "|" + String(p.clause), p);

/** the normative twin of a guidance clause, by the standards' own numbering. null when there is none. */
export function normativeTwin(clause) {
  const c = String(clause || "").trim();
  /* 27002 clauses 5-8 ARE the 27001 Annex A controls, prefixed A. */
  if (/^[5-8]\.\d+(\.\d+)?$/.test(c)) return { source_id: "ISO/IEC 27001", clause: "A." + c };
  /* 42001 Annex B mirrors Annex A: B.6.2.4 -> A.6.2.4 */
  if (/^B\./.test(c)) return { source_id: "ISO/IEC 42001", clause: c.replace(/^B\./, "A.") };
  /* a definition imposes nothing, and 27001 4-10 is already normative: no twin to find */
  return null;
}

export function recheckControls() {
  const cases = [];
  const ok = (w, p) => cases.push({ what: w, pass: p });
  ok("27002 5.10 twins to 27001 A.5.10", normativeTwin("5.10").clause === "A.5.10");
  ok("...and names 27001 as the source", normativeTwin("5.10").source_id === "ISO/IEC 27001");
  ok("27002 8.24 twins to A.8.24", normativeTwin("8.24").clause === "A.8.24");
  ok("a three-part control 5.3.1 twins to A.5.3.1", normativeTwin("5.3.1").clause === "A.5.3.1");
  ok("42001 B.6.2.4 twins to A.6.2.4", normativeTwin("B.6.2.4").clause === "A.6.2.4");
  ok("a DEFINITION 3.61 has NO twin", normativeTwin("3.61") === null);
  ok("27001 clause 9.1 has NO twin (already normative)", normativeTwin("9.1") === null);
  ok("clause 4.5.4 has NO twin", normativeTwin("4.5.4") === null);
  ok("an empty clause has no twin", normativeTwin("") === null);
  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}

const ctl = recheckControls();
if (ctl.fails.length) { console.error("REFUSING: twin controls fail: " + ctl.fails.join("; ")); process.exit(2); }
console.log("twin controls: " + ctl.examined + " case(s), all pass");

const base = join(ROOT, "ANCHOR-OR-FLAG-" + CERT + "-all-secure.json");
const rerun = join(ROOT, "ANCHOR-OR-FLAG-" + CERT + "-all-secure-rerun.json");
if (!existsSync(base)) { console.error("missing " + base); process.exit(2); }
const merged = new Map();
for (const it of (JSON.parse(readFileSync(base, "utf8")).items || [])) merged.set(it.prefix, it);
if (existsSync(rerun)) for (const it of (JSON.parse(readFileSync(rerun, "utf8")).items || [])) merged.set(it.prefix, it);

const inflation = [...merged.values()].filter((it) => {
  const g = (it.gates || []).filter((x) => x.pass === false).map((x) => x.id);
  return g.length === 1 && g[0] === "modal-fidelity";
});

/* THE FOUNDATION NARROWING (PROMPT-114 s3), applied to the recorded claim. Same exported function the
 * gate uses, so there is no second definition of "attributed". An item whose deontic verb belongs to
 * the scenario claims nothing about the standard, so there is nothing to inflate. */
const FOUNDATION = /-F$/.test(CERT);
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const rows = await getAll(KEY, "quiz_questions?select=id,options,correct_answer,explanation" +
  "&certification_id=eq." + cert.id + "&language=eq.en&order=id");
const claimTextOf = (prefix) => {
  const r = rows.find((x) => String(x.id).startsWith(prefix));
  if (!r) return "";
  const keyId = (r.correct_answer || [])[0];
  const key = (r.options || []).find((o) => o.id === keyId);
  return [key && key.text, r.explanation].filter(Boolean).join(" ");
};

const licensed = [], unlicensed = [];
for (const it of inflation) {
  const cl = (it.anchor && it.anchor.clause) || it.key_support_clause;
  const twin = normativeTwin(cl);
  const p = twin ? held.get(twin.source_id + "|" + twin.clause) : null;
  if (p && p.normative === "shall") {
    licensed.push({ prefix: it.prefix, task: it.task, from: String(cl),
      to: twin.source_id + " " + twin.clause, twin_title: p.title || "", by: "normative twin" });
    continue;
  }
  if (FOUNDATION && !attributesRequirementToStandard(claimTextOf(it.prefix))) {
    licensed.push({ prefix: it.prefix, task: it.task, from: String(cl),
      to: "(not attributed)", by: "Foundation narrowing: the claim names no standard or clause " +
        "alongside requires/shall, so the deontic verb is the scenario's own" });
    continue;
  }
  unlicensed.push({ prefix: it.prefix, task: it.task, clause: String(cl),
    why: !twin ? "no normative twin, AND the claim attributes a requirement to the standard"
      : !p ? "twin " + twin.source_id + " " + twin.clause + " is NOT HELD, and the claim is attributed"
      : "twin is " + p.normative + ", not shall, and the claim is attributed" });
}

console.log("");
console.log("RE-ANCHOR INFLATION DROPS   " + CERT);
console.log("  modal-fidelity-only drops        " + inflation.length);
console.log("  LICENSED by a held normative twin " + licensed.length + "   -> these keep");
console.log("  no twin, stay dropped             " + unlicensed.length);
console.log("");
const byTwin = {};
for (const l of licensed) byTwin[l.from + " -> " + l.to] = (byTwin[l.from + " -> " + l.to] || 0) + 1;
for (const k of Object.keys(byTwin).sort()) console.log("    " + String(byTwin[k]).padStart(3) + "  " + k);
console.log("");
const byWhy = {};
for (const u of unlicensed) byWhy[u.why] = (byWhy[u.why] || 0) + 1;
for (const k of Object.keys(byWhy).sort()) console.log("    " + String(byWhy[k]).padStart(3) + "  " + k);

const out = join(ROOT, CERT.replace(/-/g, "") + "-INFLATION-RECHECK.json");
writeFileSync(out, JSON.stringify({ cert: CERT, ruled_in: "PROMPT-113 s2",
  rule: "a modal-fidelity inflation whose anchor has a HELD NORMATIVE TWIN by the standards' own " +
    "numbering is licensed: the requirement claim is real, the auditor picked the guidance copy",
  examined: inflation.length, licensed, unlicensed }, null, 2) + "\n");
console.log("");
console.log("  wrote " + out.split(/[\\/]/).pop());
