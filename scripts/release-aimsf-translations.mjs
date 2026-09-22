#!/usr/bin/env node
/**
 * release-aimsf-translations.mjs - clear the 308 AIMS-F concept translations
 * and record the review that authorises it.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT IS BEING CLAIMED, AND WHAT IS NOT ============
 *
 * A PAIRED sample of 20 slugs, both languages of each: 40 renderings read, out
 * of 308. That is not a full read and it is not a percentage of the corpus --
 * it is 20 of 154 concepts, each seen twice.
 *
 * What the pairing buys is recorded with the clearance, because the previous
 * shape of this sample cleared two draws that were serving a defect rooted in
 * the ENGLISH: independent per-language draws see different rows, so a defect
 * present in both renderings is found only where the draws happen to overlap.
 * Every row here carried its own control.
 *
 * ============ source_gate_ran IS TRUE, AND THAT IS THE DIFFERENCE =========
 *
 * 356 held AIMS-F because its English was 154 placeholder stubs: a faithful
 * rendering of a stub is a correct translation of nothing, and clearing would
 * have put review provenance behind text that teaches nothing.
 *
 * The English was rewritten in migration 363 and AUDITED SEPARATELY --
 * AIMSF-CLAIM-AUDIT.json, 81 checkable claims, 67 OK, 0 FAIL, 14 unverifiable
 * because the standard is not on disk. That audit is what source_gate_ran = true
 * refers to. Every other row in this table carries FALSE, which is the honest
 * record that no such gate existed when they were cleared.
 *
 * ============ THE HOLD IS SUPERSEDED, NOT DELETED ============
 *
 * The 356 rows stay, with superseded_at and a reason. A held verdict that
 * vanishes when it is resolved leaves a corpus whose history reads as though
 * nothing was ever wrong -- and the reason AIMS-F was held is the most useful
 * thing anyone could know about these 308 rows.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". This is the --apply family: dry by default.");
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
async function rest(p, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 220));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
const rpc = (fn, args) => rest("rpc/" + fn, { method: "POST", body: JSON.stringify(args) });
async function countOf(path) {
  const r = await fetch(BASE + "/" + path + "&limit=1", { headers: { ...H, Prefer: "count=exact" } });
  return Number((r.headers.get("content-range") || "/0").split("/")[1]);
}
const CR = String.fromCharCode(13);
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").split(CR).join("") + "|" + String(d ?? "").split(CR).join(""))
  .digest("hex").slice(0, 16);

const cert = (await rest("certifications?select=id&code=eq.AIMS-F"))[0];
const concepts = (await rest("concepts?select=id,slug,name,description,retired_at&certification_id=eq." + cert.id + "&limit=1000"))
  .filter((c) => c.retired_at === null);
const ids = concepts.map((c) => c.id);
const tr = await rest("concept_translations?select=concept_id,language,name,description,en_hash,is_provisional,review_status"
  + "&concept_id=in.(" + ids.join(",") + ")&limit=2000");
const want = new Map(concepts.map((c) => [c.id, enHash(c.name, c.description)]));

console.log("");
console.log("PRE-CONDITIONS");
let fail = 0;
const say = (n, ok, d) => { if (!ok) fail++; console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };
say("154 live concepts", concepts.length === 154, concepts.length + "");
say("308 translation rows", tr.length === 308, tr.length + "");
const stubs = concepts.filter((c) => (c.description || "").includes("as required or described by ISO/IEC 42001:2023 and taught in the"));
say("no English stub survives", stubs.length === 0, stubs.length + "");
const badName = concepts.filter((c) => /(^|[^A-Za-z])ai([^A-Za-z]|$)/.test(c.name) || /[Aa]nnex +[a-d]([^a-z]|$)/.test(c.name));
say("no lowercase initialism in a name", badName.length === 0, badName.map((c) => c.name).join(", ") || "clean");
const stale = tr.filter((t) => t.en_hash !== want.get(t.concept_id));
say("every en_hash matches the live English", stale.length === 0,
  stale.length ? stale.length + " stale -- these would fall back to English after clearing" : "308 can open the gate");
const already = tr.filter((t) => t.is_provisional === false);
say("nothing is serving yet", already.length === 0, already.length + " already cleared");
const bareSecao = tr.filter((t) => t.language === "pt-BR"
  && /Seção(?!\s+[0-9])/.test(String(t.name || "") + " " + String(t.description || "")));
say("no bare capitalised Secao in pt-BR", bareSecao.length === 0, bareSecao.length + "");

const holds = await rest("concept_translation_reviews?select=id,language,verdict,superseded_at&certification=eq.AIMS-F");
const live356 = holds.filter((h) => h.verdict === "held" && h.superseded_at === null);
say("the two 356 HOLD rows are present and not yet superseded", live356.length === 2, live356.length + " of 2");

const servingBefore = await countOf("concept_translations?select=concept_id&is_provisional=eq.false");
console.log("  serving corpus-wide before          " + servingBefore);

if (fail) { console.error(""); console.error("Refusing to release."); process.exit(1); }

/* Match the review_status convention already in use on cleared rows. */
const sample = await rest("concept_translations?select=review_status&is_provisional=eq.false&limit=1");
const CLEARED_STATUS = (sample[0] && sample[0].review_status) || "approved";
console.log("  cleared rows elsewhere use review_status = " + JSON.stringify(CLEARED_STATUS));

