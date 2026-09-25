#!/usr/bin/env node
/**
 * checkpoint-fields.mjs -- a `::checkpoint` block is JSON, so its fields pair by
 * ID and not by position.
 *
 * ============ WHY THE BLOCK IS THE WRONG GRAIN ============
 *
 * A checkpoint block is one markdown block and four to six QUESTIONS, each with
 * a stem, four options and an explanation -- thirty or so independently
 * translated fields. Diffing and gating at block grain has two costs, and the
 * second is the one that hid real defects:
 *
 *   REPLACEMENT. Rewriting one option rewrites the whole block, so a change to
 *   q4 option c silently carries whatever else the model emitted for q1 to q6.
 *   Nobody reads thirty fields to approve one.
 *
 *   MEASUREMENT. Every gate comparing English against translation was comparing
 *   4,000 characters against 4,000 characters. A modal inserted into one
 *   twelve-word option is invisible when the haystack also holds five other
 *   questions that legitimately carry modals -- G3 asks "is there a modal here
 *   with none in the aligned English", and at block grain the aligned English
 *   always has one somewhere. That is the dilution this file removes: 01-03 q4c
 *   and 05-02 q4 both scored clean at block grain and both are real.
 *
 * ============ ID PAIRING, NEVER ORDINAL ============
 *
 * Questions carry `id` and options carry `id`. Pairing on those is exact, and it
 * survives a reordering or a dropped option -- which ordinal pairing does not,
 * and which would silently compare q3 against q4 and report the difference as a
 * defect. A field present on one side and absent on the other is reported as
 * unpaired, never quietly skipped, because a dropped option is the defect most
 * worth seeing.
 */

/** The fenced JSON payload of a checkpoint block, or null if it is not one. */
export function parseCheckpoint(block) {
  if (typeof block !== "string") return null;
  const m = /^::checkpoint[^\n]*\n/.exec(block);
  if (!m) return null;
  const rest = block.slice(m[0].length);
  const start = rest.indexOf("[");
  if (start < 0) return null;
  /* The payload ends at the last `]`; a trailing fence may follow it. */
  const end = rest.lastIndexOf("]");
  if (end <= start) return null;
  try {
    const items = JSON.parse(rest.slice(start, end + 1));
    if (!Array.isArray(items)) return null;
    return { header: m[0], prefix: rest.slice(0, start), items, suffix: rest.slice(end + 1) };
  } catch {
    return null;
  }
}

/** Flat, id-addressed text fields of a checkpoint block.
 *
 *  Only fields a human reads are returned. `concept_slugs`, `bloom_level`,
 *  `difficulty` and `correct` are machine fields: they are NOT translated, and
 *  including them would make every gate compare an English slug against itself
 *  and report a false carried title. They are checked for EQUALITY instead, by
 *  checkpointMachine below, which is a different question. */
export function checkpointFields(block) {
  const p = parseCheckpoint(block);
  if (!p) return null;
  const out = [];
  for (const q of p.items) {
    const qid = q && q.id ? String(q.id) : "?";
    if (typeof q.question === "string") out.push({ path: qid + ".question", text: q.question });
    if (Array.isArray(q.options)) {
      for (const o of q.options) {
        if (o && typeof o.text === "string") {
          out.push({ path: qid + ".option." + (o.id === undefined ? "?" : o.id), text: o.text });
        }
      }
    }
    if (typeof q.explanation === "string") out.push({ path: qid + ".explanation", text: q.explanation });
  }
  return out;
}

/** Machine fields, which must be IDENTICAL across languages. A translation that
 *  changes `correct`, `concept_slugs`, `bloom_level` or `difficulty` has changed
 *  what the question TESTS, which no prose gate would ever report. */
export function checkpointMachine(block) {
  const p = parseCheckpoint(block);
  if (!p) return null;
  const out = new Map();
  for (const q of p.items) {
    const qid = q && q.id ? String(q.id) : "?";
    for (const k of ["correct", "type", "bloom_level", "difficulty", "concept_slugs"]) {
      if (q[k] !== undefined) out.set(qid + "." + k, JSON.stringify(q[k]));
    }
    if (Array.isArray(q.options)) {
      out.set(qid + ".option_ids", JSON.stringify(q.options.map((o) => o && o.id)));
    }
  }
  return out;
}

