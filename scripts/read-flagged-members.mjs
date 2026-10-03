#!/usr/bin/env node
/* Read-only. Prints each flagged field beside its English so the hit can be judged. */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { checkPins } from "./lib/pin-compliance.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let PREFIXES = [], LANG = "es-419";
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--lang=(.+)$/);
  if (m) { LANG = m[1]; continue; }
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a); process.exit(2); }
  PREFIXES.push(a);
}
const KEY = requireKey(HERE);
const SEL = "id,question_group_id,language,question_text,options,explanation";
const rows = await getAll(KEY, "quiz_questions?select=" + SEL + "&retired_at=is.null&order=id");
const byGroup = new Map();
for (const r of rows) {
  if (!r.question_group_id) continue;
  if (!byGroup.has(r.question_group_id)) byGroup.set(r.question_group_id, {});
  byGroup.get(r.question_group_id)[r.language] = r;
}
for (const g of byGroup.values()) {
  const tr = g[LANG], en = g.en;
  if (!tr || !en) continue;
  if (PREFIXES.length && !PREFIXES.some((p) => String(tr.id).startsWith(p))) continue;
  const fields = [["question_text", tr.question_text, en.question_text],
    ["explanation", tr.explanation, en.explanation],
    ...(tr.options || []).map((o) => ["option " + o.id, o.text,
      ((en.options || []).find((x) => x.id === o.id) || {}).text])];
  let printed = false;
  for (const [what, text, enText] of fields) {
    const hits = checkPins(text, LANG, enText) || [];
    if (!hits.length) continue;
    if (!printed) { console.log("\n=== " + String(tr.id).slice(0, 8) + " ==="); printed = true; }
    console.log("  " + what + "  [" + hits.map((h) => h.id + "=" + h.hit).join(", ") + "]");
    console.log("    EN: " + String(enText || "").replace(/\s+/g, " ").slice(0, 300));
    console.log("    " + LANG + ": " + String(text || "").replace(/\s+/g, " ").slice(0, 300));
  }
}
