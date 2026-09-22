#!/usr/bin/env node
/**
 * clear-ia-translations.mjs - clear AIMS-IA and ISMS-IA, both languages.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ IT VERIFIES. IT NEVER STAMPS. ============
 *
 * A clearance that recomputes a hash and writes it makes every row fresh by
 * construction and the gate is never consulted -- the defect this repository
 * found and repaired in every clearance script it had. This one READS the
 * stored hashes, recomputes from current content, and REFUSES any row where
 * they disagree. Refused rows stay provisional.
 *
 * FIVE REFUSALS ARE EXPECTED and they are the mechanism working:
 *   ISMS-IA es-419  ia-risk-acceptance-criteria
 *                   ia-management-review-inputs-clause-9-3-2
 *                   ia-risk-assessment-process-clause-6-1-2
 *   AIMS-IA pt-BR   aia-principle-interaction-in-practice
 *                   aia-annex-a-5-impact-controls
 *
 * The evaluacion and Secao pins edited those five and deliberately did not
 * re-stamp, so the stale hash would force a re-read. None of the five is in
 * the 40-slug sample, so none has been re-read. A sample clears a
 * certification, but it cannot vouch for a row edited after it was drawn and
 * never looked at.
 *
 * ============ SCOPE ============
 *
 * Exactly four certification+language pairs. Nothing else clears on the
 * strength of this run, and the script refuses any pair not named here.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
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
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 220));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
const rpc = (fn, args) => rest("rpc/" + fn, { method: "POST", body: JSON.stringify(args) });
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

const PAIRS = [["AIMS-IA", "es-419"], ["AIMS-IA", "pt-BR"], ["ISMS-IA", "es-419"], ["ISMS-IA", "pt-BR"]];
const SEED = "2026-09-22-aims-ia-retranslation";
const CLAIM =
  "Paired sample, seed " + SEED + ": 40 concept slugs drawn across AIMS-IA and ISMS-IA, both languages " +
  "of each emitted together, 80 renderings read in full. Verdict 36 ok / 4 reword / 0 wrong -- 4 rewords in " +
  "80 renderings is 5.0 percent, against 5.2 percent in the 480-row sample that cleared sixteen draws, with " +
  "ZERO meaning defects against four in that sample. All four rewords applied before this clearance, together " +
  "with the modal pin (Portuguese localises to convem que / deve with the English in parentheses on first " +
  "mention) and the register pins (Portuguese straight quotes, Spanish evaluar). " +
  "LIMIT: the leak index is ENGLISH-ONLY, so whether a translated row coincides with ISO's own official " +
  "Spanish or Portuguese rendering is unmeasurable here. The ordering protects in practice -- these were " +
  "translated from clean English rather than from reproductions -- but no instrument in this repository " +
  "can demonstrate it.";

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const idOf = new Map(certs.map((c) => [c.code, c.id]));
const concepts = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const conBy = new Map(concepts.map((c) => [c.id, c]));
const trs = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");

const groups = [];
for (const [cert, lang] of PAIRS) {
  const cid = idOf.get(cert);
  const rows = trs.filter((t) => t.language === lang && conBy.get(t.concept_id)?.certification_id === cid);
  const verified = [], refused = [];
  for (const t of rows) {
    const c = conBy.get(t.concept_id);
    const enOk = t.en_hash === enHash(c.name, c.description);
    const trOk = t.tr_hash === await rpc("translation_hash", { p_a: t.name, p_b: t.description });
    if (enOk && trOk) verified.push(t);
    else refused.push({ t, slug: c.slug, enOk, trOk });
  }
  groups.push({ cert, lang, rows, verified, refused });
}

console.log("");
console.log("CLEARANCE -- seed " + SEED);
console.log("  pair            rows  verified  refused  already cleared");
for (const g of groups) {
  console.log("  " + (g.cert + " " + g.lang).padEnd(16) + String(g.rows.length).padStart(4) +
    String(g.verified.length).padStart(10) + String(g.refused.length).padStart(9) +
    String(g.rows.filter((r) => !r.is_provisional).length).padStart(17));
}
const allRefused = groups.flatMap((g) => g.refused.map((r) => ({ ...r, cert: g.cert, lang: g.lang })));
if (allRefused.length) {
  console.log("");
  console.log("  REFUSED -- stored hash does not match current content, so the row stays withheld:");
  for (const r of allRefused) {
    console.log("    " + r.cert.padEnd(9) + r.lang.padEnd(8) + r.slug.padEnd(42) +
      (r.enOk ? "" : "en_hash stale ") + (r.trOk ? "" : "tr_hash stale"));
  }
  console.log("  A clearance VERIFIES and never stamps. These need a re-read, not a re-hash.");
}

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
console.log("APPLYING...");
for (const g of groups) {
  const toFlip = g.verified.filter((t) => t.is_provisional);
  for (const t of toFlip) {
    const back = await rest("concept_translations?id=eq." + t.id, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      /* "approved", not "cleared": concept_translations_review_chk allows only
       * unreviewed / approved / rejected. The first run used "cleared" and the
       * constraint refused it with 23514 -- a vocabulary invented at the call
       * site against one declared in the schema, caught by the schema. */
      body: JSON.stringify({ is_provisional: false, review_status: "approved" }),
    });
    if (!back?.[0] || back[0].is_provisional !== false) throw new Error("clear failed on " + t.id);
  }
  /* Supersede any live review row for the pair, then record this one. */
  await rest("concept_translation_reviews?certification=eq." + g.cert +
             "&language=eq." + encodeURIComponent(g.lang) + "&superseded_at=is.null", {
    method: "PATCH",
    body: JSON.stringify({ superseded_at: new Date().toISOString(),
      superseded_reason: "superseded by the " + SEED + " paired retranslation clearance" }),
  });
  const en = await rpc("concept_en_hash", { p_cert: g.cert });
  const tr = await rpc("concept_tr_hash", { p_cert: g.cert, p_lang: g.lang });
  await rest("concept_translation_reviews", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      certification: g.cert, language: g.lang, verdict: "approved",
      seed: SEED, sample_size: 20, population: g.rows.length,
      reviewed_on: "2026-09-22", reviewed_by: "claude-director",
      en_hash: en, tr_hash: tr, source_gate_ran: true,
      clearance_claim: CLAIM,
      found_by: "paired draw, both languages of each slug emitted together",
      note: "Cleared " + toFlip.length + " row(s); " + g.refused.length +
        " refused for a hash mismatch and left withheld.",
    }),
  });
  console.log("  " + g.cert + " " + g.lang + ": cleared " + toFlip.length + ", refused " + g.refused.length);
}

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
const after = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");
const aBy = new Map(after.map((t) => [t.id, t]));
ok("every verified row is now cleared",
   groups.every((g) => g.verified.every((t) => aBy.get(t.id)?.is_provisional === false)));
