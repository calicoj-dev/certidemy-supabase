#!/usr/bin/env node
/**
 * apply-blueprint-repairs.mjs - repair ISO leaks in the blueprint surfaces.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 *   node scripts/apply-blueprint-repairs.mjs                 # dry
 *   node scripts/apply-blueprint-repairs.mjs --apply
 *   node scripts/apply-blueprint-repairs.mjs --queue q.json  # emit the
 *                                                            # bilingual queue
 *
 * The edits themselves are in blueprint-repairs.mjs. This is the machinery.
 *
 * ============ WHY THIS IS NOT apply-marking-spec.mjs ============
 *
 * That applier splices a LINE inside `lessons.content_md`. These targets are
 * whole COLUMNS -- `concepts.description` (text) and `tasks.knowledge` (a text
 * array, repaired at one index). Different shape, so a different applier, and
 * the guards are re-implemented here rather than the line-splicing logic being
 * bent into a shape it was not built for.
 *
 * ============ FOUR GUARDS, RUN ON EVERY EDIT ============
 *
 *   1. LEAK GONE. Longest run against the three standards must fall under the
 *      policy threshold read from mcp_leak_policy.
 *   2. OBLIGATION HELD, both directions, via lib/obligation-guard.mjs. This is
 *      the one that matters: `tasks.knowledge` is what a standards body reads,
 *      and a knowledge field that has quietly dropped `shall` is worse than the
 *      quotation it replaced AND scores zero on guard 1.
 *   3. NOTHING ELSE MOVED. The replacement must differ from the original in
 *      exactly the spliced span -- the prefix and suffix are compared byte for
 *      byte, so a repair cannot silently reflow the paragraph around it.
 *   4. THE ARRAY SHAPE SURVIVES. A knowledge array must come back with the same
 *      length and the same entries at every index this edit does not name.
 *
 * ============ ENGLISH NOW, TRANSLATIONS QUEUED ============
 *
 * `tasks.knowledge` has es-419 and pt-BR siblings in `task_translations`.
 * `concepts` has NO translation table -- checked -- so the ISMS-F concept is a
 * single row and is finished when English is.
 *
 * The translations are NOT auto-recast here, and that is deliberate. The index
 * is English ISO text, so a translated row scores zero before and after: there
 * is no measurement that could tell a faithful re-translation from a wrong one.
 * Writing 34 Spanish and Portuguese phrases on the strength of a guard that
 * cannot see them is precisely the failure CLAUDE.md records three rungs of.
 *
 * So `--queue` emits the exact sentences a bilingual reader has to look at, with
 * the English before and after beside each, and the English lands today.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";
import { preservesObligation, checkFaithful } from "./lib/obligation-guard.mjs";
import { REPAIRS } from "./blueprint-repairs.mjs";

const KNOWN = new Set(["--apply", "--queue", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". --apply family: dry by default.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");
const QUEUE = arg("queue", "");
const SEED = 5;

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
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 220));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

/* ------------------------------------------------ the guard's own control */
const gb = checkFaithful();
if (gb.length) {
  console.error("THE OBLIGATION GUARD FAILED ITS CONTROL; not proposing anything.");
  for (const b of gb) console.error("  X " + b);
  process.exit(1);
}

if (!sourcesAvailable()) { console.error("standards not on disk"); process.exit(2); }
const grams = new Set();
for (const p of Object.values(PDFS)) {
  const w = norm(pdfText(p)).split(" ").filter(Boolean);
  if (w.length < 1000) { console.error("short extraction; refusing"); process.exit(1); }
  for (let i = 0; i + SEED <= w.length; i++) grams.add(w.slice(i, i + SEED).join(" "));
}
function longestRun(t) {
  const w = norm(t).split(" ").filter(Boolean);
  let b = 0, bt = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > b) { b = n; bt = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best: b, text: bt };
}

const policy = await rest("mcp_leak_policy?select=threshold_words");
const THRESHOLD = policy?.[0]?.threshold_words;
if (!THRESHOLD) { console.error("mcp_leak_policy unreadable; run 332"); process.exit(2); }

