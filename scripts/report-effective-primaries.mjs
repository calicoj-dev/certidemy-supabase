#!/usr/bin/env node
/**
 * report-effective-primaries.mjs -- the effective-primary count for every task of the four ISO
 * certifications, and the queue of tasks below 4.
 *
 * READ-ONLY. No `--apply`, no writes, no model calls, unknown flags exit 2. Ruled PROMPT-86 section 2:
 * this is the director's map queue and NOTHING here is auto-fixed.
 *
 * The classification comes from lib/effective-primary.mjs -- the same function the generator gates on, so
 * a task this report calls thin is exactly a task the generator will refuse to allocate against, and the
 * two cannot disagree.
 *
 * EVERY THIN TASK IS PRINTED WITH ITS PRIMARIES AND THE REASON EACH ONE FAILED, because "below 4" does not
 * say what to do: two containers needs the children promoted, four one-line titles needs different clauses,
 * and no primaries at all may be a deliberate none_apply.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { classifyPrimaries, effectivePrimaryControls, MIN_WORDS } from "./lib/effective-primary.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERTS = ["AIMS-F", "AIMS-IA", "ISMS-F", "ISMS-IA"];
const FLOOR = 4;
/* declared none_apply, by ruling -- these are NOT map defects and must not read as a queue item */
const NONE_APPLY = new Set(["ISMS-F 1.6", "ISMS-F 1.7"]);

{
  const c = effectivePrimaryControls({ quiet: true });
  if (c.fails.length) {
    console.error("REFUSING TO RUN: the effective-primary controls fail:");
    for (const f of c.fails) console.error("  " + f);
    process.exit(3);
  }
  console.log("effective-primary controls: " + c.examined + " case(s), 0 fail");
}

const KEY = requireKey(HERE);
const certs = (await getAll(KEY, "certifications?select=id,code&order=code")).filter((c) => CERTS.includes(c.code));
const codeOfCert = new Map(certs.map((c) => [c.id, c.code]));
const certIds = new Set(certs.map((c) => c.id));
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => certIds.has(t.certification_id));
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text&order=id");
const passageById = new Map(sp.map((p) => [p.id, p]));
/* clauses per SOURCE, because the container test is about one document's own nesting */
const clausesBySource = new Map();
for (const p of sp) {
  if (!clausesBySource.has(p.source_id)) clausesBySource.set(p.source_id, []);
  clausesBySource.get(p.source_id).push(p.clause);
}
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const primaryPassages = new Map();
for (const r of ts) {
  if (r.role !== "primary") continue;
  if (!primaryPassages.has(r.task_id)) primaryPassages.set(r.task_id, []);
  const p = passageById.get(r.passage_id);
  if (p) primaryPassages.get(r.task_id).push(p);
}

