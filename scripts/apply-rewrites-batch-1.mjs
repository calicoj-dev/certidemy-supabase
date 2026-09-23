#!/usr/bin/env node
/**
 * apply-rewrites-batch-1.mjs -- the approved normative-drift rewrites.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ A LESSON IS A UNIT OF APPLICATION ============
 *
 * All accepted spans for one lesson land in ONE write, or none do. The reason
 * is review integrity rather than cost: two applications produce two review
 * invalidations, and the second reviewer reads a body the first review never
 * saw. A reviewer who approves a lesson with one span applied and another
 * pending has approved a lesson that will not exist.
 *
 * So the unit below is the LESSON, and a lesson whose spans do not all verify
 * is skipped whole.
 *
 * ============ WHAT THESE ARE ============
 *
 * Fifteen rewrites were drafted to convert text that LOOKS like a quotation
 * and is not into our own voice -- clause named, obligation stated. The draft
 * gate rejected two as reproductions (#9 at 11w, #13 at 22w) and three more
 * sat at 8-9w, one token under the floor. All six were redrafted and re-scored
 * clean, with three reserved words restored on the second pass.
 *
 * NOT INCLUDED, deliberately:
 *   #4  03-06-data-for-ai-systems -- approved, but its lesson is absent from
 *       the apply list. Held and reported rather than resolved either way.
 *   #12 04-01-annex-a-structure -- its own batch, on the reserved-term ground
 *       stated alone.
 *
 * ============ #15 IS A QUOTATION, AND IT IS MARKED AS ONE ============
 *
 * It stays at 8w because it is a short, accurate, ATTRIBUTED quotation, which
 * the reproduction policy permits under ten words. The drift it replaces was
 * unmarked paraphrase -- the reader could not tell ours from ISO's. Three
 * conditions: the attribution names the STANDARD and not only the letter, the
 * commentary sits outside the lettered list, and the sibling certification
 * gets the same treatment.
 *
 * The commentary already sat outside the list, and it already read "Available
 * to interested parties as appropriate is conditional and passive" -- so
 * restoring the quotation RESOLVES the self-contradiction rather than creating
 * one.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
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

/* Each edit: the live (drifted) text, and what replaces it. Every `from` must
 * appear EXACTLY ONCE in the body -- a sweep is refused. */
const LESSONS = {
  "01-03-the-ai-system-life-cycle": [
    { id: 1, from: "assessments at planned intervals, and again whenever a significant change is proposed or occurs",
      to: "Clause 8.2 sets two independent triggers for a risk assessment: the planned intervals, or a significant change being proposed or occurring. Either one is enough on its own" },
    { id: 2, from: "performed at planned intervals, and again whenever a significant change is proposed or occurs.",
      to: "performed at the planned intervals, or on a significant change -- whichever comes first, and neither waits for the other." },
  ],
  "02-06-the-ai-system-impact-assessment": [
    { id: 3, from: "assessments are performed at planned intervals, and again whenever a significant change is proposed",
      to: "assessments are performed at the planned intervals, or when a significant change is proposed or occurs -- two triggers, not a sequence" },
  ],
  "03-01-resources-and-competence": [
    { id: 7, from: "are competent, grounded in suitable education, training or experience",
      to: "are competent, and clause 7.2 ties that to a person's background -- schooling, training, or time spent doing the work -- being **appropriate** to the role" },
  ],
  "03-02-awareness-and-communication": [
    { id: 8, from: "Anyone working under the organization's control must be aware of:",
      to: "Clause 7.3 places a requirement -- **shall** -- on the organization: persons doing work under its control are to be made aware of:" },
    { id: 9, from: "work out which internal and external communications bear on the AI management system, and",
      to: "use the reserved verb **determine**, which imports a recorded decision rather than an impression: what must be decided and written down is which communications are **relevant** to the management system, those inside the organization and those with the world outside it, and" },
  ],
  "03-03-documented-information": [
    { id: 5, from: "is on hand and fit to use wherever and whenever it is needed, and",
      to: "is **available** -- obtainable where and when it is needed, and fit to use when it arrives, which is not the same obligation as retention -- and" },
    { id: 10, from: "Documented information that came from outside, where the organization has decided it is needed to plan and run the AI management system",
      to: "Documented information of external origin that the organization has **determined** to be **necessary** for planning and operating the AI management system" },
  ],
  "03-04-operational-planning-and-control": [
    { id: 6, from: "be kept to whatever extent gives confidence that the processes",
      to: "be **available** to the extent **necessary** for confidence that the processes" },
    { id: 11, from: "plan, put in place and control whatever processes are needed to meet requirements and to carry out the actions clause 6 determined",
      to: "name three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6" },
  ],
  "05-01-aims-monitoring-and-measurement": [
    { id: 13, from: "**What to monitor and measure.** **Which methods** to use for monitoring, measurement, analysis and evaluation, so far as each applies, so that the results are valid. **When** monitoring and measurement happens.",
      to: "Clause 9.1 asks four separate questions: **what** to monitor and measure, by **which methods**, **when** the measuring happens, and **when** the results are judged. The methods must be ones that **ensure** the results can be relied on, and the words *as applicable* attach to the methods alone -- not to what is measured, and not to the timing." },
  ],
  "05-02-aims-internal-audit": [
    { id: 14, from: "conducted so that the process stays objective and impartial",
      to: "conducted so as to **ensure** the **objectivity** and **impartiality** of the audit process -- properties of the process the organization must secure, not dispositions of the individual auditor" },
  ],
  "isms-ia-04-02-demonstrated-not-stated": [
    /* #15: the quotation restored, and the attribution moved up to the list
     * heading so it names the STANDARD rather than only the letter. */
    { id: "15a", from: "**What the policy must contain** - it shall:",
      to: "**What the policy must contain** - ISO/IEC 27001:2022, clause 5.2, which says the policy shall:" },
    { id: "15b", from: "**What the policy must be** - it shall:",
      to: "**What the policy must be** - the same clause, items e) to g):" },
    { id: "15c", from: "- g) be **open to interested parties where appropriate**",
      to: "- g) be **available to** interested parties, as appropriate" },
  ],
};

