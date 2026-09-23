#!/usr/bin/env node
/**
 * fix-aimsia-0410-span.mjs -- the largest reproduction found in this programme.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * `aims-ia-04-10-justifying-both-directions`, pt-BR, block 8: sixty contiguous
 * words of ISO/IEC 42001 Annex A.1, in Portuguese, serving.
 *
 * The es-419 sibling on the same span tracks OUR replacement -- establecidos /
 * sus objetivos / que surgen del -- so one language was regenerated after the
 * English repair and the other was not. This fixes the one that was not.
 *
 * ============ THE SCORE CANNOT GATE THIS, AND SAYS SO ============
 *
 *   pt LIVE (ISO-tracking)   run  0w  cov 0.00   fires false
 *   pt PROPOSED              run  0w  cov 0.00   fires false
 *   en BEFORE (ISO)          run 60w  cov 1.00   fires TRUE
 *   en AFTER (ours, live)    run  5w  cov 0.09   fires false
 *
 * The leak index holds English editions only, so it gives the SAME verdict to
 * ISO's Portuguese and to ours. This repair rests on reading, not on a score,
 * and the score is recorded to show it could not have found it.
 *
 * What the English pair does establish is the size of what the Portuguese is a
 * translation OF: sixty words, coverage 1.00.
 *
 * ============ FIVE CHANGES, EACH TRACEABLE ============
 *
 *   detailed            -> set out                estabelecidos
 *   organizational objs -> its objectives         seus objetivos
 *   addressing ... related to -> handling ... arise from
 *                                                 lidar com ... que surgem do
 *   "listed" dropped, passive restructured        Nao e obrigatorio utilizar
 *   the organization    -> an organization        uma organizacao
 *
 * The last two mirror the es-419 sibling on this span, so the two languages
 * stay coherent rather than diverging on the same repair.
 *
 * ============ IT COSTS THE pt-BR REVIEW, DELIBERATELY ============
 *
 * Editing the body moves its tr_hash and invalidates the 2026-09-18 review, and
 * trg_lessons_clear_mcp_servable withholds the row until scan-iso-leaks runs.
 * The review is NOT re-stamped: vouching for text this script just wrote is the
 * dual-role defect. The row joins the re-read queue.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const SLUG = "aims-ia-04-10-justifying-both-directions";
const LANG = "pt-BR";

const FROM =
  "> Os controles detalhados na Tabela A.1 fornecem à organização uma referência para atender aos objetivos organizacionais e abordar os riscos relacionados ao projeto e à operação de sistemas de IA. **Nem todos os objetivos de controle e controles listados na Tabela A.1 precisam ser utilizados, e a organização pode projetar e implementar seus próprios controles (ver 6.1.3).**";

const TO =
  "> Os controles estabelecidos na Tabela A.1 fornecem à organização uma referência para atender a seus objetivos e lidar com os riscos que surgem do projeto e da operação de sistemas de IA. **Não é obrigatório utilizar todos os objetivos de controle e controles da Tabela A.1, e uma organização pode projetar e implementar seus próprios controles (ver 6.1.3).**";

/* The three tokens that make the live text ISO's rather than ours. Asserted
 * gone afterwards, individually, because "the new string is present" would pass
 * on a body that also still contained the old one somewhere else. */
const ISO_MARKERS = ["controles detalhados na Tabela A.1", "objetivos organizacionais", "riscos relacionados ao projeto"];

const rows = await (await fetch(
  BASE + "/lessons?select=id,slug,language,content_md&slug=eq." + SLUG + "&language=eq." + encodeURIComponent(LANG),
  { headers: H })).json();
if (rows.length !== 1) { console.error("expected 1 row, got " + rows.length); process.exit(1); }
const row = rows[0];

const hits = row.content_md.split(FROM).length - 1;
const already = row.content_md.split(TO).length - 1;
console.log("");
console.log("  " + SLUG + "  " + LANG);
console.log("  occurrences of the ISO-tracking span : " + hits);
console.log("  occurrences of the replacement       : " + already);
for (const m of ISO_MARKERS) console.log("  marker present: " + (row.content_md.includes(m) ? "YES  " : "no   ") + m);

if (hits === 0) {
  console.log("");
  console.log(already > 0 ? "Already replaced. Nothing to do." : "Span not found verbatim -- the body moved. NOT guessing; stopping.");
  process.exit(0);
}
if (hits !== 1) { console.error("expected exactly 1 occurrence; refusing to sweep " + hits); process.exit(1); }

const next = row.content_md.replace(FROM, TO);
if (next === row.content_md) { console.error("replacement produced no change; refusing"); process.exit(1); }

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const back = await fetch(BASE + "/lessons?id=eq." + row.id, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ content_md: next }),
});
if (!back.ok) { console.error("PATCH failed: HTTP " + back.status + " " + (await back.text()).slice(0, 200)); process.exit(1); }
const after = (await back.json())[0];

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
ok("the replacement is present", after.content_md.includes(TO));
ok("the ISO-tracking span is gone", !after.content_md.includes(FROM));
for (const m of ISO_MARKERS) ok("marker gone: " + m, !after.content_md.includes(m));
ok("nothing else changed", after.content_md === next, "byte-compared against the intended body");
console.log("");
console.log("  The pt-BR review of 2026-09-18 is now stale and NOT re-stamped.");
console.log("  Run scan-iso-leaks --cert AIMS-IA --apply to restore mcp_servable;");
console.log("  the row stays withheld until a human re-reads it.");
process.exit(fail ? 1 : 0);