const rows = [];
for (const t of tasks) {
  const ps = primaryPassages.get(t.id) || [];
  /* classify per source, so a clause is only ever compared with its own document's nesting */
  const detail = [];
  for (const p of ps) {
    const [one] = classifyPrimaries([p.clause], () => p, clausesBySource.get(p.source_id) || []);
    detail.push({ ...one, source: p.source_id, title: p.title });
  }
  rows.push({
    cert: codeOfCert.get(t.certification_id), code: t.code, statement: t.statement,
    primary: ps.length, effective: detail.filter((d) => d.effective).length, detail,
  });
}
rows.sort((a, b) => a.cert.localeCompare(b.cert) ||
  String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

const md = [];
const p = (s = "") => md.push(s);
p("# Effective primary passages, four ISO certifications");
p("");
p("**Read-only. Nothing here is auto-fixed** -- this is the director's map queue, ruled PROMPT-86 s2.");
p("");
p("An EFFECTIVE primary is a primary passage that is **not a container**, has **its own text**, and is at");
p("least **" + MIN_WORDS + " words**. Containers count zero: their text is their children's text run");
p("together, so a quotation from one can span several controls. Their children count if they are");
p("themselves primary.");
p("");
p("Same function the generator gates on, so a task called thin here is one it will refuse to allocate");
p("against.");
p("");
for (const cert of CERTS) {
  const mine = rows.filter((r) => r.cert === cert);
  const thin = mine.filter((r) => r.effective < FLOOR && !NONE_APPLY.has(cert + " " + r.code));
  const na = mine.filter((r) => NONE_APPLY.has(cert + " " + r.code));
  p("## " + cert + "   (" + mine.length + " tasks; " + thin.length + " below " + FLOOR +
    (na.length ? "; " + na.length + " declared none_apply" : "") + ")");
  p("");
  p("| task | primary | effective | of which containers | shortfall to " + FLOOR + " |");
  p("|---|---|---|---|---|");
  for (const r of mine) {
    const conts = r.detail.filter((d) => /CONTAINER/.test(d.why)).length;
    const flag = NONE_APPLY.has(cert + " " + r.code) ? " *(none_apply)*"
      : (r.effective < FLOOR ? "  **thin**" : "");
    p("| " + r.code + flag + " | " + r.primary + " | " + r.effective + " | " + conts + " | " +
      (NONE_APPLY.has(cert + " " + r.code) ? "-" : Math.max(0, FLOOR - r.effective) || "-") + " |");
  }
  p("");
}

p("---");
p("");
p("## The queue: tasks below " + FLOOR + " effective primaries");
p("");
p("Declared `none_apply` tasks are excluded by ruling and listed separately at the end.");
p("");
const queue = rows.filter((r) => r.effective < FLOOR && !NONE_APPLY.has(r.cert + " " + r.code));
p("**" + queue.length + " task(s).** Each is printed with every primary it has and why each one does or");
p("does not count, because the count alone does not say which fix it needs.");
for (const r of queue) {
  p("");
  p("### " + r.cert + " " + r.code + "   -- " + r.effective + " effective of " + r.primary + " primary");
  p("");
  p("*task:* " + String(r.statement || "").replace(/\s+/g, " "));
  p("");
  if (!r.detail.length) { p("**No primary passages at all.**"); continue; }
  p("| clause | source | words | counts | why |");
  p("|---|---|---|---|---|");
  for (const d of r.detail) {
    p("| `" + d.clause + "` | " + String(d.source).replace("ISO/IEC ", "") + " | " + d.words + " | " +
      (d.effective ? "yes" : "**no**") + " | " + d.why + " |");
  }
}
p("");
p("## Declared none_apply (not queue items)");
p("");
for (const k of [...NONE_APPLY].sort()) {
  const r = rows.find((x) => x.cert + " " + x.code === k);
  p("- **" + k + "** -- " + (r ? r.effective + " effective of " + r.primary + " primary" : "task not found") +
    ". Own material by ruling; not a map defect.");
}
p("");

writeFileSync(join(ROOT, "EFFECTIVE-PRIMARY-MAP.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "EFFECTIVE-PRIMARY-MAP.json"), JSON.stringify({
  floor: FLOOR, min_words: MIN_WORDS, none_apply: [...NONE_APPLY],
  per_task: rows.map((r) => ({ cert: r.cert, code: r.code, primary: r.primary, effective: r.effective,
    containers: r.detail.filter((d) => /CONTAINER/.test(d.why)).map((d) => d.clause),
    detail: r.detail })),
  queue: queue.map((r) => ({ cert: r.cert, code: r.code, primary: r.primary, effective: r.effective })),
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("");
for (const cert of CERTS) {
  const mine = rows.filter((r) => r.cert === cert);
  const thin = mine.filter((r) => r.effective < FLOOR && !NONE_APPLY.has(cert + " " + r.code));
  console.log("  " + cert.padEnd(9) + mine.length + " tasks, " + thin.length + " below " + FLOOR +
    (thin.length ? ":  " + thin.map((r) => r.code + "(" + r.effective + ")").join(" ") : ""));
}
console.log("\nqueue total: " + queue.length + " task(s). Nothing auto-fixed.");
console.log("wrote EFFECTIVE-PRIMARY-MAP.md and .json");
/* AIMS-F in full, for section 5 */
console.log("\nAIMS-F effective primaries, every task:");
const af = rows.filter((r) => r.cert === "AIMS-F");
console.log("  " + af.map((r) => r.code + ":" + r.effective).join("  "));
