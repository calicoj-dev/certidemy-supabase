#!/usr/bin/env node
/**
 * sweep-modal-inflation.mjs - every paragraph where English says SHOULD and the
 * translation says MUST.
 *
 * READ-ONLY. Writes only --json. Unknown flags exit 2.
 *
 * ============ WHY A SWEEP AND NOT A GUARD RUN ============
 *
 * The re-translation pass only touched paragraphs whose English had been
 * repaired -- about 5% of each lesson. The other 95% was translated long ago
 * and has never been checked for this at all. A defect found in the 5% is a
 * defect the 95% has had the whole time.
 *
 * ============ WHAT IT LOOKS FOR ============
 *
 * `noModalInflation`: the English carries a WEAK modal and no strong one, the
 * translation carries a strong one and no weak one. That is not the idiomatic
 * case -- an English infinitive legitimately becoming a Spanish modal has NO
 * English modal at all, and is excluded by construction.
 *
 * It is substantive rather than stylistic on these certifications. AIMS-F
 * teaches the shall/should distinction outright; explaining the difference in
 * English and collapsing it in translation is what an ISO shop reads for a
 * living. ABNT renders `should` as "convem que"; Spanish practice uses
 * "deberia" or "conviene".
 *
 * ============ AND IT COUNTS THE CONVENTION ITSELF ============
 *
 * A per-corpus census of the weak forms, because the absence of a word is the
 * strongest evidence that a convention was never applied: if `conviene` and
 * `convem` appear zero times across thousands of paragraphs, no one ever
 * rendered a `should` as one.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid } from "./lib/guide-runs.mjs";
import { noModalInflation, modalProfile, checkFaithful } from "./lib/obligation-guard.mjs";

const KNOWN = new Set(["--json", "--cert", "--lang", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = arg("json", "");
const ONLY_CERT = arg("cert", "");
const ONLY_LANG = arg("lang", "");
const VERBOSE = process.argv.includes("--verbose");

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
async function g(p) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}

const bad = checkFaithful();
if (bad.length) {
  console.error("THE OBLIGATION GUARD FAILED ITS CONTROL; sweeping nothing.");
  for (const b of bad) console.error("  X " + b);
  process.exit(1);
}
console.log("");
console.log("control: obligation guard clean (" + 0 + " failures)");

const CERTS = ONLY_CERT ? [ONLY_CERT] : ["ISMS-F", "AIMS-F", "ISMS-IA", "AIMS-IA"];
const LANGS = ONLY_LANG ? [ONLY_LANG] : ["es-419", "pt-BR"];
const certs = await g("certifications?select=id,code");

/* The conventional weak forms, counted per corpus. Their ABSENCE is the finding. */
const CONVENTION = {
  "es-419": { "debería/deberían": /\bdeber[íi]an?\b/gi, "conviene": /\bconviene\b/gi,
              "se recomienda": /\bse recomienda\b/gi, "debe/deben": /\bdebe[n]?\b/gi },
  "pt-BR":  { "deveria/deveriam": /\bdeveriam?\b/gi, "convém": /\bconv[ée]m\b/gi,
              "recomenda-se": /\brecomenda-se\b/gi, "deve/devem": /\bdeve[m]?\b/gi },
};

const findings = [];
const census = {};
for (const code of CERTS) {
  const id = certs.find((c) => c.code === code)?.id;
  if (!id) continue;
  const mods = await g("modules?select=id&certification_id=eq." + id);
  const rows = await g("lessons?select=id,slug,language,lesson_group_id,content_md&module_id=in.(" +
    mods.map((m) => m.id).join(",") + ")");
  const byGroup = {};
  for (const r of rows) (byGroup[r.lesson_group_id] ||= {})[r.language] = r;

  for (const [gid, langs] of Object.entries(byGroup)) {
    const en = langs["en"];
    if (!en) continue;
    const enBlocks = blocks(en.content_md);
    for (const lang of LANGS) {
      const tr = langs[lang];
      if (!tr) continue;

      /* convention census, whole document */
      const c = (census[code + "/" + lang] ||= {});
      for (const [name, re] of Object.entries(CONVENTION[lang])) {
        c[name] = (c[name] ?? 0) + ((tr.content_md.match(re) || []).length);
      }

      const trBlocks = blocks(tr.content_md);
      for (let bi = 0; bi < enBlocks.length; bi++) {
        const eSol = solid(enBlocks[bi]);
        const tSol = trBlocks[bi] ? solid(trBlocks[bi]) : [];
        for (let li = 0; li < eSol.length; li++) {
          const eLine = eSol[li].text, tLine = tSol[li]?.text;
          if (!tLine) continue;
          const v = noModalInflation(eLine, tLine, lang);
          if (v.ok) continue;
          findings.push({
            cert: code, slug: tr.slug, language: lang, lesson_id: tr.id,
            block: bi, line: li,
            english: eLine.trim(), translation: tLine.trim(),
            english_profile: v.english, target_profile: v.target,
          });
        }
      }
    }
  }
}

console.log("");
console.log("CONVENTION CENSUS -- the weak forms, counted across whole lesson bodies");
for (const [k, v] of Object.entries(census).sort()) {
  console.log("  " + k.padEnd(18) + Object.entries(v).map(([n, c]) => n + " " + c).join("   "));
}

console.log("");
console.log("INFLATED PARAGRAPHS: " + findings.length);
const byCert = {};
for (const f of findings) byCert[f.cert + " / " + f.language] = (byCert[f.cert + " / " + f.language] ?? 0) + 1;
for (const [k, v] of Object.entries(byCert).sort()) console.log("  " + k.padEnd(20) + v);

if (VERBOSE) {
  console.log("");
  for (const f of findings.slice(0, 40)) {
    console.log("  " + f.cert + " " + f.slug + " / " + f.language + "  b" + f.block + "l" + f.line);
    console.log("    EN: " + f.english.slice(0, 150));
    console.log("    " + f.language + ": " + f.translation.slice(0, 150));
  }
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ count: findings.length, findings }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
