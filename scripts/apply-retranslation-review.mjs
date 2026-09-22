#!/usr/bin/env node
/**
 * apply-retranslation-review.mjs - the four rewords, the modal pin, and the
 * register pins from the 2026-09-22 paired sample.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHY THIS SCRIPT MAY STAMP tr_hash ============
 *
 * It AUTHORS translated text. Under the hash-writer rule the stamp is
 * legitimate exactly where the caller holds the text the hash records -- the
 * generator case, and the authored half of apply-reread-clearance. Every row
 * here is one this run rewrote, so every row here is stamped from what this
 * run wrote.
 *
 * en_hash is NOT touched. None of these edits changes any English, so the
 * English side of the gate stays exactly as the generator left it.
 *
 * ============ THE MODAL PIN ============
 *
 * LOCALISE the modal, with the English in parentheses on FIRST MENTION in a
 * row that is about the modal. Portuguese: "convem que (should)" and
 * "deve (shall)". A reader working from an ABNT edition meets convem que, not
 * should. Spanish is already correct and is not touched.
 *
 * THE MENTION CASE IS DELIBERATELY EXCLUDED. aia-19011-is-guidance-only counts
 * OCCURRENCES OF THE ENGLISH WORD in an English document -- "264 ocorrencias
 * de should (convem que)" -- and naming the English word is right there. The
 * distinction is use versus mention, and a lexical sweep that could not see it
 * would have "corrected" a correct row.
 *
 * ============ THE REGISTER PINS, MEASURED BEFORE PINNING ============
 *
 *   pt quotes      23 straight : 4 curly    -> pin STRAIGHT, convert the 4
 *   es evaluate    130 evaluar : 2 valorar  -> pin EVALUAR
 *   logs           es 0 "logs" and uses registros; pt 9 "logs" and uses none
 *                  of "registros de prompt". Each language is ALREADY
 *                  internally consistent, so the divergence is a loan-register
 *                  difference and not an accident. DECIDED: leave both.
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

const LQ = String.fromCharCode(8220), RQ = String.fromCharCode(8221);

/* Each edit names its field, an exact anchor, and the replacement. An anchor
 * that is missing or appears more than once is a REFUSAL, never a skip: a
 * missing anchor silently "already applied" is how a row nobody fixed gets
 * reported as fixed. */
