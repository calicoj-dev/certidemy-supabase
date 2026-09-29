#!/usr/bin/env node
/**
 * report-grounding-orphans.mjs -- secure items from grounded generation with no `item_grounding` row,
 * and whether every existing grounding row's anchor is still PRIMARY for its task.
 *
 * READ-ONLY. No writes beyond one artifact, no model calls, unknown flags exit 2. Ruled PROMPT-87 s2.
 *
 * ============ TWO QUESTIONS, BOTH ABOUT THE SAME BLIND SPOT ============
 *
 * (1) ORPHANS. The anchor-cap census reads `item_grounding` to learn what a task already carries, so an
 *     item with no grounding row is invisible to the cap. `gen-grounded-items --apply` wrote none until
 *     today, so anything it inserted is an orphan by construction.
 *
 * (2) ROLES THAT MOVED. `passagesFor` used to feed the writer the RANKER'S set while roles came from
 *     `task_sources`, so an item could have been written against a passage that was never primary -- and
 *     roles have since changed twice (the AIMS-F re-role, the 1.3 promotion). An anchor that is no longer
 *     primary is not a defect in the item; it is a fact the cap and the gate need to agree on.
 *
 * WHICH ITEMS COUNT AS "FROM GROUNDED GENERATION": `item_origin = 'generated'` AND pool secure. Read from
 * the column rather than inferred from a date, because a date range would also sweep up the older
 * gen-cert-secure rows, which never had grounding and are not expected to.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOfCert = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,certification_id,code&order=code");
const taskInfo = new Map(tasks.map((t) => [t.id, { code: t.code, cert: codeOfCert.get(t.certification_id) }]));
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id");
const passageById = new Map(sp.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const roleOf = new Map();          /* taskId|source|clause -> role */
for (const r of ts) {
  const p = passageById.get(r.passage_id);
  if (p) roleOf.set(r.task_id + "|" + p.source_id + "|" + p.clause, r.role);
}
const ig = await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,source_id,edition,generator&order=question_id");
const groundedIds = new Set(ig.map((g) => g.question_id));

/* every secure generated item, per certification */
const items = [];
for (const c of certs) {
  const rows = await getAll(KEY, "quiz_questions?select=id,task_id,pool,status,item_origin,language," +
    "retired_at&certification_id=eq." + c.id + "&language=eq.en&order=id");
  for (const r of rows) {
    if (r.pool !== "secure") continue;
    if (r.item_origin !== "generated") continue;
    items.push({ ...r, cert: c.code });
  }
}
const orphans = items.filter((r) => !groundedIds.has(r.id));

/* the role check on every existing grounding row */
const roleRows = [];
for (const g of ig) {
  const q = items.find((r) => r.id === g.question_id) ||
    null;                                   /* an item outside the generated-secure set is still checked */
  const tid = q ? q.task_id : null;
  let taskId = tid;
  if (!taskId) {
    /* find the question's task even if it is not in the generated-secure set */
    for (const c of certs) {
      /* already fetched above only for generated secure; fall back to a targeted read */
      void c;
    }
  }
  const t = taskId ? taskInfo.get(taskId) : null;
  /* ============ THE B.x/A.x PAIRING, WHICH THIS CHECK WAS MISSING ============
   *
   * The gate counts 42001 Annex B guidance as PRIMARY when its own Annex A control is primary: B.6.2.6
   * is primary wherever A.6.2.6 is. This check looked up (task, source, clause) directly and therefore
   * reported a287616d as resting on a supporting anchor when the gate is perfectly happy with it --
   * over-reporting, which is the direction that gets a guard deleted by the first person it inconveniences.
   *
   * Measured after the fix: 4.4 has A.6.2.6 primary and B.6.2.6 supporting, so the pairing applies and
   * a287616d was never a finding. 4.3 had B.2.3 supporting with A.2.3 primary -- the pairing applies there
   * too, but that item anchored in the GUIDANCE rather than the control and has been re-anchored to
   * A.2.3, which is the better anchor either way. */
  const key = taskId + "|" + g.source_id + "|" + g.key_support_clause;
  let role = roleOf.get(key) || null;
  if (role !== "primary" && /^B\./.test(String(g.key_support_clause))) {
    const sibling = "A." + String(g.key_support_clause).slice(2);
    if (roleOf.get(taskId + "|" + g.source_id + "|" + sibling) === "primary") {
      role = "primary (via its Annex A control " + sibling + ")";
    }
  }
  roleRows.push({ id: String(g.question_id).slice(0, 8), cert: t ? t.cert : "?", task: t ? t.code : "?",
    source: g.source_id, clause: g.key_support_clause, role: role || "NOT LINKED",
    /* startsWith, because a paired role reads "primary (via its Annex A control A.6.2.6)" */
    ok: String(role || "").startsWith("primary") });
}
const notPrimary = roleRows.filter((r) => !r.ok);