/** Field-by-field diff of two checkpoint blocks, paired by id.
 *
 *  Returns null when either side is not a parseable checkpoint -- a THIRD STATE,
 *  so a caller cannot read "no fields changed" off a block that could not be
 *  read at all. */
export function diffCheckpointFields(fromBlock, toBlock) {
  const a = checkpointFields(fromBlock), b = checkpointFields(toBlock);
  if (!a || !b) return null;
  const am = new Map(a.map((f) => [f.path, f.text]));
  const bm = new Map(b.map((f) => [f.path, f.text]));
  const paths = [...new Set([...am.keys(), ...bm.keys()])];
  const changed = [], same = [], onlyFrom = [], onlyTo = [];
  for (const p of paths) {
    if (!bm.has(p)) { onlyFrom.push(p); continue; }
    if (!am.has(p)) { onlyTo.push(p); continue; }
    (am.get(p) === bm.get(p) ? same : changed).push({ path: p, from: am.get(p), to: bm.get(p) });
  }
  const ma = checkpointMachine(fromBlock), mb = checkpointMachine(toBlock);
  const machineDrift = [];
  for (const [k, v] of ma) if (mb.has(k) && mb.get(k) !== v) machineDrift.push({ path: k, from: v, to: mb.get(k) });
  return { changed, same, onlyFrom, onlyTo, machineDrift, total: paths.length };
}

/** Pair an English checkpoint block against a translated one, by id.
 *
 *  This is what lets a gate ask its question of TWELVE WORDS instead of four
 *  thousand characters. Unpaired fields are returned separately rather than
 *  dropped. */
export function pairCheckpointFields(enBlock, trBlock) {
  const en = checkpointFields(enBlock), tr = checkpointFields(trBlock);
  if (!en || !tr) return null;
  const em = new Map(en.map((f) => [f.path, f.text]));
  const tm = new Map(tr.map((f) => [f.path, f.text]));
  const pairs = [], unpaired = [];
  for (const [p, t] of tm) {
    if (em.has(p)) pairs.push({ path: p, en: em.get(p), tr: t });
    else unpaired.push({ path: p, side: "tr-only" });
  }
  for (const p of em.keys()) if (!tm.has(p)) unpaired.push({ path: p, side: "en-only" });
  return { pairs, unpaired };
}

/** Rebuild a checkpoint block with a single field replaced, leaving every other
 *  byte -- key order, spacing, machine fields -- exactly as it was.
 *
 *  A structural rebuild through JSON.stringify would reformat the whole block,
 *  so the diff of an applied edit would be the entire checkpoint and nobody
 *  could see what moved. This replaces the JSON-ENCODED string in place instead,
 *  and asserts the encoded old value occurs exactly once. */
export function replaceCheckpointField(block, path, nextText) {
  const fields = checkpointFields(block);
  if (!fields) return { ok: false, why: "not a parseable checkpoint block" };
  const f = fields.find((x) => x.path === path);
  if (!f) return { ok: false, why: "no such field: " + path };
  if (f.text === nextText) return { ok: false, why: "replacement is identical to the current text" };
  const oldEnc = JSON.stringify(f.text), newEnc = JSON.stringify(nextText);
  const n = block.split(oldEnc).length - 1;
  if (n !== 1) return { ok: false, why: "encoded field occurs " + n + " time(s), must be 1" };
  const next = block.replace(oldEnc, newEnc);
  const after = checkpointFields(next);
  if (!after) return { ok: false, why: "replacement did not re-parse as a checkpoint" };
  const got = after.find((x) => x.path === path);
  if (!got || got.text !== nextText) return { ok: false, why: "re-parse did not return the new text" };
  /* Nothing else moved: every OTHER field is byte-identical. */
  const before = new Map(fields.map((x) => [x.path, x.text]));
  for (const x of after) {
    if (x.path !== path && before.get(x.path) !== x.text) {
      return { ok: false, why: "collateral change at " + x.path };
    }
  }
  return { ok: true, block: next };
}