const EN = await rpc("concept_en_hash", { p_cert: "AIMS-F" });
const TR = { "es-419": await rpc("concept_tr_hash", { p_cert: "AIMS-F", p_lang: "es-419" }),
  "pt-BR": await rpc("concept_tr_hash", { p_cert: "AIMS-F", p_lang: "pt-BR" }) };
console.log("  en_hash " + EN + "   tr_hash es " + TR["es-419"] + "   pt " + TR["pt-BR"]);

const CLAIM = "PAIRED sample, seed 2026-09-21-aims-f: 20 concept slugs drawn once and BOTH languages of "
  + "each emitted, so every rendering had the other as its control. 40 renderings read of 308. "
  + "NOT a full read and NOT a percentage of the corpus: 20 of 154 concepts, seen twice. "
  + "Verdicts 13 ok, 7 reword, 0 meaning defects; all rewords applied before this clearance. "
  + "The previous INDEPENDENT sampler cleared two draws that were serving a defect rooted in the "
  + "English, which per-language draws can only find where they happen to overlap.";
const NOTE = "Supersedes the 356 HOLD. That hold was correct: the English was 154 placeholder stubs and a "
  + "faithful rendering of a stub is a correct translation of nothing. Migration 363 rewrote all 154 and "
  + "AIMSF-CLAIM-AUDIT.json audited every checkable claim in them (81 claims, 67 OK, 0 FAIL, 14 unverifiable "
  + "because the standard is not on disk). source_gate_ran = true refers to that audit. The review also "
  + "surfaced 11 English concept names carrying lowercase initialisms, ALL of which both translations had "
  + "already silently repaired -- the translation pass acting as a detector for English defects.";

if (!APPLY) {
  console.log("");
  console.log("WOULD WRITE");
  console.log("  supersede  2 HOLD row(s) from 356 (kept, with a reason)");
  console.log("  insert     2 review row(s), verdict approved, source_gate_ran TRUE");
  console.log("  clear      308 translation row(s) -> is_provisional false, review_status " + CLEARED_STATUS);
  console.log("  serving    " + servingBefore + " -> " + (servingBefore + 308));
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(0);
}

for (const h of live356) {
  await rest("concept_translation_reviews?id=eq." + h.id, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      superseded_at: new Date().toISOString(),
      superseded_reason: "Resolved 2026-09-21. The English was rewritten (migration 363) and audited, and the "
        + "translations were deleted and regenerated from it. Kept rather than deleted: the reason AIMS-F was "
        + "held is the most useful thing anyone can know about these rows.",
    }),
  });
}
await rest("concept_translation_reviews", {
  method: "POST", headers: { Prefer: "return=minimal" },
  body: JSON.stringify(["es-419", "pt-BR"].map((lang) => ({
    certification: "AIMS-F", language: lang, verdict: "approved",
    seed: "2026-09-21-aims-f", sample_size: 20, population: 154,
    reviewed_on: "2026-09-21", reviewed_by: "claude-director",
    en_hash: EN, tr_hash: TR[lang], source_gate_ran: true,
    clearance_claim: CLAIM, note: NOTE,
    found_by: "paired draw, both languages of each slug",
  }))),
});
await rest("concept_translations?concept_id=in.(" + ids.join(",") + ")", {
  method: "PATCH", headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ is_provisional: false, review_status: CLEARED_STATUS }),
});

console.log("");
console.log("POST-CONDITIONS");
let pfail = 0;
const post = (n, ok, d) => { if (!ok) pfail++; console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };
const after = await rest("concept_translations?select=concept_id,language,is_provisional,en_hash&concept_id=in.(" + ids.join(",") + ")&limit=2000");
post("all 308 AIMS-F rows serve", after.filter((t) => t.is_provisional === false).length === 308,
  after.filter((t) => t.is_provisional === false).length + " of 308");
post("their en_hash still matches", after.every((t) => t.en_hash === want.get(t.concept_id)), "308 checked");
const servingAfter = await countOf("concept_translations?select=concept_id&is_provisional=eq.false");
post("corpus serving is " + (servingBefore + 308), servingAfter === servingBefore + 308, servingBefore + " + 308 = " + servingAfter);
const rev = await rest("concept_translation_reviews?select=language,verdict,seed,source_gate_ran,superseded_at&certification=eq.AIMS-F");
post("two approved review rows with source_gate_ran true",
  rev.filter((r) => r.verdict === "approved" && r.source_gate_ran === true && r.seed === "2026-09-21-aims-f").length === 2,
  rev.filter((r) => r.verdict === "approved").length + " approved");
post("the two HOLD rows survive and are superseded",
  rev.filter((r) => r.verdict === "held" && r.superseded_at !== null).length === 2,
  rev.filter((r) => r.verdict === "held").length + " held row(s) kept");
console.log("");
console.log("  passed " + (5 - pfail) + "   failed " + pfail);
process.exitCode = pfail ? 1 : 0;
