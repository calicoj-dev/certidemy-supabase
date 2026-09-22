#!/usr/bin/env node
/**
 * pin-initialism-case.mjs - no concept name carries a not-fully-uppercase
 * initialism.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE ASSERTION IS PER TOKEN, NOT PER NAME ============
 *
 * `Saas ai in scope` fails twice. A per-NAME assertion reports it once and
 * goes quiet after the first fix, so the second defect ships. Counting
 * occurrences rather than rows is the same correction as the Secao pass, where
 * a count said 8 and a row-shaped enumeration said 7.
 *
 * ============ THE SLUG-DERIVED GUARD IS NOT NARROWED, IT IS DROPPED ========
 *
 * Its narrow form -- name byte-equal to the raw lowercase slug -- fires on ZERO
 * rows corpus-wide, because every slug-derived name is sentence-cased. Its
 * broad form fires on 521 rows across ten certifications, which makes it a
 * description of the house naming convention rather than a defect detector.
 * ISMS-F is distinctive only by RATE: 192 of 192 at 100 percent, against
 * AIHR-I at 84, AIMS-F at 74, ISMS-IA at 0.
 *
 * A guard that has to be calibrated to fire on exactly one certification is
 * fitted to its training set. There is no version of it worth keeping, so
 * nothing here replaces it.
 *
 * ============ WHAT COUNTS AS AN INITIALISM HERE ============
 *
 * The seven ruled tokens only. `aims` in `Iso 42001 aims` is an initialism too
 * -- AI Management System -- and it is NOT in this pass, because including it
 * would move the expected count off 22 and the agreement between this
 * assertion and the census is what licenses the write. It is reported
 * separately for a ruling rather than folded in silently.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    console.error("NOTE: some scripts here take --dry and are LIVE without it. This is not one.");
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
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(BASE + "/" + path, {
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

/* The ruled seven. Each maps a WHOLE TOKEN to its correct casing. */
const PIN = { iso: "ISO", isms: "ISMS", cia: "CIA", pdca: "PDCA", soa: "SoA", saas: "SaaS", ai: "AI" };
/* Named, measured, and deliberately NOT applied. See the header. */
const ADJACENT = { aims: "AIMS" };

/** Every token of a name that is one of the pinned initialisms and is not
 *  already correctly cased. Returns one entry per OCCURRENCE. */
function offences(name, table = PIN) {
  const out = [];
  const toks = String(name || "").split(/(\s+)/);
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const want = table[t.toLowerCase()];
    if (want && t !== want) out.push({ index: i, got: t, want });
  }
  return out;
}
function fix(name, table = PIN) {
  const toks = String(name || "").split(/(\s+)/);
  for (const o of offences(name, table)) toks[o.index] = o.want;
  return toks.join("");
}

/* POSITIVE CONTROL, including the two-offence row and the rows that must NOT
 * change -- a correctly cased initialism, and a word that merely contains one
 * ("Saas" inside no other word here, but "aims" as a verb elsewhere). */