/** Fixtures. A field grain that pairs the WRONG fields is worse than block
 *  grain, so every property here is asserted rather than trusted. */
export function checkpointControls() {
  const bad = [];
  const mk = (items) => "::checkpoint\n" + JSON.stringify(items, null, 2) + "\n";
  const enItems = [
    { id: "q1", question: "What is the scope?", type: "single_choice",
      options: [{ id: "a", text: "The boundary" }, { id: "b", text: "The extent" }],
      correct: ["a"], explanation: "Records are retained.", bloom_level: "2_understand" },
  ];
  const trItems = [
    { id: "q1", question: "Cual es el alcance?", type: "single_choice",
      options: [{ id: "a", text: "El limite" }, { id: "b", text: "La extension" }],
      correct: ["a"], explanation: "Los registros se conservan.", bloom_level: "2_understand" },
  ];
  const en = mk(enItems), tr = mk(trItems);

  const f = checkpointFields(en);
  if (!f || f.length !== 4) bad.push("checkpointFields returned " + (f ? f.length : "null") + ", expected 4");
  if (f && f[1].path !== "q1.option.a") bad.push("option path is " + f[1].path);

  const p = pairCheckpointFields(en, tr);
  if (!p || p.pairs.length !== 4) bad.push("pairing returned " + (p ? p.pairs.length : "null") + " pairs");
  if (p && p.unpaired.length) bad.push("unexpected unpaired fields");

  /* A REORDERED option must still pair by id, not by position. */
  const trSwapped = mk([{ ...trItems[0],
    options: [{ id: "b", text: "La extension" }, { id: "a", text: "El limite" }] }]);
  const ps = pairCheckpointFields(en, trSwapped);
  const pa = ps && ps.pairs.find((x) => x.path === "q1.option.a");
  if (!pa || pa.en !== "The boundary" || pa.tr !== "El limite") {
    bad.push("reordered options did not pair by id");
  }

  /* A DROPPED option is reported, never silently skipped. */
  const trShort = mk([{ ...trItems[0], options: [{ id: "a", text: "El limite" }] }]);
  const pd = pairCheckpointFields(en, trShort);
  if (!pd || !pd.unpaired.some((u) => u.path === "q1.option.b" && u.side === "en-only")) {
    bad.push("a dropped option was not reported as unpaired");
  }

  /* MACHINE DRIFT: a changed `correct` is caught, and is not a prose field. */
  const trWrongKey = mk([{ ...trItems[0], correct: ["b"] }]);
  const d = diffCheckpointFields(tr, trWrongKey);
  if (!d) bad.push("diff of two real checkpoints returned null");
  else {
    if (!d.machineDrift.some((x) => x.path === "q1.correct")) {
      bad.push("a changed `correct` was not reported as machine drift");
    }
    if (d.changed.length) bad.push("a machine-only change was reported as a prose change");
  }

  /* IN-PLACE REPLACEMENT leaves every other byte alone. */
  const r = replaceCheckpointField(tr, "q1.option.b", "El grado");
  if (!r.ok) bad.push("replaceCheckpointField failed: " + r.why);
  else {
    const fr = checkpointFields(r.block);
    if (fr.find((x) => x.path === "q1.option.b").text !== "El grado") bad.push("replacement text not present");
    if (fr.find((x) => x.path === "q1.option.a").text !== "El limite") bad.push("replacement moved a sibling");
    if (r.block.length !== tr.length + ("El grado".length - "La extension".length)) {
      bad.push("replacement changed more bytes than the field itself");
    }
  }
  /* And it REFUSES rather than guessing when the field is not there. */
  if (replaceCheckpointField(tr, "q9.option.z", "x").ok) bad.push("replacing a missing field succeeded");

  /* NOT A CHECKPOINT is null, a third state, never an empty field list. */
  if (checkpointFields("Just a paragraph.") !== null) bad.push("a non-checkpoint block did not return null");
  if (diffCheckpointFields("a", "b") !== null) bad.push("diff of non-checkpoints did not return null");
  return bad;
}
