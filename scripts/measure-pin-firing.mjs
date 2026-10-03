#!/usr/bin/env node
/**
 * Firing count for every glossary pin over the LIVE catalogue, per language with its denominator.
 * READ-ONLY. `--cert <CODE>` to narrow, otherwise every certification. Unknown flags exit 2.
 * Required in the same commit as a new rule: too many fires is a design error, not a backlog.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { checkPins, PIN_RULES } from "./lib/pin-compliance.mjs";

let CERT = null, SHOW = 6;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cert") { CERT = argv[++i]; continue; }
  const m = argv[i].match(/^--(cert|show)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else SHOW = Number(m[2]); continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --cert <CODE>, --show=N."); process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const want = CERT ? certs.filter((c) => c.code === CERT) : certs;
if (!want.length) { console.error("no certification " + CERT); process.exit(2); }

const LANGS = ["es-419", "pt-BR"];
const fired = new Map();   /* rule -> lang -> [{cert, id, field, hit}] */
const denom = { "es-419": 0, "pt-BR": 0 };
for (const c of want) {
  const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,question_text," +
    "options,explanation&certification_id=eq." + c.id + "&retired_at=is.null&order=id");
  const byGroup = new Map();
  for (const r of rows) {
    if (!r.question_group_id) continue;
    if (!byGroup.has(r.question_group_id)) byGroup.set(r.question_group_id, {});
    byGroup.get(r.question_group_id)[r.language] = r;
  }
  for (const g of byGroup.values()) {
    const en = g.en;
    for (const lang of LANGS) {
      const tr = g[lang];
      if (!tr) continue;
      denom[lang]++;
      const fields = [["question_text", tr.question_text, en && en.question_text],
        ["explanation", tr.explanation, en && en.explanation],
        ...(tr.options || []).map((o) => ["option " + o.id, o.text,
          en && ((en.options || []).find((x) => x.id === o.id) || {}).text])];
      for (const [what, text, enText] of fields) {
        for (const h of checkPins(text, lang, enText) || []) {
          if (!fired.has(h.id)) fired.set(h.id, { "es-419": [], "pt-BR": [] });
          fired.get(h.id)[lang].push({ cert: c.code, id: String(tr.id).slice(0, 8), what, hit: h.hit });
        }
      }
    }
  }
}
if (!denom["es-419"] && !denom["pt-BR"]) { console.error("EXTRACTION EMPTY: no translated rows examined. Not a pass."); process.exit(2); }

console.log("GLOSSARY PIN FIRING COUNT" + (CERT ? "   " + CERT : "   every certification"));
console.log("");
console.log("  DENOMINATOR   es-419 " + denom["es-419"] + " translated row(s)   pt-BR " + denom["pt-BR"]);
console.log("");
console.log("  rule                        es-419        pt-BR");
const all = PIN_RULES.map((r) => r.id).concat(["inserted-cadence"]);
for (const id of all) {
  const f = fired.get(id) || { "es-419": [], "pt-BR": [] };
  const pct = (n, d) => d ? (n / d * 100).toFixed(1) + "%" : "-";
  console.log("  " + id.padEnd(26) + String(f["es-419"].length).padStart(5) + " " +
    pct(f["es-419"].length, denom["es-419"]).padStart(7) + "   " +
    String(f["pt-BR"].length).padStart(5) + " " + pct(f["pt-BR"].length, denom["pt-BR"]).padStart(7));
}
console.log("");
console.log("  MEMBERS, read -- a count nobody has read is UNREAD:");
let total = 0;
for (const [id, f] of fired) {
  for (const lang of LANGS) {
    for (const x of f[lang].slice(0, SHOW)) {
      console.log("    " + id.padEnd(24) + lang.padEnd(7) + x.cert.padEnd(9) + x.id + "  " +
        x.what.padEnd(14) + JSON.stringify(x.hit));
    }
    if (f[lang].length > SHOW) console.log("    " + id.padEnd(24) + lang.padEnd(7) + "... and " + (f[lang].length - SHOW) + " more");
    total += f[lang].length;
  }
}
console.log("");
console.log("  total findings " + total);
