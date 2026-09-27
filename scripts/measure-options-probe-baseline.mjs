#!/usr/bin/env node
/**
 * measure-options-probe-baseline.mjs - the KEY-PICK RATE of the options probe on the OLD bank,
 * beside pilot 2 and pilot 3.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2. It makes 40 model calls.
 *
 * ============ WHY THE BASELINE COMES FIRST ============
 *
 * The probe flagged 78 percent of pilot 3's survivors, against a 25 percent chance rate, and the
 * obvious reading is that the generator writes giveaway options. There is a second reading: a strong
 * model shown four options can often infer which one an examiner would key, from nothing but how
 * examiners write. Those two produce the SAME number on the pilots and DIFFERENT numbers on a bank
 * nobody has tuned against.
 *
 * So the same probe, unchanged, runs on the 40 AIMS-F items the director read in AUDIT-SAMPLE.md --
 * authored items from the old bank. If the old bank is also around 75 percent, the probe is partly
 * measuring the model and tuning against it would be fitting the generator to an instrument.
 *
 * ============ KEY-PICK RATE IS NOT THE FLAG RATE, AND THE DIFFERENCE IS THE POINT ============
 *
 *   key-pick   the probe named the key, cue or no cue. Chance is 25 percent.
 *   flag        it named the key AND gave a concrete cue. This is what the probe reports.
 *
 * The flag rate is deliberately narrower: one in four is luck, not evidence. The director asked for
 * the key-pick rate because it is the number that can be compared across banks -- a flag depends on
 * the model bothering to articulate a reason.
 *
 * ============ NO MODEL CALLS FOR THE PILOTS ============
 *
 * Their artifacts already carry the probe's verdict INCLUDING its `pick`, so their rates are computed
 * from what was recorded rather than re-run. Re-running would mix sampling noise into a comparison,
 * and this repository's own rule is that a delta measurement changes one thing.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { optionsPayload, assertOptionsOnly, OPTIONS_PROBE_SYSTEM, optionsProbeUser,
         optionsProbeVerdict, optionsProbeControls } from "./lib/options-probe.mjs";

for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, no flags");
  process.exitCode = 2; process.exit();
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const CERT = "AIMS-F";

for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found"); process.exitCode = 2; process.exit(); }
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens = 1200) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const data = await res.json();
      return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}
const parseJson = (s) => {
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* ---------------------------------------------------------------- controls first */
const ctl = optionsProbeControls();
if (ctl.fails && ctl.fails.length) {
  console.error("the options-probe controls fail; a rate measured with a broken probe is noise:");
  for (const f of ctl.fails) console.error("  " + f);
  process.exitCode = 2; process.exit();
}

/* ---------------------------------------------------------------- the old bank's 40 */
const sampleMd = readFileSync(join(ROOT, "AUDIT-SAMPLE.md"), "utf8");
const prefixes = [];
for (const line of sampleMd.split(/\r?\n/)) {
  const m = /^###\s+(\d+)\.\s+(\S+)\s+\S+\s+(\S+)\s+\S+\s+task\s+(\S+)\s+\S+\s+`([0-9a-f]{8})`/.exec(line)
         || /^###\s+(\d+)\.\s+(\S+).*task\s+(\S+).*`([0-9a-f]{8})`/.exec(line);
  if (!m) continue;
  const cert = m[2], prefix = m[m.length - 1];
  if (cert === CERT) prefixes.push({ n: Number(m[1]), prefix });
}
if (!prefixes.length) {
  console.error("no " + CERT + " rows parsed out of AUDIT-SAMPLE.md -- an empty parse is a fact about");
  console.error("the parser until something proves it could have matched.");
  process.exitCode = 2; process.exit();
}

const rate = (hits, n) => n ? (100 * hits / n).toFixed(0) + "%" : "n/a";

