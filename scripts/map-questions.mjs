#!/usr/bin/env node
/**
 * READ-ONLY. The MAP questions for the director: unmapped tasks, thin tasks, and what the declared-
 * but-not-individually-held ids are. Nothing is generated and nothing is written.
 *
 * Candidates are ranked LEXICALLY, by distinctive-term overlap between the task statement and the
 * passage title plus text. A lexical rank is a shortlist, not a judgement -- the director maps.
 *
 * SCOPED TO THE CERTIFICATION'S OWN STANDARD. 27001's Annex A controls are never filled from 27002:
 * *should* against *shall* (CLAUDE.md s14). Guidance sources are offered separately and labelled.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, TOPN = 5, ALL_SOURCES = false;
const WANT = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  let m = a.match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1] || argv[++i]; continue; }
  m = a.match(/^--top=(\d+)$/);
  if (m) { TOPN = Number(m[1]); continue; }
  /* 1.6 and 1.7 are AI-specific and 27001 carries no AI content, so an own-standard shortlist is
   * meaningless for them. `--all-sources` ranks across every held source and labels each one. */
  if (a === "--all-sources") { ALL_SOURCES = true; continue; }
  if (a.startsWith("--")) {
    console.error("Unrecognised flag: " + a + ". Known: --cert, --top=, --all-sources. READ-ONLY.");
    process.exit(2);
  }
  WANT.push(a);
}
if (!CERT) { console.error("--cert <CODE> is required."); process.exit(2); }

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const tasks = (await getAll(KEY, "tasks?select=id,code,statement,is_exam_scope,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const passRows = await getAll(KEY, "source_passages?select=id,clause,source_id,edition&order=id");
const pById = new Map(passRows.map((r) => [r.id, r]));

/* which (source, edition) does this certification examine MOST? that is its own standard */
const seen = new Map();
for (const r of tsRows) {
  const p = pById.get(r.passage_id);
  if (!p || !tasks.some((t) => t.id === r.task_id)) continue;
  const k = p.source_id + "|" + p.edition;
  seen.set(k, (seen.get(k) || 0) + 1);
}
const ranked = [...seen.entries()].sort((a, b) => b[1] - a[1]);
const [OWN_SRC, OWN_ED] = (ranked[0] || ["|"])[0].split("|");
console.log("MAP QUESTIONS   " + CERT + "   own standard: " + OWN_SRC + " " + OWN_ED +
  "   (" + ranked.length + " source/edition pair(s) in the map)");

const STOP = new Set(("the a an and or of to for in on with that which this these those is are be been " +
  "as by its it their from at into any all each must shall should may can will would when how what " +
  "organization organizations information system systems management").split(" "));
const terms = (s) => new Set(String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w)));
const score = (tTerms, p) => {
  const pt = terms((p.title || "") + " " + (p.text || ""));
  let hit = 0;
  for (const w of tTerms) if (pt.has(w)) hit++;
  return tTerms.size ? hit / tTerms.size : 0;
};
const ownPassages = ALL_SOURCES ? lib.passages
  : lib.passages.filter((p) => p.source_id === OWN_SRC && String(p.edition) === String(OWN_ED));
const mappedIds = new Set();
for (const r of tsRows) { const p = pById.get(r.passage_id); if (p) mappedIds.add(p.source_id + "|" + p.edition + "|" + p.clause); }

const candidatesFor = (t, exclude) => {
  const tT = terms(t.statement);
  return ownPassages
    .filter((p) => !exclude.has(String(p.clause)))
    .map((p) => ({ p, s: score(tT, p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, TOPN);
};

for (const code of WANT) {
  const t = tasks.find((x) => x.code === code);
  if (!t) { console.log("\n== " + code + "  NO SUCH TASK"); continue; }
  const mine = tsRows.filter((r) => r.task_id === t.id).map((r) => ({ role: r.role, p: pById.get(r.passage_id) }))
    .filter((x) => x.p);
  const primaries = mine.filter((x) => x.role === "primary");
  console.log("\n==== TASK " + code + "   " + primaries.length + " primary, " +
    (mine.length - primaries.length) + " supporting");
  console.log("  statement: " + String(t.statement || "(none)").replace(/\s+/g, " "));
  if (primaries.length) {
    console.log("  current primaries: " + primaries.map((x) => x.p.source_id + " " + x.p.clause).join(", "));
  } else {
    console.log("  current primaries: NONE");
  }
  const have = new Set(primaries.map((x) => String(x.p.clause)));
  const cands = candidatesFor(t, have);
  if (!cands.length) { console.log("  candidates: none scored above zero -- the statement shares no distinctive term with any held passage"); continue; }
  console.log("  candidates (lexical shortlist, NOT a judgement):");
  for (const c of cands) {
    const taken = mappedIds.has(c.p.source_id + "|" + c.p.edition + "|" + c.p.clause);
    console.log("    " + (ALL_SOURCES ? String(c.p.source_id).slice(0, 16).padEnd(17) : "") + String(c.p.clause).padEnd(12) + (c.s * 100).toFixed(0).padStart(3) + "%  " +
      (c.p.normative || "?").padEnd(7) + (taken ? "[mapped elsewhere] " : "") +
      String(c.p.title || "").replace(/\s+/g, " ").slice(0, 70));
  }
}

/* ---- the declared-but-not-individually-held ids ---- */
const cpath = join(ROOT, "LIBRARY-COMPLETENESS.json");
if (existsSync(cpath)) {
  const compl = JSON.parse(readFileSync(cpath, "utf8"));
  const s = (compl.sources || []).find((x) => String(x.source_id || x.source) === OWN_SRC);
  if (s) {
    console.log("");
    console.log("DECLARED vs HELD   " + OWN_SRC + "   declared " + (s.declared ?? "?") +
      "   held " + (s.held ?? "?") + "   missing " + ((s.missing || []).length));
    const declared = s.declared_ids || s.declared_list || null;
    const held = new Set(ownPassages.map((p) => String(p.clause)));
    if (Array.isArray(declared)) {
      const notHeldAlone = declared.filter((d) => !held.has(String(d)));
      console.log("  declared ids with NO passage of their own: " + notHeldAlone.length);
      for (const d of notHeldAlone) {
        const kids = ownPassages.filter((p) => String(p.clause).startsWith(String(d) + "."));
        console.log("    " + String(d).padEnd(12) + (kids.length
          ? "CONTAINER -- " + kids.length + " child passage(s) held (" + kids.slice(0, 4).map((k) => k.clause).join(", ") + ")"
          : "NO CHILDREN EITHER -- genuinely absent"));
      }
    } else {
      console.log("  the completeness artifact does not list the declared ids, so which 10 cannot be named from it.");
    }
  }
}