const EDITS = [
  /* ---------- A. the four rewords ---------- */
  { group: "reword", slug: "aia-confidentiality-in-reporting", lang: "es-419", field: "description",
    from: "lo que tira en contra de la exhaustividad", to: "lo que se contrapone a la exhaustividad" },
  { group: "reword", slug: "aia-confidentiality-in-reporting", lang: "pt-BR", field: "description",
    from: "o que puxa contra a completude", to: "o que se contrapõe à completude" },
  { group: "reword", slug: "ia-degree-of-verification", lang: "es-419", field: "description",
    from: "fija un mínimo, no una compuerta de paso", to: "fija un mínimo, no un filtro de sí o no" },
  { group: "reword", slug: "ia-degree-of-verification", lang: "pt-BR", field: "description",
    from: "estabelece um piso, não um portão", to: "estabelece um piso, não um filtro de sim ou não" },
  { group: "reword", slug: "ia-control-design-versus-operating-effectiveness", lang: "pt-BR", field: "description",
    from: "não é evidência de que ele funcionou", to: "não é evidência de que ele operou" },
  { group: "reword", slug: "aia-evidence-requirement-link", lang: "pt-BR", field: "description",
    from: "A ligação é o que um achado é.", to: "A ligação é o que constitui um achado." },

  /* ---------- B. the modal pin ---------- */
  { group: "modal", slug: "aia-finding-against-a-note", lang: "pt-BR", field: "description",
    from: 'no sentido que um "should" carrega', to: "no sentido que um convém que (should) carrega" },
  { group: "modal", slug: "aia-finding-against-a-note", lang: "pt-BR", field: "description",
    from: 'contém um "shall"', to: "contém um deve (shall)" },
  { group: "modal", slug: "aia-finding-against-should-text", lang: "pt-BR", field: "name",
    from: 'Um "should" não pode sustentar', to: "Um convém que (should) não pode sustentar" },
  { group: "modal", slug: "aia-finding-against-should-text", lang: "pt-BR", field: "description",
    from: 'Um "should" expressa orientação', to: "Um convém que expressa orientação" },
  { group: "modal", slug: "aia-finding-against-should-text", lang: "pt-BR", field: "description",
    from: 'texto na forma "should" não pode', to: "texto na forma convém que não pode" },
  { group: "modal", slug: "aia-finding-against-should-text", lang: "pt-BR", field: "description",
    from: 'o critério na forma "should"', to: "o critério na forma convém que" },
  { group: "modal", slug: "aia-nonconformity-needs-a-shall", lang: "pt-BR", field: "description",
    from: 'são enunciadas em "shall" do início ao fim', to: "são enunciadas em deve (shall) do início ao fim" },

  /* ---------- C. Portuguese quoting: curly -> straight ---------- */
  { group: "quotes", slug: "ia-planned-intervals-carries-no-fixed-value", lang: "pt-BR", field: "name",
    from: LQ + "Intervalos planejados" + RQ, to: '"Intervalos planejados"' },
  { group: "quotes", slug: "aia-finding-against-annex-b", lang: "pt-BR", field: "description",
    from: "redigido com " + LQ + "convém que" + RQ, to: 'redigido com "convém que"' },
  { group: "quotes", slug: "aia-collecting-verifying-information", lang: "pt-BR", field: "description",
    from: "usa " + LQ + "convém que" + RQ + " em vez de " + LQ + "deve" + RQ,
    to: 'usa "convém que" em vez de "deve"' },
  { group: "quotes", slug: "aia-clause-8-1-operational-control", lang: "pt-BR", field: "description",
    from: "impõe um " + LQ + "deve" + RQ, to: 'impõe um "deve"' },

  /* ---------- D. Spanish: evaluar, 130 to 2 ---------- */
  { group: "evaluar", slug: "aia-clause-6-1-2-risk-assessment", lang: "es-419", field: "description",
    from: "identificar, analizar y valorar los riesgos", to: "identificar, analizar y evaluar los riesgos" },
];

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const concepts = await allRows("concepts?select=id,slug,certification_id,retired_at");
const conBy = new Map(concepts.filter((c) => !c.retired_at).map((c) => [c.slug, c]));
const trs = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");

/* Accumulate per row: several edits can touch one field, and applying them
 * one PATCH at a time is the read-modify-write race this repo already paid
 * for -- the second write computed from the original body discards the
 * first. */
const byRow = new Map();
for (const e of EDITS) {
  const con = conBy.get(e.slug);
  if (!con) { console.error("REFUSING: no live concept " + e.slug); process.exit(2); }
  const row = trs.find((t) => t.concept_id === con.id && t.language === e.lang);
  if (!row) { console.error("REFUSING: no " + e.lang + " row for " + e.slug); process.exit(2); }
  const k = row.id;
  if (!byRow.has(k)) byRow.set(k, { row, cert: codeOf.get(con.certification_id), slug: e.slug,
    lang: e.lang, name: row.name, description: row.description, edits: [] });
  const st = byRow.get(k);
  const cur = st[e.field];
  const n = String(cur).split(e.from).length - 1;
  if (n === 0) {
    if (String(cur).includes(e.to)) { st.edits.push({ ...e, already: true }); continue; }
    console.error("REFUSING: anchor not found and replacement absent -- " + e.slug + " " + e.lang + " " + e.field);
    console.error("  anchor: " + JSON.stringify(e.from));
    process.exit(2);
  }
  if (n > 1) {
    console.error("REFUSING: anchor appears " + n + " times in " + e.slug + " " + e.lang + " " + e.field);
    process.exit(2);
  }
  st[e.field] = String(cur).split(e.from).join(e.to);
  st.edits.push(e);
}

