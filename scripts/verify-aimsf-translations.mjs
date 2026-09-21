#!/usr/bin/env node
/**
 * verify-aimsf-translations.mjs - the post-conditions for the regenerated
 * AIMS-F concept translations.
 *
 * READ-ONLY. Fixes nothing. Unknown flags exit 2.
 *
 * ============ THREE PROPERTIES, AND ONE OF THEM IS NEW ============
 *
 * 1. NO STUB WAS REINTRODUCED IN TRANSLATION. The English stub was 154 rows
 *    sharing one byte-exact tail. A translator working row by row cannot see
 *    that it is producing the same tail 154 times, so the check is on the
 *    CORPUS, not the row: no description suffix may be shared by more than 20
 *    rows in one language. The threshold is data, not taste -- measured across
 *    the platform, no certification has a shared suffix group above 2.
 *
 * 2. EVERY ADDRESS SURVIVES BYTE-IDENTICAL. These 154 descriptions cite
 *    clauses, annexes and control ids constantly, and a translation that
 *    mangles "clause 6.1.3" or "Annex A.6.2" is a defect NO REGISTER CHECK
 *    WILL CATCH -- the language guard sees fluent Spanish, the suffix check
 *    sees variety, and the number is quietly wrong.
 *
 *    Only the NUMBER is asserted, never the word around it: "clause" becomes
 *    capitulo or apartado or Secao by design, and that is the house register.
 *    What may not move is 6.1.3.
 *
 * 3. THE GATE CAN ACTUALLY OPEN. Migration 359 keys en_hash to
 *    concept_row_en_hash, and the writer predated the gate and set NULL. A row
 *    with a null or stale hash falls back to English forever, present and
 *    looking translated. Asserted here because it is invisible from the row.
 *
 * Nothing serves until the paired sample is read: every row must be
 * provisional, and that is asserted in both directions.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}
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
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function rest(p) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}

const CR = String.fromCharCode(13);
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").split(CR).join("") + "|" + String(d ?? "").split(CR).join(""))
  .digest("hex").slice(0, 16);

/* ============ ADDRESS EXTRACTION ============
 * Control ids first (A.6.2), then dotted or hyphenated numbers (6.1.3,
 * 17021-1), then bare integers (42001, 38, 10). Annex letters are captured
 * from the English phrase because the WORD changes and the LETTER must not. */
function addresses(text) {
  const s = String(text || "");
  const out = new Set();
  for (const m of s.matchAll(/\b[A-D]\.\d+(?:\.\d+)*\b/g)) out.add(m[0]);
  for (const m of s.matchAll(/\b\d+(?:[.\-]\d+)+\b/g)) out.add(m[0]);
  for (const m of s.matchAll(/\b\d{1,5}\b/g)) out.add(m[0]);
  for (const m of s.matchAll(/\bAnnex\s+([A-D](?:\.\d+)*)/gi)) out.add("Annex:" + m[1].toUpperCase());
  return [...out];
}
/** Is this address present in the translated text? */
function survives(addr, text) {
  if (addr.startsWith("Annex:")) {
    const id = addr.slice(6);
    /* The word changes (Anexo / Anexo), the letter must not. Accept the id
     * anywhere, since register words differ per language. */
    return new RegExp("\\b" + id.replace(".", "\\.") + "\\b").test(String(text || ""));
  }
  return String(text || "").includes(addr);
}

const cert = (await rest("certifications?select=id&code=eq.AIMS-F"))[0];
const concepts = (await rest("concepts?select=id,slug,name,description,retired_at&certification_id=eq." + cert.id + "&limit=1000"))
  .filter((c) => c.retired_at === null);
const ids = concepts.map((c) => c.id);
const tr = await rest("concept_translations?select=concept_id,language,name,description,en_hash,is_provisional,review_status"
  + "&concept_id=in.(" + ids.join(",") + ")&limit=2000");
const byId = new Map(concepts.map((c) => [c.id, c]));

const checks = [];
const chk = (n, ok, d) => { checks.push({ n, ok }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

console.log("");
console.log("AIMS-F CONCEPT TRANSLATIONS");
console.log("  " + concepts.length + " live concept(s), " + tr.length + " translation row(s)");
console.log("");

chk("every concept has both languages", tr.length === concepts.length * 2,
  tr.length + " of " + concepts.length * 2 + " expected");

for (const lang of ["es-419", "pt-BR"]) {
  const rows = tr.filter((r) => r.language === lang);
  chk(lang + ": one row per concept", rows.length === concepts.length, rows.length + " row(s)");
  const empty = rows.filter((r) => !r.description || !r.name);
  chk(lang + ": no empty name or description", empty.length === 0,
    empty.length ? empty.length + " empty" : "all populated");

  /* 1. STUB DETECTOR, on the corpus rather than the row. */
  const groups = new Map();
  for (const r of rows) {
    const d = String(r.description || "").trim();
    if (d.length < 45) continue;
    const suf = d.slice(-45);
    groups.set(suf, (groups.get(suf) || 0) + 1);
  }
  const worst = [...groups.entries()].sort((a, b) => b[1] - a[1])[0] || ["", 0];
  chk(lang + ": no suffix shared by more than 20 rows", worst[1] <= 20,
    "largest shared 45-character suffix group: " + worst[1] + " row(s)"
      + (worst[1] > 2 ? "  -> \"" + worst[0].slice(-50) + "\"" : ""));

  /* 3. THE GATE. */
  const stale = rows.filter((r) => {
    const c = byId.get(r.concept_id);
    return !c || !r.en_hash || r.en_hash !== enHash(c.name, c.description);
  });
  chk(lang + ": en_hash matches the live English", stale.length === 0,
    stale.length ? stale.length + " row(s) would fall back to English forever" : rows.length + " row(s) can open the gate");

  const served = rows.filter((r) => r.is_provisional === false);
  chk(lang + ": nothing serves yet", served.length === 0,
    served.length ? served.length + " NON-provisional" : "all " + rows.length + " provisional");
}

/* 2. ADDRESS SURVIVAL. */
let totalAddr = 0, lost = 0;
const losses = [];
for (const r of tr) {
  const c = byId.get(r.concept_id);
  if (!c) continue;
  for (const a of addresses(c.description)) {
    totalAddr++;
    if (!survives(a, r.description)) {
      lost++;
      losses.push({ slug: c.slug, language: r.language, address: a,
        en: c.description, tr: r.description });
    }
  }
}
console.log("");
chk("every clause address, annex reference and control id survives translation",
  lost === 0, totalAddr + " address occurrence(s) checked across " + tr.length + " row(s), " + lost + " lost");
for (const l of losses.slice(0, 12)) {
  console.log("      LOST  " + l.language + "  " + l.slug + "  address " + l.address.replace("Annex:", "Annex "));
  console.log("        en: " + String(l.en).slice(0, 130));
  console.log("        tr: " + String(l.tr).slice(0, 130));
}
if (losses.length > 12) console.log("      ... " + (losses.length - 12) + " more");

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log("  passed " + (checks.length - failed.length) + "   failed " + failed.length);
writeFileSync(join(HERE, "..", "AIMSF-TRANSLATION-VERIFY.json"), JSON.stringify({
  measured: "2026-09-21", concepts: concepts.length, rows: tr.length,
  address_occurrences_checked: totalAddr, addresses_lost: lost,
  checks: checks.map((c) => ({ check: c.n, ok: c.ok })), losses,
}, null, 2), "utf8");
console.log("  wrote AIMSF-TRANSLATION-VERIFY.json");
process.exitCode = failed.length ? 1 : 0;
