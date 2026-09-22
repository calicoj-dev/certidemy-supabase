#!/usr/bin/env node
/**
 * pin-evaluacion.mjs - one head noun for "assessment" in es-419.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE RULING, AND THE CENSUS UNDER IT ============
 *
 * `apreciacion del riesgo` is ISO 31000's Spanish rendering of "risk
 * assessment". `evaluacion` is what everything else on this platform uses.
 * Counted BOTH terms before proposing to replace one -- a census of A alone
 * cannot tell an inconsistency from the house form:
 *
 *   surface              apreciacion   evaluacion
 *   concept_translations         12           87
 *   lessons                       0          184
 *   quiz_questions                0          558
 *   task_translations             0           27
 *
 * `apreciacion` exists in ONE surface and nowhere else, 769 to 0 against it
 * outside concepts and 87 to 12 inside them. AIMS-IA, the certification whose
 * convention this matches, is 21 to 0.
 *
 * ============ AND THE ENGLISH SETTLES THE ONE REAL OBJECTION ============
 *
 * Two AIMS-F rows CONTRAST the terms, and one is named for the contrast:
 * "Apreciacion de riesgos frente a evaluacion de impacto". Replacing the head
 * noun looks like the clause-substitution defect this repo already records --
 * destroying a distinction the item exists to teach.
 *
 * It is the opposite. The English reads "Risk vs impact assessment": ONE head
 * noun, "assessment", with the distinction carried entirely by the qualifier.
 * Spanish rendering one as `apreciacion` and the other as `evaluacion`
 * INVENTS a lexical contrast the source does not make. The pin restores
 * fidelity rather than flattening it.
 *
 * ============ WHAT HAPPENS TO THE CLEARED ROWS ============
 *
 * 8 of the 12 are cleared and serving. Migration 364 gates mcp.concept on
 * concept_translations.tr_hash matching the row's current content, so editing
 * a cleared row withholds it until a human re-reads it.
 *
 * THIS SCRIPT DELIBERATELY DOES NOT UPDATE tr_hash. Recomputing it here would
 * keep the row serving under a review that no longer describes it -- which is
 * the whole defect 364 was written to close. The stale hash IS the signal, and
 * a post-condition asserts every edited cleared row is withheld afterwards.
 * No trigger maintains tr_hash (checked: only set_updated_at), so leaving it
 * alone is sufficient.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a);
    console.error("This script is DRY BY DEFAULT and takes --apply to write.");
    console.error("NOTE: two conventions exist in scripts/. Some take --dry and are LIVE without it.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

/** Page to exhaustion AND assert against the server's count. */
async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 160));
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    out.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE on " + path + ": " + out.length + " of " + total);
  return out;
}

/** Ask the server for a count. Never fetch rows to count them. */
async function countWhere(path) {
  const r = await fetch(REST + "/" + path + "&limit=1", { headers: { ...H, Prefer: "count=exact" } });
  if (!r.ok) throw new Error("HTTP " + r.status + " on count " + path);
  await r.text();
  const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
  if (!Number.isFinite(n)) throw new Error("no content-range on count " + path);
  return n;
}

/* ---------------------------------------------------------------- the pin */
/* SINGULAR AND PLURAL BOTH, AND BOTH CASES. A vocabulary swap that changes
 * number leaves a verb behind; this repo has paid for that. `apreciacion` and
 * `evaluacion` are both feminine singular and both form the plural in -es, so
 * this map preserves gender AND number on every entry and no article or
 * adjective agreement moves. A post-condition asserts the word counts match. */
const A = String.fromCharCode(243); // o-acute, kept out of the literal source
const PIN = [
  ["Apreciaci" + A + "n",   "Evaluaci" + A + "n"],
  ["apreciaci" + A + "n",   "evaluaci" + A + "n"],
  ["Apreciaciones",         "Evaluaciones"],
  ["apreciaciones",         "evaluaciones"],
  ["Apreciacion",           "Evaluacion"],
  ["apreciacion",           "evaluacion"],
];

function pin(s) {
  if (s == null) return { out: s, n: 0 };
  let out = String(s), n = 0;
  for (const [from, to] of PIN) {
    const parts = out.split(from);
    n += parts.length - 1;
    out = parts.join(to);
  }
  return { out, n };
}

/* POSITIVE CONTROL. A replacer that silently stopped matching would report
 * "0 rows to change" and read as a corpus already clean. */
