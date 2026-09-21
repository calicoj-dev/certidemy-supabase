#!/usr/bin/env node
/**
 * retranslate-audit-sentence.mjs - replace the es-419 and pt-BR renderings of
 * the audit sentence rewritten in English, in the same five lesson spans.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY THE TRANSLATIONS NEED THEIR OWN PASS ============
 *
 * The leak index is MONOLINGUAL. It holds English editions only, so a Spanish
 * or Portuguese rendering of an ISO sentence scores zero and always has --
 * `scan-iso-leaks` takes a translated lesson's verdict from its English
 * sibling, which means a translated reproduction is withheld only for as long
 * as the English one is. Repair the English and the translated copy is served
 * again, still carrying the reproduction, with every instrument reporting
 * clean.
 *
 * That is the largest of the three coverage gaps in iso-corpus-manifest.json
 * and nothing here closes it. This script fixes six known spans by hand.
 *
 * ============ WHAT THE ENGLISH REWRITE ESTABLISHED, AND A CORRECTION ========
 *
 * The reproduced 17 words are ISO/IEC 27000:2018's wording. Two lessons cited
 * ISO 19011:2026 for them, and the first report of that called 19011 a false
 * attribution because it contains neither half of the string.
 *
 * THAT WAS TOO STRONG. ISO 19011:2026 clause 3.1, Note 1 to entry, reads
 * "Internal audits, sometimes called first-party audits, are conducted by, or
 * on behalf of, the organization itself." Both standards carry the same note;
 * they word it differently. So the defect is narrower than first stated: the
 * attribution was defensible and the WORDING REPRODUCED WAS THE OTHER
 * STANDARD'S. A citation checker that matches on expression cannot tell those
 * apart, and this file records that rather than leaving the stronger claim
 * standing.
 *
 * ============ ONE SPAN IS DELIBERATELY OUT OF SCOPE ============
 *
 * AIMS-IA carries a THIRD translated occurrence, in prose, whose English
 * counterpart was never rewritten -- it reads "conducted by, or on behalf of,
 * the organization itself", which is 19011's own wording and correctly cited to
 * 19011 clause 3.1. Its Spanish and Portuguese renderings are nonetheless close
 * to ISO's published wording in those languages, which no instrument here can
 * see. It is reported, not touched.
 */
import { readFileSync, existsSync } from "node:fs";
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
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}

const EDITS = [
  /* ---- AIMS-F 05-02, prose then checkpoint explanation ---- */
  { slug: "05-02-aims-internal-audit", lang: "es-419",
    from: "Su definición de auditoría señala que una auditoría interna es realizada por la propia organización **o por una parte externa en su nombre.**",
    to: "Una nota a su definición de auditoría permite que el trabajo se haga internamente o se encargue a un tercero contratado para llevarlo a cabo." },
  { slug: "05-02-aims-internal-audit", lang: "es-419",
    from: "La definición de auditoría señala que una auditoría interna puede ser realizada por la propia organización o por una parte externa en su nombre.",
    to: "Una nota a la definición de auditoría permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo." },
  { slug: "05-02-aims-internal-audit", lang: "pt-BR",
    from: "Sua definição de auditoria observa que uma auditoria interna é conduzida pela própria organização **ou por uma parte externa em seu nome.**",
    to: "Uma nota à sua definição de auditoria permite que o trabalho seja feito internamente ou entregue a um terceiro contratado para executá-lo." },
  { slug: "05-02-aims-internal-audit", lang: "pt-BR",
    from: "A definição de auditoria observa que uma auditoria interna pode ser conduzida pela própria organização ou por uma parte externa em seu nome.",
    to: "Uma nota à definição de auditoria permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la." },

  /* ---- ISMS-IA 01-01, prose then checkpoint explanation ---- */
  { slug: "isms-ia-01-01-audit-parties", lang: "es-419",
    from: "ISO 19011:2026 señala que una auditoría interna es realizada por la propia organización **o por una parte externa en su nombre**.",
    to: "ISO/IEC 27000:2018 define auditoría, y una nota allí permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo." },
  { slug: "isms-ia-01-01-audit-parties", lang: "es-419",
    from: "ISO 19011:2026 establece que una auditoría interna es realizada por la propia organización o por una parte externa en su nombre.",
    to: "ISO/IEC 27000:2018 define auditoría, y una nota allí permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo." },
  { slug: "isms-ia-01-01-audit-parties", lang: "pt-BR",
    from: "A ISO 19011:2026 observa que uma auditoria interna é conduzida pela própria organização **ou por uma parte externa em seu nome**.",
    to: "A ISO/IEC 27000:2018 define auditoria, e uma nota ali permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la." },
  { slug: "isms-ia-01-01-audit-parties", lang: "pt-BR",
    from: "A ISO 19011:2026 afirma que uma auditoria interna é conduzida pela própria organização ou por uma parte externa em seu nome.",
    to: "A ISO/IEC 27000:2018 define auditoria, e uma nota ali permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la." },

  /* ---- AIMS-IA 01-01, TWO checkpoint explanations in each language ---- */
  { slug: "aims-ia-01-01-who-commissioned-it", lang: "es-419", expect: 2,
    from: "La norma ISO 19011:2026 establece que una auditoría interna es realizada por la propia organización o por una parte externa en su nombre.",
    to: "ISO/IEC 42001 recoge la misma autorización en su nota sobre auditoría: el trabajo puede hacerse internamente o encargarse a un tercero contratado para llevarlo a cabo." },
  { slug: "aims-ia-01-01-who-commissioned-it", lang: "pt-BR", expect: 2,
    from: "A ISO 19011:2026 afirma que uma auditoria interna é conduzida pela própria organização ou por uma parte externa em seu nome.",
    to: "A ISO/IEC 42001 traz a mesma permissão em sua nota sobre auditoria: o trabalho pode ser feito internamente ou entregue a um terceiro contratado para executá-lo." },
];

