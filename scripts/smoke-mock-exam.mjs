#!/usr/bin/env node
/**
 * smoke-mock-exam.mjs -- draw ONE mock exam per language through the DEPLOYED generate-mock-exam.
 *
 * READ-ONLY on the bank: the function assembles a form, it does not write items. Ruled PROMPT-134 s1.
 *
 * It calls the LIVE function on purpose. The cutover's own gate assembles forms in-process with a
 * TRANSCRIBED copy of the selector; this is the other half -- the thing a candidate actually hits.
 * A pool that assembles locally and fails deployed is the gap a local gate cannot see.
 *
 *   --cert=<CODE>   required
 *   --langs=a,b     default en,es-419,pt-BR
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { getAccessToken, callFunction, anonMissing, AUTH_HELP } from "./lib/fn-auth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = null, LANGS = ["en", "es-419", "pt-BR"];
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--langs=(.+)$/.exec(a))) { LANGS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("unrecognised flag: " + a + ". Known: --cert=<CODE>, --langs=a,b. READ-ONLY.");
  process.exit(2);
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
if (anonMissing()) { console.error(AUTH_HELP.join("\n")); process.exit(2); }

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code,num_questions&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const domOfTask = new Map(tasks.map((t) => [t.id, t.domain_id]));
const codeOfDom = new Map(domains.map((d) => [d.id, d.code]));
/* the function returns items, not task ids, so the bank is read once to resolve each item's task */
const rows = await getAll(KEY, "quiz_questions?select=id,task_id,language&certification_id=eq." +
  cert.id + "&order=id");
const rowById = new Map(rows.map((r) => [r.id, r]));

/* getAccessToken returns {token} or {error} -- NOT a bare token. Passing the object produced
 * "Auth header is not 'Bearer {token}'" and, with the envelope bug above, read as an empty exam. */
const auth = await getAccessToken();
if (auth.error) {
  console.error("CANNOT SIGN IN, so the deployed function cannot be exercised:");
  console.error(Array.isArray(auth.error) ? auth.error.join("\n") : auth.error);
  process.exit(2);
}
const token = auth.token;
console.log("LIVE MOCK EXAM SMOKE   " + CERT + "   num_questions=" + cert.num_questions +
  "   through the DEPLOYED generate-mock-exam");
console.log("");
let bad = 0;
for (const lang of LANGS) {
  let res;
  try {
    res = await callFunction("generate-mock-exam", { certification_id: cert.id, language: lang }, token);
  } catch (e) {
    console.log("  " + lang.padEnd(7) + " CALL FAILED: " + String(e.message).slice(0, 160));
    bad++; continue;
  }
  /* ============ A FAILED CALL IS NOT AN EMPTY EXAM (fixed before this script was believed) ============
   *
   * callFunction returns an ENVELOPE -- {status, ok, json} -- and never throws on an HTTP error. The
   * first version of this reader looked for `.questions` on the envelope, found nothing, and printed
   * "length 0 of 50" for three languages against a pool that assembles 20 of 20 forms locally. A 401
   * was reported as an empty exam. The envelope is now checked BEFORE the body is read. */
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    if (!res.ok) {
      console.log("  " + lang.padEnd(7) + " HTTP " + res.status + "  " +
        JSON.stringify(res.json || {}).slice(0, 160));
      bad++; continue;
    }
    res = res.json;
  }
  const items = (res && (res.questions || res.items || (res.exam && res.exam.questions))) || [];
  if (!items.length) {
    console.log("  " + lang.padEnd(7) + " THE CALL SUCCEEDED AND RETURNED NO ITEMS -- envelope keys " +
      JSON.stringify(res && typeof res === "object" ? Object.keys(res) : typeof res));
    bad++; continue;
  }
  const byDom = new Map();
  let wrongLang = 0, unresolved = 0;
  const seen = new Set();
  let dupes = 0;
  for (const q of items) {
    if (seen.has(q.id)) dupes++;
    seen.add(q.id);
    /* THE LANGUAGE IS CHECKED AGAINST THE BANK, not against the payload's own label: a function that
     * mislabels is exactly what this is looking for. */
    const row = rowById.get(q.id);
    if (!row) { unresolved++; continue; }
    if (row.language !== lang) wrongLang++;
    const dc = codeOfDom.get(domOfTask.get(row.task_id)) || "(none)";
    byDom.set(dc, (byDom.get(dc) || 0) + 1);
  }
  const want = cert.num_questions;
  const okLen = items.length === want;
  const okLang = wrongLang === 0 && unresolved === 0;
  if (!okLen || !okLang || dupes) bad++;
  console.log("  " + lang.padEnd(7) + " length " + items.length + " of " + want +
    (okLen ? "  ok" : "  WRONG LENGTH") +
    "   distinct " + seen.size + (dupes ? "   REPEATED " + dupes : "") +
    "   language mismatches " + wrongLang + (unresolved ? "   unresolved ids " + unresolved : "") +
    (okLang ? "  ok" : "  FAIL"));
  const parts = domains.map((d) => d.code + "=" + (byDom.get(d.code) || 0) +
    " (" + d.weight_pct + "%)").join("  ");
  console.log("           " + parts);
}
console.log("");
console.log(bad ? bad + " language(s) with a problem" :
  "every language: full length, every item distinct, every item's language matches the request");
if (bad) process.exitCode = 1;
