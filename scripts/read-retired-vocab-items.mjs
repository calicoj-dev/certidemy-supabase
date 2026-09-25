#!/usr/bin/env node
/**
 * read-retired-vocab-items.mjs - dump every bank item carrying retired Scrum
 * vocabulary, in full, for a human judgement on `retired_vocabulary_intent`.
 *
 * READ-ONLY. Flags: --cert, --pool, --pattern, --json. Unknown flags exit 2.
 *
 * ============ WHY DUMPING IS THE POINT ============
 *
 * `verify-cert`'s items.vocabulary check prints a count and a placement tally.
 * That is enough to prompt a read and is not enough to make the judgement --
 * the distinction its own comment draws: "the heuristic is a prompt to read;
 * the flag is the answer."
 *
 * The judgement needs the WHOLE item -- stem, every option, which is the key,
 * and the explanation -- because the same term means opposite things in
 * different places. In a key it asserts pre-2020 vocabulary as correct. In a
 * distractor it may be the misconception UNDER TEST, and sweeping it destroys
 * the discrimination.
 *
 * ============ IT PAGES, AND IT ASSERTS THAT IT PAGED ============
 *
 * The first version of this script fetched `&limit=5000` per certification and
 * reported a confident set. SM-AI-I holds more rows than that, so the largest
 * certification in the corpus was SILENTLY TRUNCATED -- and the tell was that a
 * row known to be `retired_vocabulary_intent = 'quoted'` came back reported as
 * 'none' in the summary while being 'quoted' when fetched by id.
 *
 * That is the dropped-read family CLAUDE.md is largely about: the query
 * succeeded, the number looked plausible, and the missing rows were invisible.
 * So this pages to exhaustion and then CHECKS ITS OWN WORK against a
 * server-side `count=exact` -- if the two disagree it aborts rather than
 * reporting.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--cert", "--pool", "--pattern", "--json", "--quiet"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("READ-ONLY; it writes nothing but --json. Known: --cert, --pool, --pattern, --json, --quiet.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const CERT = arg("cert", "");
const POOL = arg("pool", "secure");
const JSON_OUT = arg("json", "");
const QUIET = process.argv.includes("--quiet");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SVC) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: SVC, Authorization: "Bearer " + SVC };

async function raw(path, extra) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(REST + path, { headers: { ...H, ...(extra ?? {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error(r.status + " " + t.slice(0, 200));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
const get = async (p) => (await raw(p)).body;

/** Page to exhaustion, then prove the page count against a server-side total. */
async function all(path) {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { body } = await raw(path + "&order=id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const { range } = await raw(path + "&limit=1", { Prefer: "count=exact" });
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (Number.isFinite(total) && total !== out.length) {
    throw new Error("PAGING INCOMPLETE: fetched " + out.length + ", server says " + total + " for " + path);
  }
  return { rows: out, total };
}

/* The retired-vocabulary patterns. `servant-leader` is DELIBERATELY WIDER here
 * than in lib/item-translation.mjs -- which does not contain it at all, see the
 * report -- because this script selects what a human reads. A false positive
 * costs a paragraph of reading; a false negative costs an unread item.
 *
 * A HYPHEN IS A WORD BOUNDARY, which is the boundary bug CLAUDE.md records
 * against the vocabulary patterns: `\b` does not stop `equipo de desarrollo`
 * matching inside `sub-equipo de desarrollo`. */
/* EVERY TRANSLATED PATTERN CARRIES THE ENGLISH FORM TOO. This is rule 3 of
 * READ-FAILURE-AUDIT section 7b -- "per-language patterns blind to an
 * untranslated English term sitting in a Spanish row" -- and the first version
 * of this script reproduced it exactly. The pt-BR rows of three drift items
 * read `o Scrum Master 'serve a equipe como um servant-leader'`: the label is
 * DELIBERATELY left in English, because an item testing recognition of a
 * retired label cannot translate the label. A Portuguese-only pattern reported
 * those three groups as having no pt-BR sibling, which is a trilingual gap that
 * does not exist. */
const EN_SERVANT = String.raw`servant[- ]?lead`;
const PATTERNS = {
  "servant-leader": {
    en: new RegExp(EN_SERVANT, "i"),
    "es-419": new RegExp(String.raw`l[ií]der[- ]servidor|liderazgo[- ]de[- ]servicio|liderazgo[- ]servidor|` + EN_SERVANT, "i"),
    "pt-BR": new RegExp(String.raw`l[ií]der[- ]servidor|lideran[çc]a[- ]servidora|servidora|` + EN_SERVANT, "i"),
  },
  "self-organizing": {
    en: /self[- ]?organiz/i,
    "es-419": /autoorganiz\w*|auto-organiz\w*|self[- ]?organiz/i,
    "pt-BR": /auto-?organiz\w*|self[- ]?organiz/i,
  },
  "development-team": {
    en: /(?<![\w-])development team\b/i,
    "es-419": /(?<![\w-])(equipo de desarrollo|development team)\b/i,
    "pt-BR": /(?<![\w-])((time|equipe) de desenvolvimento|development team)\b/i,
  },
};
const FAMILY = arg("pattern", "servant-leader");
const RETIRED = PATTERNS[FAMILY];
if (!RETIRED) {
  console.error("Unknown --pattern " + FAMILY + ". Known: " + Object.keys(PATTERNS).join(", "));
  process.exit(2);
}

const certs = await get("/certifications?select=id,code" + (CERT ? "&code=eq." + CERT : ""));
const byId = new Map(certs.map((c) => [c.id, c.code]));

const sel = "/quiz_questions?select=id,certification_id,question_group_id,pool,language,status," +
  "question_text,options,correct_answer,explanation,retired_vocabulary_intent,is_exam_scope,task_id" +
  (POOL === "all" ? "" : "&pool=eq." + POOL);
const { rows, total } = await all(sel);

const surfaces = (q) =>
  [q.question_text, q.explanation, ...(Array.isArray(q.options) ? q.options.map((o) => o?.text ?? "") : [])]
    .filter(Boolean).join("  ");

const scoped = CERT ? rows.filter((q) => byId.get(q.certification_id) === CERT) : rows;
const hits = scoped.filter((q) => { const re = RETIRED[q.language]; return re && re.test(surfaces(q)); });

const keyIds = (q) => new Set([].concat(q.correct_answer || []));
const placement = (q) => {
  const re = RETIRED[q.language];
  const at = [];
  const ids = keyIds(q);
  const opts = Array.isArray(q.options) ? q.options : [];
  if (re.test(q.question_text || "")) at.push("STEM");
  if (opts.filter((o) => ids.has(o.id)).some((o) => re.test(o.text || ""))) at.push("KEY");
  if (opts.filter((o) => !ids.has(o.id)).some((o) => re.test(o.text || ""))) at.push("DISTRACTOR");
  if (re.test(q.explanation || "")) at.push("EXPLANATION");
  return at;
};

console.log("");
console.log("RETIRED VOCABULARY: " + FAMILY + "   pool=" + POOL + (CERT ? "   cert=" + CERT : ""));
console.log("  paged " + rows.length + " row(s); server count=exact agreed at " + total);
console.log("  hits " + hits.length +
  "   intent none " + hits.filter((q) => q.retired_vocabulary_intent === "none").length +
  "   intent quoted " + hits.filter((q) => q.retired_vocabulary_intent === "quoted").length);
console.log("");

/* A single count has nothing to disagree with, so both axes are printed. */
const census = new Map();
for (const q of hits) {
  const k = byId.get(q.certification_id) + " / " + q.language;
  census.set(k, (census.get(k) ?? 0) + 1);
}
console.log("CENSUS");
for (const [k, v] of [...census.entries()].sort()) console.log("    " + k.padEnd(24) + v);
console.log("");

const groups = new Map();
for (const q of hits) {
  const k = q.question_group_id ?? "UNGROUPED:" + q.id;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(q);
}
console.log("  " + groups.size + " question group(s)");

/* THE EXEMPTION IS READ PER GROUP, so a group whose rows disagree is a state
 * the column cannot express. Surfaced rather than silently normalised. */
const split = [...groups.entries()].filter(([, qs]) =>
  new Set(qs.map((q) => q.retired_vocabulary_intent)).size > 1);
if (split.length) {
  console.log("");
  console.log("  " + split.length + " group(s) whose rows DISAGREE on intent:");
  for (const [gid, qs] of split) {
    console.log("    " + gid + "  " + qs.map((q) => q.language + "=" + q.retired_vocabulary_intent).join(" "));
  }
}
console.log("");

if (!QUIET) {
  let n = 0;
  for (const [gid, qs] of [...groups.entries()].sort()) {
    n++;
    const en = qs.find((q) => q.language === "en") ?? qs[0];
    console.log("=".repeat(78));
    console.log("GROUP " + n + "  " + gid);
    console.log("  cert " + byId.get(en.certification_id) + "   task " + (en.task_id ?? "-") +
      "   exam_scope " + en.is_exam_scope + "   status " + en.status);
    console.log("  languages present: " + qs.map((q) => q.language + "[" + placement(q).join("+") + "]" +
      "{" + q.retired_vocabulary_intent + "}").join("  "));
    for (const q of qs.sort((a, b) => a.language.localeCompare(b.language))) {
      console.log("");
      console.log("  --- " + q.language + "  " + q.id);
      console.log("  STEM: " + (q.question_text || "").replace(/\s+/g, " "));
      const ids = keyIds(q);
      for (const o of Array.isArray(q.options) ? q.options : []) {
        console.log("   " + (ids.has(o.id) ? "*KEY*" : "     ") + " " + String(o.text || "").replace(/\s+/g, " "));
      }
      console.log("  EXPL: " + (q.explanation || "").replace(/\s+/g, " "));
    }
    console.log("");
  }
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(
    [...groups.entries()].sort().map(([gid, qs]) => ({
      group_id: gid,
      certification: byId.get(qs[0].certification_id),
      task_id: qs[0].task_id,
      rows: qs.map((q) => ({
        id: q.id, language: q.language, intent: q.retired_vocabulary_intent,
        placement: placement(q), stem: q.question_text,
      })),
    })), null, 1) + "\n");
  console.log("wrote " + JSON_OUT);
}