const plan = [...byRow.values()].filter((s) => s.name !== s.row.name || s.description !== s.row.description);
console.log("");
console.log("EDITS " + EDITS.length + " across " + byRow.size + " rendering(s); " + plan.length + " to write");
for (const g of ["reword", "modal", "quotes", "evaluar"]) {
  const n = EDITS.filter((e) => e.group === g).length;
  console.log("  " + g.padEnd(9) + n + " edit(s)");
}
console.log("");
for (const s of plan) {
  console.log("  " + s.cert.padEnd(9) + s.lang.padEnd(8) + s.slug + (s.row.is_provisional ? "" : "   [WAS SERVING]"));
  for (const e of s.edits) console.log("      " + e.group + "  " + JSON.stringify(e.from.slice(0, 54)) + " -> " + JSON.stringify(e.to.slice(0, 54)));
}

/* Everything this pass must NOT touch. */
const ids = new Set(plan.map((s) => s.row.id));
const untouched = trs.filter((t) => !ids.has(t.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((t) => t.id + "|" + t.name + "|" + t.description + "|" + t.en_hash);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
console.log("");
console.log("  untouched-rendering checksum " + untouchedHash + " over " + untouched.length + " row(s)");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
console.log("APPLYING...");
for (const s of plan) {
  /* AUTHORED, SO STAMPED. This run wrote the text, so it may record it. */
  const tr = await rpc("translation_hash", { p_a: s.name, p_b: s.description });
  const back = await rest("concept_translations?id=eq." + s.row.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: s.name, description: s.description, tr_hash: tr }),
  });
  if (!back?.[0] || back[0].description !== s.description || back[0].name !== s.name) {
    throw new Error("read-back mismatch on " + s.slug + " " + s.lang);
  }
}
console.log("  wrote " + plan.length + " rendering(s)");

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
const after = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");
const aBy = new Map(after.map((t) => [t.id, t]));

ok("every rendering carries its new text",
   plan.every((s) => aBy.get(s.row.id)?.description === s.description && aBy.get(s.row.id)?.name === s.name));
ok("tr_hash matches the text on every edited rendering",
   (await Promise.all(plan.map(async (s) => (await rpc("translation_hash", { p_a: s.name, p_b: s.description })) === aBy.get(s.row.id)?.tr_hash))).every(Boolean));
ok("en_hash unchanged on every edited rendering",
   plan.every((s) => aBy.get(s.row.id)?.en_hash === s.row.en_hash), "no English moved, so none should");
const ua = after.filter((t) => !ids.has(t.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((t) => t.id + "|" + t.name + "|" + t.description + "|" + t.en_hash);
ok("every other rendering is byte-identical",
   createHash("sha256").update(ua.join("\n")).digest("hex").slice(0, 16) === untouchedHash);
/* THE PINS HELD, asserted corpus-wide rather than inferred from the writes. */
const bad = after.filter((t) => t.language === "pt-BR" &&
  (String(t.name || "") + String(t.description || "")).match(/"(should|shall)"/));
ok("no pt-BR rendering still quotes a raw English modal", bad.length === 0, bad.map((b) => b.id).join(","));
const curly = after.filter((t) => t.language === "pt-BR" &&
  (String(t.name || "") + String(t.description || "")).includes(LQ));
ok("no pt-BR rendering still uses curly quotes", curly.length === 0, curly.length + " left");

writeFileSync(join(ROOT, "RETRANSLATION-REVIEW-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", edits: EDITS.length, renderings: plan.length,
  rows: plan.map((s) => ({ cert: s.cert, lang: s.lang, slug: s.slug, was_serving: !s.row.is_provisional,
    groups: [...new Set(s.edits.map((e) => e.group))] })),
  untouchedHash,
}, null, 2), "utf8");
console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Applied " + plan.length + " rendering(s).");
