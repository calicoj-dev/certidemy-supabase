#!/usr/bin/env node
/**
 * revert-ismsia-citation.mjs - restore ISO 19011:2026 as the cited standard in
 * isms-ia-01-01-audit-parties, keeping the rewritten wording.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY THIS IS A REVERT AND NOT A CORRECTION ============
 *
 * The lesson reproduced seventeen words of ISO/IEC 27000:2018 while citing ISO
 * 19011:2026. The rewrite removed the reproduction AND changed the citation to
 * 27000, on the reported ground that 19011 "contains neither half of it".
 *
 * That ground was wrong. ISO 19011:2026 clause 3.1, Note 1 to entry:
 *
 *   "Internal audits, sometimes called first-party audits, are conducted by,
 *    or on behalf of, the organization itself."
 *
 * Both standards carry the note in different words. So the ATTRIBUTION was
 * defensible all along and only the WORDING was borrowed -- and swapping one
 * correct citation for another correct citation is churn on a live lesson.
 *
 * 19011 is also the better of the two here: this is an auditor certification
 * and 19011 is the auditing standard. The rewritten wording stays, because the
 * reproduction was real.
 *
 * AIMS-IA keeps ISO/IEC 42001 -- it is the 42001 certification and 42001
 * carries the same allowance. AIMS-F is untouched.
 *
 * ============ THE CLAUSE WORD, AND WHY THE TRANSLATIONS HAVE NONE ============
 *
 * Measured before writing: neither the es-419 nor the pt-BR row of this lesson
 * contains "apartado", "clausula" or "secao" even once. So the translations
 * cite the bare number, which is what the lesson already does, rather than
 * importing a register word this document has never used. CLAUDE.md records
 * that lessons and the item bank run OPPOSITE conventions on that word; the
 * safest move in a document that uses neither is to keep using neither.
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

const SLUG = "isms-ia-01-01-audit-parties";
/* Both spans in each row carry identical text after the rewrite, so each is
 * expected TWICE -- prose and checkpoint explanation. */
const EDITS = [
  { lang: "en", expect: 2,
    from: "ISO/IEC 27000:2018 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out.",
    to: "ISO 19011:2026 clause 3.1 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out." },
  { lang: "es-419", expect: 2,
    from: "ISO/IEC 27000:2018 define auditoría, y una nota allí permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo.",
    to: "ISO 19011:2026 define auditoría en 3.1, y una nota allí permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo." },
  { lang: "pt-BR", expect: 2,
    from: "A ISO/IEC 27000:2018 define auditoria, e uma nota ali permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la.",
    to: "A ISO 19011:2026 define auditoria em 3.1, e uma nota ali permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la." },
];

console.log("");
let ready = 0, done = 0, missing = 0;
const plan = [];
for (const e of EDITS) {
  const rows = await rest("lessons?select=id,language,content_md&slug=eq." + SLUG + "&language=eq." + e.lang);
  if (!rows || rows.length !== 1) { console.log("  MISSING  " + e.lang); missing++; continue; }
  const body = rows[0].content_md;
  const n = body.split(e.from).length - 1;
  const already = body.split(e.to).length - 1;
  if (n === 0 && already >= e.expect) { console.log("  DONE     " + e.lang + " -- already reverted"); done++; continue; }
  if (n !== e.expect) {
    console.log("  ANCHOR   " + e.lang + " -- expected " + e.expect + ", found " + n + "; replacement present " + already);
    missing++; continue;
  }
  plan.push({ ...e, id: rows[0].id, next: body.split(e.from).join(e.to) });
  ready++;
  console.log("  READY    " + e.lang + "  x" + e.expect);
  console.log("           was: " + e.from.slice(0, 118));
  console.log("           now: " + e.to.slice(0, 118));
}
console.log("");
console.log("  " + ready + " ready, " + done + " already reverted, " + missing + " not applicable");

if (!APPLY) { console.log(""); console.log("Dry run. Nothing written. Re-run with --apply."); process.exit(missing ? 1 : 0); }
if (missing) { console.error(""); console.error("Refusing a partial batch."); process.exit(1); }

for (const p of plan) {
  await rest("lessons?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ content_md: p.next }),
  });
}
let ok = 0, bad = 0;
for (const p of plan) {
  const back = await rest("lessons?select=content_md,mcp_servable&id=eq." + p.id);
  const b = back[0].content_md;
  const good = b.split(p.to).length - 1 === p.expect && !b.includes(p.from);
  console.log("  " + (good ? "ok  " : "FAIL") + "  " + p.lang + "   " + p.expect + " span(s)   mcp_servable=" + back[0].mcp_servable);
  good ? ok++ : bad++;
}
console.log("");
console.log("  verified " + ok + ", failed " + bad);
console.log("  RE-SCAN needed: the edit trigger cleared mcp_servable on every row written.");
process.exitCode = bad ? 1 : 0;
