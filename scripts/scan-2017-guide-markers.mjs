/**
 * scan-2017-guide-markers.mjs -- how much 2017 Scrum Guide content is in the
 * English secure pools of the four certifications that cite the 2020 Guide?
 *
 * READ-ONLY. No writes. Unknown flags exit 2. REPORT ONLY.
 *
 * ============ A HIT IS NOT A DEFECT ============
 *
 * "The 2017 Guide used Development Team; the 2020 Guide replaced it with the Scrum
 * Team" is CORRECT content and a certification teaching the change has to name the
 * old term. So every marker is classified, not just counted:
 *
 *   CONTRASTED  the hit sits beside 2017/2020/"renamed"/"replaced"/"no longer"
 *               language -- the item is teaching the change
 *   BARE        the hit stands alone as the current term -- a candidate
 *
 * Reporting the raw count would be the lexical-proxy defect this repository
 * records: a count of a lexical class is a draft until somebody reads its members.
 * Ten are printed in full.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

const CERTS = ["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"];

/* Unicode-aware edges, built with DOUBLED backslashes -- `\p` inside a string
 * literal silently loses its backslash, which is invariant 13's second pass. */
const L = "\\p{L}\\p{N}\\p{M}_";
const edge = (alts) => new RegExp("(?<![" + L + "])(?:" + alts + ")(?![" + L + "])", "giu");

const MARKERS = [
  ["Development Team", edge("development team")],
  ["at least one high priority process improvement", edge("at least one (high[- ]priority|high priority) (process )?improvement")],
  ["first days of the Sprint", edge("first (few )?days of the sprint")],
  ["servant-leader", edge("servant[- ]leader(s|ship)?")],
  ["self-organizing", edge("self[- ]organi[sz](ing|ed|ation)")],
  ["three questions", edge("three questions")],
  ["single Product Backlog in SAFe or LeSS", edge("(safe|less)[^.]{0,80}single product backlog|single product backlog[^.]{0,80}(safe|less)")],
  ["per-item accept or reject at the Sprint Review", edge("(accept|reject)(s|ed|ing)?[^.]{0,60}(each|per|item[- ]by[- ]item)[^.]{0,40}(backlog item|item)|item[- ]by[- ]item[^.]{0,40}(accept|reject)")],
];

