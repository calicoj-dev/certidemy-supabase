#!/usr/bin/env node
/**
 * apply-ismsf-close.mjs - everything approved and not yet applied for ISMS-F.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THREE SOURCES, ONE PASS ============
 *
 *   ISMS-F-REWRITE-BATCH-1-REVISED.json   6 rows. Approved, and the approval
 *     fell between turns -- batch 2's apply list never contained them. FOUR of
 *     these are the four remaining ISMS-F fires, which is why the fire count
 *     has been stuck at 4 across two batches.
 *   ISMS-F-BATCH-2-RETURNED.json          4 rows, approved as written.
 *   ISMS-F-REWRITE-BATCH-3.json          11 rewrites. Its 13 keep-on-read rows
 *     need no write and are deliberately not touched.
 *
 * Reading all three from disk rather than listing slugs here: a hand-typed
 * list is a second copy of a decision, and the files ARE the decision.
 *
 * ============ THIS SCRIPT WRITES NO HASH COLUMN ============
 *
 * An English edit moves concept_row_en_hash and withholds both translations
 * until a generator restamps them from the English it actually translated.
 * Re-syncing here would blindfold the gate. ISMS-F is blocked in both
 * languages, so the withheld count is debt and it is reported, not silent.
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

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
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

/* ---- gather, from the files that ARE the decision ---- */
const SRC = [
  ["ISMS-F-REWRITE-BATCH-1-REVISED.json", "rows", 6],
  ["ISMS-F-BATCH-2-RETURNED.json", "rows_detail", 4],
  ["ISMS-F-REWRITE-BATCH-3.json", "rows_detail", 11],
];
const want = new Map();
for (const [file, key, expect] of SRC) {
  const p = join(ROOT, file);
  if (!existsSync(p)) { console.error("REFUSING: " + file + " is missing"); process.exit(2); }
  const arr = JSON.parse(readFileSync(p, "utf8"))[key];
  if (!Array.isArray(arr)) { console.error("REFUSING: " + file + " -> " + key + " is not an array"); process.exit(2); }
  /* EVERY FILE'S COUNT IS ASSERTED. A source that silently shrank would apply
   * fewer rows and still report success. */
  if (arr.length !== expect) {
    console.error("REFUSING: " + file + " holds " + arr.length + " rows, expected " + expect);
    process.exit(2);
  }
  for (const r of arr) {
    if (!r.slug || !r.proposed) { console.error("REFUSING: a row in " + file + " has no slug or no proposed text"); process.exit(2); }
    if (want.has(r.slug)) { console.error("REFUSING: " + r.slug + " appears in two source files"); process.exit(2); }
    want.set(r.slug, { text: r.proposed, from: file });
  }
}
console.log("gathered " + want.size + " approved row(s) from " + SRC.length + " file(s)");

/* Batch 3's keep-on-read rows must NOT be written. Asserted explicitly rather
 * than left to the fact that they carry no `proposed` field. */
const keeps = JSON.parse(readFileSync(join(ROOT, "ISMS-F-REWRITE-BATCH-3.json"), "utf8")).keep_on_read;
for (const k of keeps) {
  if (want.has(k.slug)) { console.error("REFUSING: keep-on-read row " + k.slug + " is in the write set"); process.exit(2); }
}
console.log("keep-on-read: " + keeps.length + " row(s), none in the write set");

const certs = await allRows("certifications?select=id,code");
const cert = certs.find((c) => c.code === "ISMS-F");
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at && c.certification_id === cert.id);

const plan = [];
for (const [slug, v] of want) {
  const row = live.find((c) => c.slug === slug);
  if (!row) { console.error("REFUSING: ISMS-F has no live concept " + slug); process.exit(2); }
  if (row.description === v.text) { console.log("  already applied: " + slug); continue; }
  plan.push({ id: row.id, slug, before: row.description, after: v.text, from: v.from });
}

console.log("");
console.log("ISMS-F CLOSE -- " + plan.length + " row(s) to write");
for (const p of plan) {
  console.log("");
  console.log("  " + p.slug + "   [" + p.from.replace("ISMS-F-", "").replace(".json", "") + "]");
  console.log("    -  " + p.before);
  console.log("    +  " + p.after);
}

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
ok("every ISMS-F row outside the write set is byte-identical",
   createHash("sha256").update(ua.join("\n")).digest("hex").slice(0, 16) === untouchedHash);
ok("ISMS-F still has 192 live concepts", after.length === 192, String(after.length));
/* THE NEGATIVE HALF: a pass that also rewrote the keeps would satisfy
 * everything above. */
ok("every keep-on-read row is unchanged",
   keeps.every((k) => after.find((c) => c.slug === k.slug)?.description === k.text),
   keeps.length + " checked");

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
console.log("  en_hash-stale ISMS-F translations: " + withheld + " (SERVING: " + serving + ")");
ok("no SERVING translation was withheld", serving === 0, "ISMS-F is blocked in both languages");

writeFileSync(join(ROOT, "ISMS-F-CLOSE-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", rows: plan.length,
  slugs: plan.map((p) => ({ slug: p.slug, from: p.from })),
  keep_on_read_untouched: keeps.map((k) => k.slug),
  withheld_translations: withheld, serving_withheld: serving, untouchedHash,
}, null, 2), "utf8");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Applied " + plan.length + " row(s).");
