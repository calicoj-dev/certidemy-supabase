#!/usr/bin/env node
/**
 * apply-batch-a.mjs - batch A's ten, the two revised rows, and the one-row
 * ISMS-F contradiction fix.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE ISMS-F EXCEPTION ============
 *
 * ISMS-F is closed as an exposure matter. `auditor-objectivity` is reopened
 * for one row because a CONTRADICTION is worse than either version of it:
 * ISMS-F served "the requirement that auditors do not audit their own work"
 * while AIMS-IA and ISMS-IA both said no indexed standard contains that rule
 * and named reading it as a requirement as the trap. Three certifications,
 * one unauthenticated endpoint, opposite claims about what a standard says.
 *
 * Verified before changing anything, with positive controls:
 *   ABSENT from 19011:2026, 27001:2022, 42001:2023 and 27002:2022 -- "audit
 *   their own work", "auditors shall not audit", "not audit their own",
 *   "shall not audit their own work", "auditing their own work". Four
 *   controls found, so the search was working.
 *   PRESENT in 27001:2022 -- "select auditors and conduct audits that ensure
 *   objectivity and the impartiality of the audit process".
 *
 * The replacement asserts only what was found. It does NOT attribute the
 * absolute rule to ISO/IEC 17021, which is not on disk and therefore not
 * something this repository can verify.
 *
 * ============ WRITES NO HASH COLUMN ============
 *
 * An English edit moves concept_row_en_hash and withholds the translations
 * until a generator restamps them. AIMS-IA and ISMS-IA translations ARE
 * SERVING, unlike ISMS-F's, so the withheld count here is real and is
 * reported per certification rather than as a total.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
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

/* THE CLAIM VERIFICATION MUST HAVE PASSED. A clearance that applies rows
 * whose claims were never checked is the shape this whole mechanism exists to
 * stop, so the artifact is read and asserted rather than assumed. */
const cv = join(ROOT, "CLAIM-VERIFICATION.json");
if (!existsSync(cv)) { console.error("REFUSING: CLAIM-VERIFICATION.json is missing. Run verify-claims.mjs."); process.exit(2); }
const claims = JSON.parse(readFileSync(cv, "utf8"));
if (claims.control_failures !== 0 || claims.claim_failures !== 0) {
  console.error("REFUSING: claim verification reports " + claims.control_failures +
                " control failure(s) and " + claims.claim_failures + " claim failure(s).");
  process.exit(2);
}
console.log("claim verification: " + claims.claims.length + " claims, 0 control failures, 0 claim failures");

/* ---- the write set ---- */
const batchA = JSON.parse(readFileSync(join(ROOT, "AIMS-IA-REWRITE-BATCH-A.json"), "utf8")).rows_detail;
const revised = JSON.parse(readFileSync(join(ROOT, "AIMS-IA-BATCH-A-REVISED.json"), "utf8")).rows_detail;
if (batchA.length !== 10) { console.error("REFUSING: batch A holds " + batchA.length + " rows, expected 10"); process.exit(2); }
if (revised.length !== 2) { console.error("REFUSING: revised holds " + revised.length + " rows, expected 2"); process.exit(2); }

const revisedBy = new Map(revised.map((r) => [r.slug, r.proposed]));
const want = new Map();
for (const r of batchA) want.set(r.slug, { cert: r.cert, text: revisedBy.get(r.slug) ?? r.proposed,
                                           revised: revisedBy.has(r.slug) });
/* Both revised slugs must exist in batch A, or the revision targets nothing. */
for (const s of revisedBy.keys()) if (!want.has(s)) { console.error("REFUSING: revised row " + s + " is not in batch A"); process.exit(2); }

const ISMS_F_FIX = {
  slug: "auditor-objectivity", cert: "ISMS-F",
  text: "Clause 9.2.2 asks that auditors be selected and audits conducted so that objectivity and impartiality are ensured - not that nobody may audit their own area. Neither ISO/IEC 27001 nor ISO 19011 contains that prohibition, and reading the practice convention as a requirement is the common error.",
};
want.set(ISMS_F_FIX.slug, { cert: ISMS_F_FIX.cert, text: ISMS_F_FIX.text, revised: false, contradiction_fix: true });

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