/* THE NEGATIVE HALF: a clearance that also released the refused rows would
 * satisfy everything above. */
ok("every refused row is still provisional",
   allRefused.every((r) => aBy.get(r.t.id)?.is_provisional === true), allRefused.length + " checked");
ok("no hash was written by this run",
   groups.every((g) => g.rows.every((t) => aBy.get(t.id)?.tr_hash === t.tr_hash && aBy.get(t.id)?.en_hash === t.en_hash)));
const outside = after.filter((t) => {
  const c = conBy.get(t.concept_id); if (!c) return false;
  const code = codeOf.get(c.certification_id);
  return !PAIRS.some(([ce, la]) => ce === code && la === t.language);
});
const before = new Map(trs.map((t) => [t.id, t.is_provisional]));
ok("nothing outside the four pairs changed state",
   outside.every((t) => before.get(t.id) === t.is_provisional), outside.length + " row(s) checked");

writeFileSync(join(ROOT, "IA-CLEARANCE-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", seed: SEED,
  pairs: groups.map((g) => ({ cert: g.cert, lang: g.lang, rows: g.rows.length,
    cleared: g.verified.length, refused: g.refused.map((r) => r.slug) })),
}, null, 2), "utf8");

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
if (allRefused.length) {
  console.log("Cleared, with " + allRefused.length + " row(s) refused and still withheld. They need a re-read.");
  process.exit(1);
}
console.log("Cleared.");
