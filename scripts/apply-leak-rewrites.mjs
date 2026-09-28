#!/usr/bin/env node
/**
 * apply-leak-rewrites.mjs -- the 11 approved leak rewrites, PROMPT-84 section 3.
 *
 * WRITES English concept descriptions. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHAT THESE ARE ============
 *
 * 11 live concept descriptions that fire the leak gate against the widened 15-document index. Six were
 * approved as drafted; five carried a claim the leak scorer cannot see and were corrected against the
 * ruling. Two of those five asserted the OPPOSITE of the Regulation -- `gpai-obligations` said the
 * obligations do not reach a downstream fine-tuner, and `minimal-risk` said the provider is obliged to
 * do nothing. Both are false, both scored clean, and no instrument in this repository would have said
 * so. A leak score is about reproduction and has never been about accuracy.
 *
 * ============ THIS SCRIPT WRITES NO HASH COLUMN ============
 *
 * Changing an English description moves `concept_row_en_hash`, which withholds both translations until
 * a generator restamps them from the English it actually translated. That is the gate working, and
 * re-syncing the hash here would blindfold it -- only the generator path may write a hash.
 *
 * ============ AND UNLIKE THE ISMS-F BATCHES, THESE CERTIFICATIONS ARE SERVING ============
 *
 * ISMS-F was blocked in both languages, so its batches created debt and no exposure. AISM-I, AIGRM-I,
 * SPO-AI-I and SM-AI-I are not blocked: withholding their translations is a real, visible gap on a
 * live surface. That is why the ruling requires es-419 and pt-BR retranslated IN THE SAME COMMIT, and
 * why the serving-withheld count below is the number to act on rather than to note.
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
      const r = await fetch(BASE + "/" + path,
        { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
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
    const r = await fetch(BASE + "/" + path,
      { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
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

/* The ruling's two lists, named rather than inferred: a batch that says "everything approved"
 * cannot be checked later. Membership of the second list is also the claim that the text on disk
 * has been corrected, which is asserted below against `draft_original`. */
const AS_DRAFTED = ["management-practice", "governance-definition", "product-ecosystem-actors",
  "scrum-adoption", "explainability-for-stakeholders", "synthetic-content-labeling"];
const CORRECTED = ["incident-management", "guiding-principles", "gpai-obligations",
  "minimal-risk", "story-independence"];

const spec = JSON.parse(readFileSync(join(ROOT, "LEAK-REWRITE-DRAFTS.json"), "utf8"));
const bySlug = new Map(spec.drafts.map((d) => [d.slug, d]));
for (const s of [...AS_DRAFTED, ...CORRECTED]) {
  if (!bySlug.has(s)) { console.error("REFUSING: no draft for " + s); process.exit(2); }
}
if (bySlug.size !== 11) { console.error("REFUSING: expected 11 drafts, have " + bySlug.size); process.exit(2); }
/* A corrected slug must actually carry a correction, or this batch is applying the text the ruling
 * rejected while claiming otherwise. */