/* A hit is CONTRASTED when the item is teaching the 2017->2020 change. */
const CONTRAST = /\b(2017|2020|renamed|replaced|no longer|formerly|previously|used to|earlier edition|older edition|superseded)\b/i;

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("scan-2017-guide-markers");
try {
  const certs = await getAll(KEY, "certifications?select=id,code&order=id");
  const want = certs.filter((c) => CERTS.includes(c.code));
  if (want.length !== CERTS.length) {
    console.error("resolved " + want.length + " of " + CERTS.length + " certifications -- not a result");
    process.exitCode = 2; process.exit();
  }
  const tasks = await getAll(KEY, "tasks?select=id,code&order=id");
  const taskBy = new Map(tasks.map((t) => [t.id, t.code]));

  const rows = [];
  for (const c of want) {
    rows.push(...await getAll(KEY,
      "quiz_questions?select=id,certification_id,task_id,question_text,options,correct_answer,explanation"
      + "&language=eq.en&pool=eq.secure&status=eq.approved&retired_at=is.null"
      + "&certification_id=eq." + c.id + "&order=id"));
  }
  const codeOf = new Map(certs.map((c) => [c.id, c.code]));

  /* POSITIVE CONTROL: the marker set must fire on text known to contain it, or an
   * empty result is a fact about the regexes. */
  const ctlBad = [];
  const probe = "The Development Team is self-organizing and the Scrum Master is a servant-leader.";
  for (const name of ["Development Team", "servant-leader", "self-organizing"]) {
    const re = MARKERS.find((m) => m[0] === name)[1];
    re.lastIndex = 0;
    if (!re.test(probe)) ctlBad.push(name + " did not fire on a sentence containing it");
  }
  const neg = edge("development team");
  neg.lastIndex = 0;
  if (neg.test("developmental teamwork")) ctlBad.push("`Development Team` matched inside a longer word");
  if (ctlBad.length) {
    console.error("MARKER CONTROLS FAILED -- no counts reported:");
    for (const b of ctlBad) console.error("  " + b);
    process.exitCode = 2; process.exit();
  }

  const findings = [];
  const fieldsOf = (q) => {
    const out = [["stem", String(q.question_text || "")], ["explanation", String(q.explanation || "")]];
    for (const o of Array.isArray(q.options) ? q.options : []) {
      if (o && typeof o.id === "string") out.push(["option:" + o.id, String(o.text || "")]);
    }
    return out;
  };

  for (const q of rows) {
    const whole = fieldsOf(q).map(([, t]) => t).join("\n");
    const contrasted = CONTRAST.test(whole);
    for (const [field, text] of fieldsOf(q)) {
      if (!text.trim()) continue;
      for (const [name, re] of MARKERS) {
        re.lastIndex = 0;
        const m = re.exec(text);
        if (!m) continue;
        findings.push({
          id: q.id, cert: codeOf.get(q.certification_id), task: taskBy.get(q.task_id) || "?",
          marker: name, field, hit: m[0],
          state: contrasted ? "CONTRASTED" : "BARE",
          key: q.correct_answer,
          excerpt: text.replace(/\s+/g, " ").slice(Math.max(0, m.index - 110), m.index + 150),
        });
      }
    }
  }

  console.log("2017 SCRUM GUIDE MARKERS -- English secure pools, read-only");
  console.log("  marker controls behave: three fire on a sentence containing them, none matches inside a longer word");
  console.log("  English secure items examined  " + rows.length);
  console.log("  marker hits                    " + findings.length);
  console.log("");
  console.log("PER CERTIFICATION");
  console.log("  cert        items   BARE   CONTRASTED   distinct items flagged");
  for (const c of CERTS) {
    const mine = findings.filter((f) => f.cert === c);
    const n = rows.filter((r) => codeOf.get(r.certification_id) === c).length;
    console.log("  " + c.padEnd(11) + String(n).padStart(5) +
      String(mine.filter((f) => f.state === "BARE").length).padStart(7) +
      String(mine.filter((f) => f.state === "CONTRASTED").length).padStart(13) +
      String(new Set(mine.map((f) => f.id)).size).padStart(24));
  }
  console.log("");
  console.log("PER MARKER");
  console.log("  " + "marker".padEnd(46) + "BARE  CONTRASTED");
  for (const [name] of MARKERS) {
    const mine = findings.filter((f) => f.marker === name);
    console.log("  " + name.padEnd(46) +
      String(mine.filter((f) => f.state === "BARE").length).padStart(4) +
      String(mine.filter((f) => f.state === "CONTRASTED").length).padStart(12));
  }

  /* Ten READ examples, spread across markers, BARE first -- those are the ones
   * that could be a defect. */
  const bare = findings.filter((f) => f.state === "BARE");
  const byMarker = new Map();
  for (const f of bare) { if (!byMarker.has(f.marker)) byMarker.set(f.marker, []); byMarker.get(f.marker).push(f); }
  const picked = [];
  for (let i = 0; picked.length < 10 && i < 40; i++) {
    for (const k of [...byMarker.keys()].sort()) {
      const l = byMarker.get(k);
      if (l[i] && picked.length < 10) picked.push(l[i]);
    }
  }
  console.log("");
  console.log("TEN READ EXAMPLES -- BARE hits, spread across markers");
  if (!picked.length) console.log("  none: every hit is CONTRASTED, i.e. the item is teaching the 2017->2020 change");
  let n = 0;
  for (const f of picked) {
    n++;
    console.log("");
    console.log("  " + n + ". " + f.cert + " task " + f.task + " " + f.id.slice(0, 8) +
      "  [" + f.field + "]  marker: " + f.marker + "   key " + JSON.stringify(f.key));
    console.log("      ..." + f.excerpt + "...");
  }

  const path = join(ROOT, "SCRUM-2017-MARKERS.json");
  writeFileSync(path, JSON.stringify({
    examined: rows.length, hits: findings.length,
    per_cert: CERTS.map((c) => ({ cert: c,
      items: rows.filter((r) => codeOf.get(r.certification_id) === c).length,
      bare: findings.filter((f) => f.cert === c && f.state === "BARE").length,
      contrasted: findings.filter((f) => f.cert === c && f.state === "CONTRASTED").length })),
    findings,
  }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
} finally { release(); }