const CONTROL = [
  ["Apreciaci" + A + "n de riesgos", "Evaluaci" + A + "n de riesgos", 1],
  ["las apreciaciones del riesgo",   "las evaluaciones del riesgo",   1],
  ["la apreciaci" + A + "n y esa apreciaci" + A + "n", "la evaluaci" + A + "n y esa evaluaci" + A + "n", 2],
  ["nada que cambiar aqui",          "nada que cambiar aqui",         0],
];
for (const [inp, want, wantN] of CONTROL) {
  const got = pin(inp);
  if (got.out !== want || got.n !== wantN) {
    console.error("POSITIVE CONTROL FAILED on: " + inp);
    console.error("  got  " + got.out + "  (" + got.n + ")");
    console.error("  want " + want + "  (" + wantN + ")");
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length + " known replacements correct");

/* ------------------------------------------------------------------- read */
const certs = await allRows("certifications?select=id,code");
const certBy = new Map(certs.map((c) => [c.id, c.code]));
const concepts = await allRows("concepts?select=id,slug,certification_id,retired_at");
const conBy = new Map(concepts.map((c) => [c.id, c]));

const all = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");
const es = all.filter((r) => r.language === "es-419");

const before = {
  apreciacion: es.filter((r) => /apreciaci/i.test(r.name + " " + r.description)).length,
  evaluacion: es.filter((r) => /evaluaci/i.test(r.name + " " + r.description)).length,
};

const plan = [];
for (const r of es) {
  const n = pin(r.name), d = pin(r.description);
  if (n.n + d.n === 0) continue;
  const c = conBy.get(r.concept_id);
  plan.push({
    id: r.id, slug: c?.slug, cert: certBy.get(c?.certification_id), language: r.language,
    cleared: !r.is_provisional, occurrences: n.n + d.n,
    tr_hash: r.tr_hash,
    name_before: r.name, name_after: n.out,
    description_before: r.description, description_after: d.out,
  });
}

/* A fingerprint of every row this pin must NOT touch. A count passes on two
 * rows swapping values; a checksum does not. */
const untouched = es.filter((r) => !plan.some((p) => p.id === r.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((r) => r.id + "|" + r.name + "|" + r.description + "|" + r.tr_hash);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);

console.log("");
console.log("CENSUS, es-419 concept_translations");
console.log("  rows carrying apreciacion   " + before.apreciacion);
console.log("  rows carrying evaluacion    " + before.evaluacion);
console.log("  rows this pin will change   " + plan.length);
console.log("  occurrences to replace      " + plan.reduce((s, p) => s + p.occurrences, 0));
console.log("  of those rows, CLEARED      " + plan.filter((p) => p.cleared).length + "   <- these withhold until re-read");
console.log("  untouched-row checksum      " + untouchedHash + " over " + untouched.length + " row(s)");

console.log("");
for (const p of plan.sort((a, b) => (a.cert + a.slug).localeCompare(b.cert + b.slug))) {
  console.log("  " + (p.cleared ? "CLEARED " : "provis. ") + p.cert.padEnd(9) + p.slug);
  if (p.name_before !== p.name_after) {
    console.log("      name  - " + p.name_before);
    console.log("            + " + p.name_after);
  }
  if (p.description_before !== p.description_after) {
    const i = p.description_before.toLowerCase().indexOf("apreciaci");
    const a = Math.max(0, i - 60);
    console.log("      desc  - ..." + p.description_before.slice(a, i + 90) + "...");
    console.log("            + ..." + p.description_after.slice(a, i + 90) + "...");
  }
}

writeFileSync(join(HERE, "..", "PIN-EVALUACION-PLAN.json"),
  JSON.stringify({ measured: "2026-09-21", before, planned: plan.length, untouchedHash, plan }, null, 2), "utf8");
console.log("");
console.log("wrote PIN-EVALUACION-PLAN.json");

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

/* ------------------------------------------------------------------ write */
console.log("");
console.log("APPLYING " + plan.length + " row(s)...");
for (const p of plan) {
  /* tr_hash is deliberately NOT in this payload. See the header. */
  const r = await fetch(REST + "/concept_translations?id=eq." + p.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ name: p.name_after, description: p.description_after }),
  });
  if (!r.ok) throw new Error("PATCH failed on " + p.slug + ": HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const back = await r.json();
  if (!back[0] || back[0].name !== p.name_after) {
    throw new Error("read-back mismatch on " + p.slug + " -- the write did not land as sent");
  }
}

/* -------------------------------------------------------- post-conditions */
console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (label, cond, detail) => {
  console.log("  " + (cond ? "PASS  " : "FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!cond) fail++;
};

const after = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash");
const esAfter = after.filter((r) => r.language === "es-419");

const stillA = esAfter.filter((r) => /apreciaci/i.test(r.name + " " + r.description));
ok("no es-419 concept row carries apreciacion", stillA.length === 0, stillA.length + " remain");

const nowE = esAfter.filter((r) => /evaluaci/i.test(r.name + " " + r.description)).length;
/* THE NEGATIVE HALF. Asserting the term landed passes on a change that also
 * landed where it should not. The evaluacion count must rise by exactly the
 * rows that carried apreciacion and did not already carry evaluacion. */
const expectedRise = plan.filter((p) => !/evaluaci/i.test(p.name_before + " " + p.description_before)).length;
ok("evaluacion row count rose by exactly " + expectedRise, nowE === before.evaluacion + expectedRise,
   before.evaluacion + " -> " + nowE);

const untouchedAfter = esAfter.filter((r) => !plan.some((p) => p.id === r.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((r) => r.id + "|" + r.name + "|" + r.description + "|" + r.tr_hash);
const hashAfter = createHash("sha256").update(untouchedAfter.join("\n")).digest("hex").slice(0, 16);
ok("every row the pin must not touch is byte-identical", hashAfter === untouchedHash,
   untouchedHash + " -> " + hashAfter);

const hashesHeld = plan.every((p) => {
  const row = esAfter.find((r) => r.id === p.id);
  return row && row.tr_hash === p.tr_hash;
});
ok("tr_hash was NOT recomputed on any edited row", hashesHeld, "the stale hash is the signal");

/* GENDER AND NUMBER PRESERVED. Both nouns are feminine and both pluralise in
 * -es, so a correct swap changes no word count. A changed count means an
 * inflection was dropped. */
const wordsHeld = plan.every((p) => {
  const w = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
  return w(p.name_before) === w(p.name_after) && w(p.description_before) === w(p.description_after);
});
ok("word counts unchanged (gender and number preserved)", wordsHeld);

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("All post-conditions passed. " + plan.filter((p) => p.cleared).length +
            " cleared row(s) are now withheld by 364 and need a re-read.");
