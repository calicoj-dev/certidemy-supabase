#!/usr/bin/env node
/**
 * fix-english-template-sentences.mjs -- three English sentences that are
 * grammatical and false.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY INVARIANT 12 CANNOT SEE THESE ============
 *
 * The seam check asks whether a splice left two sentence-starts with no
 * boundary. These three splices are perfectly well formed. They are WRONG,
 * which is a different property and not a mechanical one.
 *
 * Two come from the rewrite template "Clause N requires the organization to ..."
 * being put in front of a clause that was describing what the CLAUSE does:
 *
 *   "Clause 7.4 requires the organization to use the reserved verb determine"
 *       -- the clause does not require anyone to use a verb. It USES one.
 *   "Clause 8.1 requires the organization to name three obligations"
 *       -- the clause does not require the organization to name them. It NAMES
 *          them, and the obligations are what it requires.
 *
 * The third inverts a meaning:
 *
 *   "The own-work rule is the canonical way of failing that and is sound
 *    practice"
 *
 * reads as "the rule is how you fail", and the Spanish then rendered it as
 * "auditing your own work is good practice" -- the opposite of the lesson.
 *
 * ============ ANCHORS ARE WHOLE SENTENCES ============
 *
 * Never mid-phrase. That is exactly how 01-03 broke: a `from` beginning with
 * `assessments` ate the noun in front of it. Each `from` here starts at a
 * sentence boundary and ends at one, and the count is asserted at 1.
 */
import { existsSync, readFileSync } from "node:fs";
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

const EDITS = [
  {
    slug: "03-02-awareness-and-communication",
    why: "clause 7.4 does not require anyone to use a verb; it uses one",
    from: "Clause 7.4 requires the organization to use the reserved verb **determine**, which imports a recorded decision rather than an impression: what must be decided and written down is which communications are **relevant** to the management system, those inside the organization and those with the world outside it, and names four things it must decide:",
    to: "Clause 7.4 uses the reserved verb **determine**, which imports a recorded decision rather than an impression. What the organization has to decide, and write down, is which communications are **relevant** to the management system, both inside the organization and with the world outside it, and the clause names four things the organization must decide:",
  },
  {
    slug: "03-04-operational-planning-and-control",
    why: "clause 8.1 does not require the organization to name obligations; it names them",
    from: "Clause 8.1 requires the organization to name three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6, and it says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
    to: "Clause 8.1 names three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6. The clause also says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
  },
  {
    slug: "05-02-aims-internal-audit",
    why: "as written the rule IS the failure; the Spanish then said auditing your own work is good practice",
    from: "The own-work rule is the canonical way of failing that and is sound practice, but attributing it to this standard's text is a misattribution.",
    to: "Auditing one's own work is the canonical way of failing that, and a rule against it is sound practice, but attributing that rule to this standard's text is a misattribution.",
  },
];

async function rest(path, init) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 140));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

console.log("");
console.log("ENGLISH TEMPLATE SENTENCES -- " + EDITS.length + " declared rewrite(s)");
const staged = [];
let bad = 0;
for (const e of EDITS) {
  const rows = await rest("lessons?select=id,slug,content_md&language=eq.en&slug=eq." + e.slug);
  if (rows.length !== 1) { console.log("  MISS  " + e.slug + ": " + rows.length + " English row(s)"); bad++; continue; }
  const md = rows[0].content_md;
  const n = md.split(e.from).length - 1;
  if (n !== 1) { console.log("  MISS  " + e.slug + ": anchor matched " + n + " time(s)"); bad++; continue; }
  /* A whole-sentence anchor ends on terminal punctuation or a colon, and starts
   * after one. Asserted rather than trusted, because the whole point of these
   * three is that a mid-phrase anchor is how 01-03 broke. */
  const at = md.indexOf(e.from);
  const before = md.slice(Math.max(0, at - 2), at);
  const startsClean = at === 0 || /[\n>"]\s?$/.test(before) || /[.!?:]\s$/.test(before);
  const endsClean = /[.!?:]$/.test(e.from) && /[.!?:]$/.test(e.to);
  if (!startsClean || !endsClean) {
    console.log("  MISS  " + e.slug + ": anchor is not whole-sentence (start=" + startsClean + " end=" + endsClean + ")");
    bad++; continue;
  }
  staged.push({ ...e, id: rows[0].id, md, next: md.replace(e.from, e.to) });
  console.log("  ok    " + e.slug.padEnd(40) + e.why);
}

if (bad) { console.log(""); console.log("ABORT: " + bad + " problem(s). Nothing written."); process.exit(1); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
let fail = 0;
for (const s of staged) {
  const back = await rest("lessons?id=eq." + s.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ content_md: s.next }),
  });
  const after = back[0];
  const ok = [
    ["bytes match what was computed", after.content_md === s.next],
    ["the old sentence is gone", !after.content_md.includes(s.from)],
    ["the new sentence is present", after.content_md.includes(s.to)],
    ["trigger cleared mcp_servable", after.mcp_servable === false],
  ];
  const allOk = ok.every(([, v]) => v);
  if (!allOk) fail++;
  console.log("  " + (allOk ? "PASS  " : "FAIL  ") + s.slug);
  for (const [l, v] of ok) if (!v) console.log("          FAILED: " + l);
}
console.log("");
if (fail) { console.log(fail + " row(s) did not verify."); process.exitCode = 1; }
else console.log("All " + staged.length + " written and byte-verified. Rescan required: each is now UNSCANNED.");