const CONTROL = [
  ["Saas ai in scope", "SaaS AI in scope", 2],
  ["Iso 27005 risk", "ISO 27005 risk", 1],
  ["ISO 27005 risk", "ISO 27005 risk", 0],
  ["Shadow ai", "Shadow AI", 1],
  ["Acceptable use ai", "Acceptable use AI", 1],
  ["Soa is justification", "SoA is justification", 1],
  ["Risk appetite", "Risk appetite", 0],
];
for (const [inp, want, wantN] of CONTROL) {
  const got = fix(inp), n = offences(inp).length;
  if (got !== want || n !== wantN) {
    console.error("POSITIVE CONTROL FAILED on: " + inp);
    console.error("  got  \"" + got + "\" (" + n + ")   want \"" + want + "\" (" + wantN + ")");
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length +
            " known cases correct, including the two-offence row and two no-ops");

/* ------------------------------------------------------------------- read */
const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

/* CORPUS-WIDE, then reported per certification with its denominator. A firing
 * count recorded as a single number is the defect that made the slug-derived
 * guard look narrow. */
const byCert = new Map();
for (const c of live) {
  const code = codeOf.get(c.certification_id);
  const o = offences(c.name);
  const e = byCert.get(code) || { live: 0, rows: 0, tokens: 0 };
  e.live++;
  if (o.length) { e.rows++; e.tokens += o.length; }
  byCert.set(code, e);
}

console.log("");
console.log("BEFORE -- not-fully-uppercase initialism, PER TOKEN, per certification");
console.log("   cert        live   rows   tokens");
let totRows = 0, totTokens = 0;
for (const [code, e] of [...byCert.entries()].sort((a, b) => b[1].tokens - a[1].tokens)) {
  totRows += e.rows; totTokens += e.tokens;
  if (e.tokens) console.log("   " + code.padEnd(11) + String(e.live).padStart(4) + String(e.rows).padStart(7) + String(e.tokens).padStart(9));
}
console.log("   " + "TOTAL".padEnd(11) + String(live.length).padStart(4) + String(totRows).padStart(7) + String(totTokens).padStart(9));

const plan = live.filter((c) => offences(c.name).length)
  .map((c) => ({
    id: c.id, cert: codeOf.get(c.certification_id), slug: c.slug,
    before: c.name, after: fix(c.name), tokens: offences(c.name).length,
  }))
  .sort((a, b) => (a.cert + a.slug).localeCompare(b.cert + b.slug));

console.log("");
for (const p of plan) {
  console.log("   " + p.cert.padEnd(9) + p.slug.padEnd(28) + "x" + p.tokens + "   \"" + p.before + "\"  ->  \"" + p.after + "\"");
}

/* THE AGREEMENT IS THE LICENCE TO WRITE. The census named 21 rows and 22
 * tokens. If this assertion disagrees, one of the two is wrong and neither
 * gets applied until that is settled. */
const EXPECT_ROWS = 21, EXPECT_TOKENS = 22;
console.log("");
if (totRows !== EXPECT_ROWS || totTokens !== EXPECT_TOKENS) {
  console.error("REFUSING: the assertion and the census disagree.");
  console.error("  assertion  " + totRows + " row(s), " + totTokens + " token(s)");
  console.error("  census     " + EXPECT_ROWS + " row(s), " + EXPECT_TOKENS + " token(s)");
  console.error("  Nothing is written until that is resolved.");
  process.exit(1);
}
console.log("AGREEMENT: " + totRows + " rows / " + totTokens + " tokens, matching the census exactly.");

/* The adjacent candidate, named and not applied. */
const adj = live.filter((c) => offences(c.name, ADJACENT).length);
if (adj.length) {
  console.log("");
  console.log("ADJACENT, NOT IN THIS PASS -- initialisms outside the ruled seven:");
  for (const c of adj) {
    console.log("   " + codeOf.get(c.certification_id).padEnd(9) + c.slug.padEnd(28) +
                "\"" + c.name + "\"  ->  \"" + fix(c.name, ADJACENT) + "\"?");
    console.log("      description: " + String(c.description).slice(0, 84));
  }
  console.log("   Not applied: it would move the expected token count off 22 and break the");
  console.log("   agreement above. Wants a ruling of its own.");
}

const ids = new Set(plan.map((p) => p.id));
const untouched = live.filter((c) => !ids.has(c.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
console.log("");
console.log("   untouched-name checksum " + untouchedHash + " over " + untouched.length + " row(s)");

writeFileSync(join(HERE, "..", "PIN-INITIALISM-PLAN.json"),
  JSON.stringify({ measured: "2026-09-22", rows: totRows, tokens: totTokens, untouchedHash, plan,
    adjacent_not_applied: adj.map((c) => ({ slug: c.slug, name: c.name })) }, null, 2), "utf8");
console.log("   wrote PIN-INITIALISM-PLAN.json");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ------------------------------------------------------------------ write */
console.log("");
console.log("APPLYING " + plan.length + " row(s)...");
for (const p of plan) {
  const r = await fetch(BASE + "/concepts?id=eq." + p.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ name: p.after }),
  });
  if (!r.ok) throw new Error("PATCH failed on " + p.slug + ": HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const back = await r.json();
  if (!back[0] || back[0].name !== p.after) throw new Error("read-back mismatch on " + p.slug);
}

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };

const after = (await allRows("concepts?select=id,slug,name,certification_id,retired_at")).filter((c) => !c.retired_at);
const afterTokens = after.reduce((n, c) => n + offences(c.name).length, 0);
const afterRows = after.filter((c) => offences(c.name).length).length;

ok("AFTER: 0 tokens corpus-wide", afterTokens === 0, totTokens + " -> " + afterTokens);
ok("AFTER: 0 rows corpus-wide", afterRows === 0, totRows + " -> " + afterRows);
ok("every planned row carries its new name",
   plan.every((p) => after.find((c) => c.id === p.id)?.name === p.after));

/* THE NEGATIVE HALF: a sweep that also rewrote names it had no business
 * touching would satisfy every assertion above. */
const untouchedAfter = after.filter((c) => !ids.has(c.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name);
ok("every name outside the plan is byte-identical",
   createHash("sha256").update(untouchedAfter.join("\n")).digest("hex").slice(0, 16) === untouchedHash);

/* Only casing moved. */
ok("only letter case changed in every edited name",
   plan.every((p) => p.before.toLowerCase() === p.after.toLowerCase()));

/* The adjacent candidate is still there, untouched, so it cannot be quietly
 * absorbed by this pass and forgotten. */
ok("the adjacent `aims` candidate was NOT swept in",
   after.filter((c) => offences(c.name, ADJACENT).length).length === adj.length,
   adj.length + " still awaiting a ruling");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Done. " + totTokens + " token(s) across " + totRows + " row(s).");
