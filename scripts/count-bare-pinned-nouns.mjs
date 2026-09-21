/* Corpus-wide count, READ-ONLY. Bare pinned English noun after a
 * target-language article, in a concept NAME, where the full pinned form is
 * absent from that name.
 *
 * Tails derived from SCRUM_NOUNS. Two exclusions, both found by reading the
 * first run's output rather than predicted:
 *   - the article may precede the FULL term ("el Scrum Master") -- matching the
 *     tail alone reported those as bare uses
 *   - bare "Scrum" is the framework's name, not a truncation of "Daily Scrum"
 */
import { readFileSync, existsSync } from "node:fs";
import { SCRUM_NOUNS } from "file:///C:/Users/Juan/Documents/certidemy/supabase/scripts/lib/item-translation.mjs";

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(REST + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json();
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) throw new Error("SHORT READ: " + rows.length + " of " + total);
  return rows;
}

const byTail = new Map();
for (const n of SCRUM_NOUNS) {
  const parts = n.split(" ");
  if (parts.length < 2) continue;
  const tail = parts[parts.length - 1];
  if (!byTail.has(tail)) byTail.set(tail, []);
  byTail.get(tail).push(n);
}
byTail.set("DoD", ["Definition of Done"]);
const TAILS = [...byTail.keys()].filter((t) => t !== "Scrum");

const ART = {
  "es-419": ["el", "la", "los", "las", "un", "una", "del", "al"],
  "pt-BR": ["o", "a", "os", "as", "um", "uma", "do", "da", "dos", "das", "no", "na", "nos", "nas", "ao", "aos", "\u00e0", "\u00e0s"],
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function hits(name, lang) {
  if (!name) return [];
  const found = [];
  for (const tail of TAILS) {
    if (byTail.get(tail).some((f) => name.toLowerCase().includes(f.toLowerCase()))) continue;
    const completions = SCRUM_NOUNS
      .filter((n) => n.toLowerCase().startsWith(tail.toLowerCase() + " "))
      .map((n) => esc(n.split(" ").slice(1).join(" ")));
    const notCompleted = completions.length ? "(?!\\s+(?:" + completions.join("|") + ")\\b)" : "";
    for (const art of ART[lang]) {
      const re = new RegExp("(?<![\\p{L}])" + esc(art) + "\\s+" + esc(tail) + "(?![\\p{L}])" + notCompleted, "iu");
      if (re.test(name)) { found.push(art + " " + tail); break; }
    }
  }
  return found;
}

const ctl = [
  ["Replanificar hacia el Goal", "es-419", true],
  ["Procedencia en el Done", "es-419", true],
  ["Proced\u00eancia no Done", "pt-BR", true],
  ["Replanificar hacia el Sprint Goal", "es-419", false],
  ["Trabajar con el Scrum Master", "es-419", false],
  ["Valores do Scrum", "pt-BR", false],
  ["A Definition of Done se aplica ao resultado da IA", "pt-BR", false],
];
let bad = 0;
for (const [n, l, want] of ctl) {
  const got = hits(n, l).length > 0;
  if (got !== want) { bad++; console.error("  CONTROL FAILED: " + JSON.stringify(n) + " expected " + want + " got " + got); }
}
if (bad) { console.error("matcher broken; refusing to report"); process.exit(2); }

const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const concepts = await all("concepts?select=id,slug,name,certification_id");
const cById = new Map(concepts.map((c) => [c.id, c]));
const trans = await all("concept_translations?select=concept_id,language,name,is_provisional");

const rows = [];
for (const t of trans) {
  const h = hits(t.name, t.language);
  if (!h.length) continue;
  const c = cById.get(t.concept_id);
  rows.push({ cert: certs[c.certification_id], slug: c.slug, lang: t.language, en: c.name, tr: t.name, hit: h.join(", "), serving: !t.is_provisional });
}

console.log("");
console.log("  tails scanned: " + TAILS.join(", ") + "   (Scrum excluded: framework name)");
console.log("  " + trans.length + " translated concept names scanned");
console.log("");
console.log("  MATCHES: " + rows.length + "   serving " + rows.filter((r) => r.serving).length +
  "   withheld " + rows.filter((r) => !r.serving).length);
const byLang = rows.reduce((m, r) => { (m[r.lang] ||= []).push(r); return m; }, {});
for (const [l, rs] of Object.entries(byLang).sort()) console.log("    " + l + ": " + rs.length + " (" + rs.filter((r) => r.serving).length + " serving)");
const byCert = rows.reduce((m, r) => { (m[r.cert] ||= 0); m[r.cert]++; return m; }, {});
console.log("  by certification: " + Object.entries(byCert).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + "=" + n).join("  "));
const byTailCount = rows.reduce((m, r) => { const t = r.hit.split(" ").pop(); (m[t] ||= 0); m[t]++; return m; }, {});
console.log("  by term: " + Object.entries(byTailCount).sort((a, b) => b[1] - a[1]).map(([t, n]) => t + "=" + n).join("  "));
console.log("");
const distinct = [...new Set(rows.map((r) => r.cert + "/" + r.slug))];
console.log("  " + distinct.length + " distinct concept(s), " + rows.length + " rows (both languages where both hit)");
console.log("");
for (const r of rows.sort((a, b) => (a.cert + a.slug + a.lang).localeCompare(b.cert + b.slug + b.lang))) {
  console.log("    " + (r.cert + "/" + r.lang).padEnd(18) + "[" + r.hit + "]".padEnd(20) + "\"" + r.tr + "\"");
  console.log("    " + " ".repeat(18) + "en: \"" + r.en + "\"");
}