for (const s of CORRECTED) {
  const d = bySlug.get(s);
  if (!d.draft_original || d.draft === d.draft_original) {
    console.error("REFUSING: " + s + " is on the corrected list but its draft is unchanged.");
    console.error("  Run the correction step first; applying the original would ship the ruled-out text.");
    process.exit(2);
  }
}
for (const s of AS_DRAFTED) {
  if (bySlug.get(s).draft_original) {
    console.error("REFUSING: " + s + " was approved AS DRAFTED but carries a correction."); process.exit(2);
  }
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const idOfCode = new Map(certs.map((c) => [c.code, c.id]));
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

const plan = [];
for (const [slug, d] of bySlug) {
  const cid = idOfCode.get(d.cert);
  const row = live.find((c) => c.slug === slug && c.certification_id === cid);
  if (!row) { console.error("REFUSING: " + d.cert + " has no live concept " + slug); process.exit(2); }
  if (row.description === d.draft) { console.log("  already applied: " + slug); continue; }
  if (row.description !== d.current) {
    console.error("REFUSING: " + slug + " no longer carries the text that was scored.");
    console.error("    on disk : " + String(d.current).slice(0, 90));
    console.error("    live    : " + String(row.description).slice(0, 90));
    console.error("  The draft was scored against text that has since moved; re-score before applying.");
    process.exit(2);
  }
  plan.push({ id: row.id, slug, cert: d.cert, name: row.name,
    before: row.description, after: d.draft, corrected: Boolean(d.draft_original) });
}

console.log("");
console.log("LEAK REWRITES -- " + plan.length + " row(s) to write across " +
  new Set(plan.map((p) => p.cert)).size + " certification(s)");
for (const p of plan) {
  console.log("");
  console.log("  " + p.cert + " / " + p.slug + (p.corrected ? "   [CORRECTED per the ruling]" : ""));
  console.log("    -  " + p.before);
  console.log("    +  " + p.after);
}

/* Every row this batch must NOT touch, across the whole corpus rather than one certification:
 * a count passes on two rows swapping values. */
const ids = new Set(plan.map((p) => p.id));
const snap = (rows) => createHash("sha256").update(rows.filter((c) => !ids.has(c.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name + "|" + c.description).join("\n")).digest("hex").slice(0, 16);
const untouchedHash = snap(live);
console.log("");
console.log("  untouched-row checksum " + untouchedHash + " over " + (live.length - ids.size) +
  " live concept(s) corpus-wide");

/* What the en_hash gate will withhold, measured BEFORE the write so the cost is known in advance. */
const trs = await allRows("concept_translations?select=concept_id,language,en_hash,is_provisional");
const willWithhold = trs.filter((t) => ids.has(t.concept_id));
const servingNow = willWithhold.filter((t) => !t.is_provisional).length;
console.log("  translations on these 11 concepts: " + willWithhold.length +
  "   of which SERVING today: " + servingNow);
console.log("  ALL of them go dark the moment the English moves, until the generator restamps.");
console.log("  Retranslate in the same commit:  node scripts/gen-concept-translations.mjs --stale --apply");

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
  .filter((c) => !c.retired_at);
ok("every approved row carries its new text",
  plan.every((p) => after.find((c) => c.id === p.id)?.description === p.after));
ok("every live concept outside the batch is byte-identical", snap(after) === untouchedHash);
ok("the live concept count is unchanged", after.length === live.length,
  live.length + " -> " + after.length);
/* the NEGATIVE half: no corrected slug kept the text the ruling rejected */
ok("no row carries the pre-correction draft",
  !after.some((c) => CORRECTED.some((s) => bySlug.get(s).draft_original === c.description)));

const trs2 = await allRows("concept_translations?select=concept_id,language,en_hash,is_provisional");
const byId = new Map(after.map((c) => [c.id, c]));
let withheld = 0, servingWithheld = 0;
for (const t of trs2) {
  const c = byId.get(t.concept_id);
  if (!c) continue;
  if (t.en_hash === enHash(c.name, c.description)) continue;
  withheld++;
  if (!t.is_provisional) servingWithheld++;
}
console.log("");
console.log("  en_hash-stale translations corpus-wide now: " + withheld +
  " (of which were SERVING: " + servingWithheld + ")");
console.log("  THIS IS THE DEBT THE SAME COMMIT MUST CLEAR. Run the generator now.");

writeFileSync(join(ROOT, "LEAK-REWRITES-APPLIED.json"), JSON.stringify({
  applied: new Date().toISOString().slice(0, 10), rows: plan.length,
  as_drafted: AS_DRAFTED, corrected: CORRECTED,
  withheld_translations: withheld, serving_withheld: servingWithheld, untouchedHash,
}, null, 2) + "\n", "utf8");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Applied: " + plan.length + " description(s).");