const certs = await rest("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

console.log("");
console.log(APPLY ? "MODE: apply" : "MODE: dry -- nothing will be written");
console.log("threshold " + THRESHOLD + "w   obligation control: 9/9");
console.log("");

const plan = [];
const problems = [];
const queue = [];

for (const r of REPAIRS) {
  const label = r.cert + " " + r.kind + " " + r.key + "." + r.field;
  let row, whole;
  if (r.kind === "concept") {
    const rows = await rest("concepts?select=id,slug,description&certification_id=eq." + idOf[r.cert] + "&slug=eq." + r.key);
    row = rows[0];
    whole = row?.description;
  } else {
    const rows = await rest("tasks?select=id,code,knowledge&certification_id=eq." + idOf[r.cert] + "&code=eq." + r.key);
    row = rows[0];
    /* `knowledge` IS A TEXT COLUMN, not a text[]. The first version of this
     * script assumed an array and produced `target row or index not found`
     * on all seventeen AIMS-F tasks -- a message that names the row when the
     * row was right there and the TYPE was wrong. Both shapes are handled
     * because nothing guarantees the other certifications match. */
    whole = Array.isArray(row?.knowledge) ? row.knowledge[r.index] : row?.knowledge;
  }
  if (!row || whole === undefined) { problems.push(label + ": target row or index not found"); continue; }

  /* ---- SPLICE EVERY SPAN, CUMULATIVELY.
   * Eight AIMS-F fields carry TWO runs. Computing each span's replacement from
   * the ORIGINAL text and writing them separately would have the second write
   * silently discard the first -- both would report success. */
  let after = whole;
  let spanFail = null;
  const spanReports = [];
  for (const sp of r.spans) {
    if (!after.includes(sp.before)) {
      if (after.includes(sp.after)) { spanReports.push("(done)"); continue; }
      spanFail = "span not present: \"" + sp.before.slice(0, 54) + "...\"";
      break;
    }
    const at = after.indexOf(sp.before);
    const pre = after.slice(0, at), suf = after.slice(at + sp.before.length);
    const next = pre + sp.after + suf;
    if (!next.startsWith(pre) || !next.endsWith(suf)) { spanFail = "splice disturbed text outside its span"; break; }

    /* GUARD 2 runs on the SPAN, not the paragraph. A dropped `shall` would
     * otherwise hide behind the dozen other modals around it. */
    const ob1 = preservesObligation(sp.before, sp.after, "en");
    if (!ob1.ok && !r.obligation_override) {
      spanFail = "OBLIGATION -- " + ob1.reason +
        " (strong " + ob1.before.strong + "->" + ob1.after.strong + ", weak " + ob1.before.weak + "->" + ob1.after.weak + ")";
      break;
    }
    spanReports.push(ob1.ok ? (ob1.before.strong + "/" + ob1.before.weak + "->" + ob1.after.strong + "/" + ob1.after.weak)
                            : "OVERRIDDEN " + ob1.before.strong + "/" + ob1.before.weak + "->" + ob1.after.strong + "/" + ob1.after.weak);
    after = next;
  }
  if (spanFail) { problems.push(label + ": " + spanFail); continue; }

  /* GUARD 1 on the WHOLE field after every span landed -- the only level at
   * which "this field no longer leaks" is a true statement. */
  const b4 = longestRun(whole), af = longestRun(after);
  if (af.best >= THRESHOLD) {
    problems.push(label + ": still leaks " + af.best + "w -- \"" + af.text.slice(0, 70) + "\"");
    continue;
  }
  if (after === whole) { console.log("  ok(done) " + label); continue; }

  plan.push({ ...r, label, row, whole, after, b4: b4.best, af: af.best, spanReports });
  console.log("  " + label.padEnd(30) + String(r.spans.length) + " span   leak " +
    String(b4.best).padStart(2) + "w -> " + String(af.best).padStart(2) + "w   oblig " + spanReports.join(" ") +
    (r.obligation_override ? "  [OVERRIDE]" : ""));
  if (r.obligation_override) console.log("      override: " + r.obligation_override);
  if (VERBOSE) for (const sp of r.spans) {
    console.log("      -  " + sp.before);
    console.log("      +  " + sp.after);
  }
}

console.log("");
console.log("planned " + plan.length + " of " + REPAIRS.length + "   problems " + problems.length);
for (const p of problems) console.log("  X " + p);
if (problems.length) {
  console.log("");
  console.log("NOT WRITING. A blueprint surface half-repaired is a syllabus that leaks");
  console.log("in some tasks and not others, with nothing recording which.");
  process.exitCode = 1;
} else if (!APPLY) {
  console.log("");
  console.log("Dry run. Re-run with --apply.");
}

/* -------------------------------------------------------------- the write */
if (APPLY && !problems.length) {
  console.log("");
  for (const p of plan) {
    if (p.kind === "concept") {
      await rest("concepts?id=eq." + p.row.id, { method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ description: p.after }) });
    } else if (Array.isArray(p.row.knowledge)) {
      const arr = [...p.row.knowledge];
      arr[p.index] = p.after;
      await rest("tasks?id=eq." + p.row.id, { method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ knowledge: arr }) });
    } else {
      await rest("tasks?id=eq." + p.row.id, { method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ knowledge: p.after }) });
    }
    console.log("  wrote " + p.label);
  }

  /* ===================== POST-CONDITIONS, BOTH DIRECTIONS ===================== */
  console.log("");
  console.log("POST-CONDITIONS");
  const checks = [];
  const chk = (n, ok, d) => { checks.push({ n, ok, d }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

  let landed = 0, shapeBroke = [], stillLeaks = [];
  for (const p of plan) {
    if (p.kind === "concept") {
      const row = (await rest("concepts?select=description&id=eq." + p.row.id))[0];
      if (row.description === p.after) landed++;
      if (longestRun(row.description).best >= THRESHOLD) stillLeaks.push(p.label);
    } else {
      const row = (await rest("tasks?select=knowledge&id=eq." + p.row.id))[0];
      const k = row.knowledge;
      if (Array.isArray(p.row.knowledge)) {
        if (!Array.isArray(k) || k.length !== p.row.knowledge.length) { shapeBroke.push(p.label); continue; }
        /* GUARD 4: every index this edit did not name must be byte-identical. */
        for (let i = 0; i < k.length; i++) {
          if (i !== p.index && k[i] !== p.row.knowledge[i]) shapeBroke.push(p.label + " idx" + i);
        }
        if (k[p.index] === p.after) landed++;
        if (longestRun(k[p.index]).best >= THRESHOLD) stillLeaks.push(p.label);
      } else {
        if (typeof k !== "string") { shapeBroke.push(p.label + ": type changed"); continue; }
        if (k === p.after) landed++;
        if (longestRun(k).best >= THRESHOLD) stillLeaks.push(p.label);
      }
    }
  }
  chk("every repair landed", landed === plan.length, landed + " of " + plan.length);
  chk("no knowledge array changed shape or lost a sibling entry", shapeBroke.length === 0,
    shapeBroke.length ? shapeBroke.join(", ") : plan.filter((p) => p.kind === "task").length + " arrays intact");
  chk("no repaired field still leaks", stillLeaks.length === 0,
    stillLeaks.length ? stillLeaks.join(", ") : "0");

  /* THE WHOLE SURFACE, RE-MEASURED. The per-edit checks above would pass on a
   * repair that fixed its own span and left another field leaking -- which is
   * the state that matters, because the view returns all of them. */
  for (const code of ["ISMS-F", "AIMS-F"]) {
    const tasks = await rest("tasks?select=code,knowledge,statement,skills,abilities&certification_id=eq." + idOf[code]);
    const cons = await rest("concepts?select=slug,name,description&certification_id=eq." + idOf[code]);
    const over = [];
    for (const t of tasks) {
      for (const f of ["statement", "skills", "abilities"]) {
        const v = Array.isArray(t[f]) ? t[f].join(" ") : t[f];
        if (longestRun(v || "").best >= THRESHOLD) over.push(code + " task " + t.code + "." + f);
      }
      (Array.isArray(t.knowledge) ? t.knowledge : []).forEach((k, i) => {
        if (longestRun(k).best >= THRESHOLD) over.push(code + " task " + t.code + ".knowledge[" + i + "]");
      });
    }
    for (const c of cons) {
      if (longestRun(c.description || "").best >= THRESHOLD) over.push(code + " concept " + c.slug);
      if (longestRun(c.name || "").best >= THRESHOLD) over.push(code + " concept name " + c.slug);
    }
    chk(code + " blueprint is clean end to end", over.length === 0,
      over.length ? over.slice(0, 6).join(", ") + (over.length > 6 ? " +" + (over.length - 6) : "") : "0 leaks");
  }

  /* THE NEGATIVE HALF: the certifications NOT being repaired must be untouched,
   * and must still leak. If ISMS-IA came back clean, something wrote to it. */
  for (const code of ["ISMS-IA", "AIMS-IA"]) {
    const cons = await rest("concepts?select=slug,description&certification_id=eq." + idOf[code]);
    const over = cons.filter((c) => longestRun(c.description || "").best >= THRESHOLD).length;
    chk(code + " was NOT touched (still leaks, as expected)", over > 0, over + " concept description(s) over");
  }

  const failed = checks.filter((c) => !c.ok);
  console.log("");
  console.log("passed " + (checks.length - failed.length) + "   failed " + failed.length);
  console.log(failed.length ? "POST-CONDITIONS FAILED." : "Both blueprints are clean.");
  process.exitCode = failed.length ? 1 : 0;
}

/* ------------------------------------------------------- the bilingual queue */
if (QUEUE) {
  for (const p of plan.length ? plan : REPAIRS) {
    if (p.kind !== "task") continue;
    const taskRows = await rest("tasks?select=id&certification_id=eq." + idOf[p.cert] + "&code=eq." + p.key);
    if (!taskRows.length) continue;
    const tr = await rest("task_translations?select=language,knowledge,review_status,is_provisional&task_id=eq." + taskRows[0].id);
    for (const t of tr) {
      const cur = Array.isArray(t.knowledge) ? t.knowledge[p.index] : t.knowledge;
      queue.push({
        cert: p.cert, task: p.key, language: t.language, index: p.index,
        review_status: t.review_status, is_provisional: t.is_provisional,
        english_spans: p.spans.map((x) => ({ before: x.before, after: x.after })),
        translated_now: cur ?? null,
        note: p.note,
      });
    }
  }
  writeFileSync(QUEUE, JSON.stringify({
    purpose: "bilingual read. The index is English ISO text, so these rows score zero " +
             "before and after -- no automated check can tell a faithful re-translation " +
             "from a wrong one. Each entry gives the English change and the current " +
             "translated paragraph; the reader decides what the translation should say.",
    count: queue.length, entries: queue,
  }, null, 1) + "\n");
  console.log("");
  console.log("bilingual queue: " + queue.length + " row(s) -> " + QUEUE);
}