const rest = async (p, init) => {
  const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
  return t ? JSON.parse(t) : null;
};

console.log("");
console.log("BATCH 1 -- per lesson, all-or-none");
const plan = [];
for (const [slug, edits] of Object.entries(LESSONS)) {
  const rows = await rest("lessons?select=id,slug,content_md&language=eq.en&slug=eq." + slug);
  if (rows.length !== 1) { console.log("  SKIP  " + slug + "   expected 1 row, got " + rows.length); continue; }
  const row = rows[0];
  let body = row.content_md, ok = true;
  const detail = [];
  for (const e of edits) {
    const hits = body.split(e.from).length - 1;
    const done = body.split(e.to).length - 1;
    if (hits === 1) { body = body.replace(e.from, e.to); detail.push("#" + e.id + " ok"); }
    else if (hits === 0 && done > 0) { detail.push("#" + e.id + " already"); }
    else { ok = false; detail.push("#" + e.id + " FOUND " + hits + " -- refusing"); }
  }
  console.log("  " + (ok ? "ready " : "HOLD  ") + slug.padEnd(42) + detail.join("  "));
  if (ok && body !== row.content_md) plan.push({ slug, id: row.id, before: row.content_md, after: body, edits });
}

console.log("");
console.log("  lessons ready to write: " + plan.length + " of " + Object.keys(LESSONS).length);
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }
if (plan.length !== Object.keys(LESSONS).length) {
  console.error("");
  console.error("A lesson is not ready. A batch is applied per lesson and this one is incomplete -- nothing written.");
  process.exit(1);
}

console.log("");
console.log("APPLYING -- one write per lesson");
for (const p of plan) {
  const back = await rest("lessons?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ content_md: p.after }),
  });
  if (back?.[0]?.content_md !== p.after) { console.error("  FAILED " + p.slug); process.exit(1); }
  console.log("  wrote " + p.slug + "   " + p.edits.length + " span(s)");
}

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
for (const p of plan) {
  const now = (await rest("lessons?select=content_md&id=eq." + p.id))[0].content_md;
  ok(p.slug + ": every replacement present", p.edits.every((e) => now.includes(e.to)));
  /* THE NEGATIVE HALF: the drifted text must be gone, not merely outnumbered. */
  ok(p.slug + ": no drifted text survives", p.edits.every((e) => !now.includes(e.from)));
}
writeFileSync(join(ROOT, "REWRITES-BATCH-1-APPLIED.json"), JSON.stringify({
  applied: new Date().toISOString(),
  lessons: plan.map((p) => ({ slug: p.slug, spans: p.edits.map((e) => e.id) })),
  held: ["03-06-data-for-ai-systems (#4, absent from the apply list)", "04-01-annex-a-structure (#12, own batch)"],
}, null, 2), "utf8");
console.log("");
console.log(fail ? fail + " post-condition(s) FAILED." : "Applied. Every touched lesson now needs a rescan and its translations regenerated.");
process.exit(fail ? 1 : 0);