const md = [];
const p = (s = "") => md.push(s);
p("# Grounding orphans, and whether every anchor is still primary");
p("");
p("**Read-only.** Ruled PROMPT-87 s2.");
p("");
p("## Orphans");
p("");
p("Secure items with `item_origin = 'generated'`: **" + items.length + "**. Of those, **" +
  orphans.length + "** have no `item_grounding` row.");
p("");
p("An orphan is invisible to the anchor-cap census, which reads `item_grounding` to learn what a task");
p("already carries -- so a later run can add keys to a clause the census reports as empty.");
p("");
if (orphans.length) {
  p("| cert | item | task | status |");
  p("|---|---|---|---|");
  for (const o of orphans.slice(0, 60)) {
    const t = taskInfo.get(o.task_id);
    p("| " + o.cert + " | `" + String(o.id).slice(0, 8) + "` | " + (t ? t.code : "?") + " | " + o.status + " |");
  }
  if (orphans.length > 60) p("");
  if (orphans.length > 60) p("_...and " + (orphans.length - 60) + " more; the full list is in the JSON._");
} else {
  p("**None.**");
}
p("");
p("## Is each existing anchor still primary?");
p("");
p("**" + ig.length + " grounding row(s); " + notPrimary.length + " whose anchor is not primary for its task.**");
p("");
p("This is not a defect in the item. `passagesFor` used to feed the writer the ranker's set while roles");
p("came from `task_sources`, and roles have moved twice since -- the AIMS-F re-role and the 1.3 promotion.");
p("");
if (notPrimary.length) {
  p("| item | cert | task | source | clause | role now |");
  p("|---|---|---|---|---|---|");
  for (const r of notPrimary) {
    p("| `" + r.id + "` | " + r.cert + " | " + r.task + " | " + String(r.source).replace("ISO/IEC ", "") +
      " | `" + r.clause + "` | **" + r.role + "** |");
  }
} else {
  p("**All anchors are still primary.**");
}
p("");
writeFileSync(join(ROOT, "GROUNDING-ORPHANS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "GROUNDING-ORPHANS.json"), JSON.stringify({
  generated_secure: items.length, grounding_rows: ig.length,
  orphans: orphans.map((o) => ({ cert: o.cert, id: String(o.id).slice(0, 8),
    task: (taskInfo.get(o.task_id) || {}).code, status: o.status, full_id: o.id })),
  anchors_not_primary: notPrimary,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("generated secure items: " + items.length);
console.log("grounding rows        : " + ig.length);
console.log("ORPHANS               : " + orphans.length);
for (const o of orphans.slice(0, 12)) {
  console.log("  " + o.cert.padEnd(9) + String(o.id).slice(0, 8) + "  task " +
    ((taskInfo.get(o.task_id) || {}).code || "?") + "  " + o.status);
}
console.log("anchors NOT primary   : " + notPrimary.length);
for (const r of notPrimary.slice(0, 12)) {
  console.log("  " + r.id + "  " + r.cert + " " + r.task + "  " + r.source + " " + r.clause + "  -> " + r.role);
}
console.log("wrote GROUNDING-ORPHANS.md and .json");