console.log("");
let ready = 0, done = 0, missing = 0;
const plan = [];
for (const e of EDITS) {
  const rows = await rest("lessons?select=id,slug,language,content_md&language=eq." + e.lang + "&slug=eq." + e.slug);
  if (!rows || rows.length !== 1) { console.log("  MISSING  " + e.slug + " " + e.lang); missing++; continue; }
  const prior0 = plan.find((x) => x.id === rows[0].id);
  const body = prior0 ? prior0.next : rows[0].content_md;
  const want = e.expect || 1;
  const n = body.split(e.from).length - 1;
  const already = body.split(e.to).length - 1;
  if (n === 0 && already >= want) { console.log("  DONE     " + e.slug + " " + e.lang + " -- already applied"); done++; continue; }
  if (n !== want) {
    console.log("  ANCHOR   " + e.slug + " " + e.lang + " -- expected " + want + ", found " + n + "; replacement present " + already);
    missing++; continue;
  }
  /* ============ TWO EDITS IN ONE ROW MUST BE CUMULATIVE ============
   * Both spans in a lesson live in the SAME row. Computing each replacement
   * from the body as first read and then PATCHing twice means the second write
   * discards the first -- a read-modify-write race inside a single batch, which
   * showed up as four verifications failing next to four passing for the same
   * rows. Edits are accumulated per row and written once. */
  const prior = plan.find((x) => x.id === rows[0].id);
  const base = prior ? prior.next : body;
  const nextText = base.split(e.from).join(e.to);
  if (prior) { prior.next = nextText; prior.spans.push(e); }
  else plan.push({ ...e, id: rows[0].id, next: nextText, spans: [e] });
  ready++;
  console.log("  READY    " + e.slug.padEnd(34) + e.lang + (want > 1 ? "  x" + want : ""));
  console.log("           was: " + e.from.slice(0, 120));
  console.log("           now: " + e.to.slice(0, 120));
}
console.log("");
console.log("  " + ready + " ready, " + done + " already applied, " + missing + " not applicable");

if (!APPLY) { console.log(""); console.log("Dry run. Nothing written. Re-run with --apply."); process.exit(missing ? 1 : 0); }
if (missing) { console.error(""); console.error("Refusing a partial batch: " + missing + " edit(s) could not be anchored."); process.exit(1); }

for (const p of plan) {
  await rest("lessons?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ content_md: p.next }),
  });
}
console.log("");
console.log("  " + plan.length + " row(s) written");

let ok = 0, bad = 0;
for (const p of plan) {
  const back = await rest("lessons?select=content_md,mcp_servable&id=eq." + p.id);
  const b = back[0].content_md;
  const good = p.spans.every((sp) => b.includes(sp.to) && !b.includes(sp.from));
  console.log("  " + (good ? "ok  " : "FAIL") + "  " + p.slug.padEnd(34) + p.lang + "   " + p.spans.length + " span(s)   mcp_servable=" + back[0].mcp_servable);
  good ? ok++ : bad++;
}
console.log("");
console.log("  verified " + ok + ", failed " + bad);
console.log("");
console.log("STILL OUTSTANDING:");
console.log("  RE-SCAN. The edit trigger cleared mcp_servable on every row written.");
console.log("  scan-iso-leaks --apply must run or these stay withheld, silently.");
console.log("  OUT OF SCOPE, REPORTED: AIMS-IA carries a THIRD translated occurrence in");
console.log("  prose whose English counterpart is 19011's own wording, correctly cited.");
process.exitCode = bad ? 1 : 0;