async function main() {
  console.log("");
  console.log("OPTIONS-PROBE KEY-PICK RATE  model " + MODEL);
  console.log("  probe controls: " + ctl.examined + " case(s), 0 fail");
  console.log("  " + CERT + " prefixes parsed from AUDIT-SAMPLE.md: " + prefixes.length);

  /* Resolve each 8-char prefix to exactly one live English row. */
  const live = await getAll(KEY,
    "quiz_questions?select=id,question_text,options,correct_answer,status,pool,language" +
    "&language=eq.en&certification_id=eq." +
    (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0].id);
  const resolved = [];
  const unresolved = [];
  for (const p of prefixes) {
    const hits = live.filter((r) => r.id.startsWith(p.prefix));
    if (hits.length === 1) resolved.push({ ...p, row: hits[0] });
    else unresolved.push({ ...p, n_hits: hits.length });
  }
  console.log("  resolved to exactly one live English row: " + resolved.length +
    (unresolved.length ? "   UNRESOLVED " + unresolved.length : ""));
  for (const u of unresolved.slice(0, 6)) console.log("      " + u.prefix + " -> " + u.n_hits + " row(s)");
  if (!resolved.length) { console.error("nothing resolved -- no verdict"); return 2; }

  /* ---------------------------------------------------------------- run the probe */
  const results = [];
  for (const r of resolved) {
    const opts = Array.isArray(r.row.options) ? r.row.options : [];
    const keys = Array.isArray(r.row.correct_answer) ? r.row.correct_answer : [];
    const keyIdx = opts.findIndex((o) => o && keys.includes(o.id));
    if (keyIdx < 0 || opts.length < 2) {
      results.push({ prefix: r.prefix, state: "could-not-run", reason: "no resolvable key letter" });
      continue;
    }
    const keyLabel = String.fromCharCode(65 + keyIdx);
    const item = { options: opts.map((o) => ({ text: o.text })) };
    const payload = optionsPayload(item);
    assertOptionsOnly(payload, item);
    let v;
    try {
      const raw = await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(payload), 1200);
      v = optionsProbeVerdict(parseJson(raw), keyLabel);
    } catch (e) {
      v = { state: "could-not-run", reason: String(e.message).slice(0, 120) };
    }
    results.push({ prefix: r.prefix, keyLabel, ...v, n_options: opts.length });
    process.stdout.write(".");
  }
  process.stdout.write("\n");

  const ran = results.filter((r) => r.state !== "could-not-run");
  const picked = ran.filter((r) => r.pick === r.keyLabel);
  const flagged = ran.filter((r) => r.state === "flag");

  /* ---------------------------------------------------------------- the pilots, from the artifacts */
  const fromArtifact = (file) => {
    const j = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
    const s = j.items.filter((r) => r.verdict === "survivor" && r.options_probe);
    const rows = s.map((r) => {
      const keyLabel = String.fromCharCode(65 + r.item.correct_index);
      return { keyLabel, pick: r.options_probe.pick, state: r.options_probe.state,
        cue_kind: r.options_probe.cue_kind };
    });
    return {
      n: rows.length,
      picked: rows.filter((x) => x.pick === x.keyLabel).length,
      flagged: rows.filter((x) => x.state === "flag").length,
      kinds: rows.filter((x) => x.state === "flag").reduce((a, x) => {
        a[x.cue_kind || "?"] = (a[x.cue_kind || "?"] || 0) + 1; return a; }, {}),
    };
  };
  const p2 = fromArtifact("PILOT-GROUNDED-AIMSF-2.json");
  const p3 = fromArtifact("PILOT-GROUNDED-AIMSF-3.json");
  const oldKinds = flagged.reduce((a, x) => { a[x.cue_kind || "?"] = (a[x.cue_kind || "?"] || 0) + 1; return a; }, {});

  console.log("");
  console.log("                       n    key-pick          flag rate");
  const row = (label, n, pk, fl) =>
    console.log("  " + label.padEnd(20) + String(n).padStart(2) + "   " +
      (pk + "/" + n + " " + rate(pk, n)).padEnd(16) + fl + "/" + n + " " + rate(fl, n));
  row("OLD BANK (authored)", ran.length, picked.length, flagged.length);
  row("pilot 2 (grounded)", p2.n, p2.picked, p2.flagged);
  row("pilot 3 (grounded)", p3.n, p3.picked, p3.flagged);
  console.log("  chance                    25%");
  console.log("");
  console.log("  cue kinds, old bank : " + JSON.stringify(oldKinds));
  console.log("  cue kinds, pilot 2  : " + JSON.stringify(p2.kinds));
  console.log("  cue kinds, pilot 3  : " + JSON.stringify(p3.kinds));
  if (results.length !== ran.length) {
    console.log("  could-not-run: " + (results.length - ran.length) + " (reported, not folded into either rate)");
  }

  console.log("");
  console.log("  READ THE NUMBER BEFORE ACTING ON IT. A high key-pick rate on the OLD bank means the");
  console.log("  probe is partly measuring the model rather than the items, and tuning the generator");
  console.log("  against it would be fitting the writer to an instrument. A low one means the");
  console.log("  generated options really do give themselves away.");

  writeFileSync(join(ROOT, "OPTIONS-PROBE-BASELINE.json"),
    JSON.stringify({ measured: new Date().toISOString().slice(0, 10), model: MODEL,
      old_bank: { n: ran.length, key_pick: picked.length, flag: flagged.length, cue_kinds: oldKinds,
        unresolved: unresolved.length, could_not_run: results.length - ran.length },
      pilot_2: p2, pilot_3: p3,
      per_item: results }, null, 1) + "\n", "utf8");
  console.log("");
  console.log("wrote OPTIONS-PROBE-BASELINE.json");
  return 0;
}
process.exitCode = await main();