const plan = [];
for (const [slug, v] of want) {
  const row = live.find((c) => c.slug === slug && codeOf.get(c.certification_id) === v.cert);
  if (!row) { console.error("REFUSING: " + v.cert + " has no live concept " + slug); process.exit(2); }
  if (row.description === v.text) { console.log("  already applied: " + v.cert + "/" + slug); continue; }
  plan.push({ id: row.id, cert: v.cert, slug, before: row.description, after: v.text,
              revised: v.revised, fix: !!v.contradiction_fix });
}

console.log("");
console.log("WRITE SET -- " + plan.length + " row(s)");
for (const p of plan) {
  console.log("");
  console.log("  " + p.cert + " / " + p.slug + (p.revised ? "   [revised]" : "") + (p.fix ? "   [CONTRADICTION FIX]" : ""));
  console.log("    -  " + p.before.slice(0, 160) + (p.before.length > 160 ? " ..." : ""));
  console.log("    +  " + p.after.slice(0, 160) + (p.after.length > 160 ? " ..." : ""));
}

const ids = new Set(plan.map((p) => p.id));
const touchedCerts = new Set(plan.map((p) => p.cert));
const scope = live.filter((c) => touchedCerts.has(codeOf.get(c.certification_id)));
const untouched = scope.filter((c) => !ids.has(c.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((c) => c.id + "|" + c.name + "|" + c.description);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
console.log("");
console.log("  untouched-row checksum " + untouchedHash + " over " + untouched.length +
            " row(s) in " + [...touchedCerts].join(", "));

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
ok("every row carries its new text", plan.every((p) => after.find((c) => c.id === p.id)?.description === p.after));
const ua = after.filter((c) => touchedCerts.has(codeOf.get(c.certification_id)) && !ids.has(c.id))
  .sort((a, b) => a.id.localeCompare(b.id)).map((c) => c.id + "|" + c.name + "|" + c.description);
ok("every untouched row in the affected certifications is byte-identical",
   createHash("sha256").update(ua.join("\n")).digest("hex").slice(0, 16) === untouchedHash);
/* THE CONTRADICTION IS GONE, asserted directly rather than inferred from the
 * write having landed. */
const af = after.find((c) => c.slug === "auditor-objectivity" && codeOf.get(c.certification_id) === "ISMS-F");
ok("ISMS-F no longer asserts the prohibition",
   af && !/requirement that auditors do not audit their own work/i.test(af.description));

const trs = await allRows("concept_translations?select=concept_id,language,en_hash,is_provisional");
const byId = new Map(after.map((c) => [c.id, c]));
const withheld = {}; let servingWithheld = 0;
for (const t of trs) {
  const c = byId.get(t.concept_id);
  if (!c || !ids.has(c.id)) continue;
  if (t.en_hash === enHash(c.name, c.description)) continue;
  const code = codeOf.get(c.certification_id);
  withheld[code] = (withheld[code] || 0) + 1;
  if (!t.is_provisional) servingWithheld++;
}
console.log("");
console.log("  translations withheld by these edits, per certification: " + JSON.stringify(withheld));
console.log("  of which were SERVING: " + servingWithheld + "  -- these are now English fallback");
console.log("  Expected and accepted: AIMS-IA and ISMS-IA translations are cleared and serving,");
console.log("  unlike ISMS-F's. They resolve at retranslation; this script writes no hash.");

writeFileSync(join(ROOT, "BATCH-A-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", rows: plan.length,
  slugs: plan.map((p) => ({ cert: p.cert, slug: p.slug, revised: p.revised, contradiction_fix: p.fix })),
  withheld_per_certification: withheld, serving_withheld: servingWithheld, untouchedHash,
}, null, 2), "utf8");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Applied " + plan.length + " row(s).");
