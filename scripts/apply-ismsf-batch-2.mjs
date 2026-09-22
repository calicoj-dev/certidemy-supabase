#!/usr/bin/env node
/**
 * apply-ismsf-batch-2.mjs - the approved ISMS-F descriptions from batch 2.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ 36, NOT 37, AND THE ARITHMETIC IS WORTH STATING ============
 *
 * The review's verdict block reads apply 37 / return 3. The instruction that
 * follows it also asks for `access-control` to be reworded and sent back,
 * because its teaching move duplicated batch 1's `least-privilege`. Those two
 * cannot both hold: 40 rows, 3 returned and access-control also returned
 * leaves 36.
 *
 * Taking 36. Applying access-control as written would contradict an explicit
 * instruction to change it, and the cost of being wrong the other way is one
 * row applied a day later rather than one row serving text the reviewer asked
 * to have rewritten.
 *
 * NOT HERE, and each for a stated reason:
 *   top-management   unsupported non-delegation claim - "delegate" appears
 *                    nowhere in 27001:2022
 *   pdca-cycle       unsupported clause mapping - "plan-do-check-act" appears
 *                    in neither 27001 nor 42001
 *   planned-change   undocumented -> unplanned
 *   access-control   teaching move duplicated least-privilege
 *
 * All four are in ISMS-F-BATCH-2-RETURNED.json.
 *
 * ============ THIS SCRIPT WRITES NO HASH COLUMN ============
 *
 * Changing an English description moves concept_row_en_hash and withholds both
 * translations until a generator restamps them from the English it actually
 * translated. Re-syncing here would blindfold the gate. ISMS-F is blocked in
 * both languages, so the withheld count is debt, not exposure - and it is
 * reported rather than left silent.
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
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
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

async function rest(path, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (page.length < 500) break; from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE on " + path + ": " + out.length + " of " + total);
  return out;
}
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").replaceAll(String.fromCharCode(13), "") + "|" +
          String(d ?? "").replaceAll(String.fromCharCode(13), ""))
  .digest("hex").slice(0, 16);

/* The 13 unconditional approvals plus the one verified citation row. Named
 * explicitly: a batch that says "everything approved" cannot be checked later. */
const RETURNED = new Set(["top-management", "pdca-cycle", "planned-change", "access-control"]);
const APPROVED = new Set(
  JSON.parse(readFileSync(join(ROOT, "ISMS-F-REWRITE-BATCH-2.json"), "utf8"))
    .rows_detail.map((r) => r.slug).filter((s) => !RETURNED.has(s)));

const batch = JSON.parse(readFileSync(join(ROOT, "ISMS-F-REWRITE-BATCH-2.json"), "utf8"));
const proposed = new Map(batch.rows_detail.map((r) => [r.slug, r.proposed]));

const missing = [...APPROVED].filter((s) => !proposed.has(s));
if (missing.length) { console.error("REFUSING: no proposal for " + missing.join(", ")); process.exit(2); }
if (APPROVED.size !== 36) { console.error("REFUSING: expected 36 approved, have " + APPROVED.size); process.exit(2); }

const certs = await allRows("certifications?select=id,code");
const cert = certs.find((c) => c.code === "ISMS-F");
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at && c.certification_id === cert.id);

const plan = [];
for (const slug of APPROVED) {
  const row = live.find((c) => c.slug === slug);
  if (!row) { console.error("REFUSING: ISMS-F has no live concept " + slug); process.exit(2); }
  const after = proposed.get(slug);
  if (row.description === after) { console.log("  already applied: " + slug); continue; }
  plan.push({ id: row.id, slug, name: row.name, before: row.description, after });
}

console.log("");
console.log("ISMS-F BATCH 2 -- " + plan.length + " row(s) to write of " + APPROVED.size + " approved");
for (const p of plan) {
  console.log("");
  console.log("  " + p.slug);
  console.log("    -  " + p.before);
  console.log("    +  " + p.after);
}

/* Every row this batch must NOT touch. A count passes on two rows swapping. */
const ids = new Set(plan.map((p) => p.id));
const untouched = live.filter((c) => !ids.has(c.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name + "|" + c.description);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
console.log("");
console.log("  untouched-row checksum " + untouchedHash + " over " + untouched.length + " ISMS-F row(s)");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
console.log("APPLYING...");
for (const p of plan) {
  const back = await rest("concepts?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ description: p.after }),
  });
  if (!back?.[0] || back[0].description !== p.after) throw new Error("read-back mismatch on " + p.slug);
}
console.log("  wrote " + plan.length + " description(s)");

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };

const after = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at && c.certification_id === cert.id);
ok("every approved row carries its new text",
   plan.every((p) => after.find((c) => c.id === p.id)?.description === p.after));
const ua = after.filter((c) => !ids.has(c.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name + "|" + c.description);
ok("every ISMS-F row outside the batch is byte-identical",
   createHash("sha256").update(ua.join("\n")).digest("hex").slice(0, 16) === untouchedHash);
ok("ISMS-F still has 192 live concepts", after.length === 192, String(after.length));

/* THE GATE'S CONSEQUENCE, REPORTED NOT REPAIRED. */
const trs = await allRows("concept_translations?select=concept_id,language,en_hash,is_provisional");
const byId = new Map(after.map((c) => [c.id, c]));
let withheld = 0, serving = 0;
for (const t of trs) {
  const c = byId.get(t.concept_id);
  if (!c) continue;
  if (t.en_hash === enHash(c.name, c.description)) continue;
  withheld++;
  if (!t.is_provisional) serving++;
}
console.log("");
console.log("  en_hash-stale ISMS-F translations now: " + withheld + " (of which SERVING: " + serving + ")");
ok("no SERVING translation was withheld by this batch", serving === 0,
   "ISMS-F is blocked in both languages, so this is debt and not exposure");
console.log("  These resolve at retranslation. This script does not write en_hash.");

writeFileSync(join(ROOT, "ISMS-F-BATCH-2-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", rows: plan.length, approved: [...APPROVED],
  withheld_translations: withheld, serving_withheld: serving, untouchedHash,
}, null, 2), "utf8");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Batch 2 applied: " + plan.length + " row(s).");
