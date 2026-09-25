#!/usr/bin/env node
/**
 * stamp-proved-provenance.mjs -- give `en_content_hash` a second writer, one that
 * PROVES what it stamps.
 *
 * WRITES. `--apply`; dry by default. `--slug <s>` narrows. Unknown flags exit 2.
 *
 * ============ WHY A RE-STAMP FROM CURRENT CONTENT IS THE DEFECT ==============
 *
 * `en_content_hash` records the English a translation was made from. The
 * provenance arm of `mcp.lesson_withholding_reason` compares it against the live
 * English and withholds the row when they differ.
 *
 * The tempting repair is `en_content_hash = translation_hash(live English)`. That
 * makes every row fresh by construction and arms the gate against nothing --
 * exactly the defect `check-hash-writers.mjs` exists to prevent, and the reason
 * every clearance script in this repository was audited. A stamp is legitimate
 * only at the moment the writer can PROVE the value.
 *
 * ============ THE PROOF: REPLAY THE DECLARED EDITS BACKWARD ==================
 *
 * The writer holds a list of every English edit made since 367 stamped the
 * column, each one a reviewed script in git. Reverse them over the LIVE English
 * and hash the result:
 *
 *   translation_hash(reverse(live English)) == stored en_content_hash
 *
 * If that holds, the English moved by EXACTLY those edits and nothing else. A
 * hash equality over 12,000 characters is not a sampling argument -- an
 * undeclared change anywhere in the body breaks it.
 *
 * THAT ALONE IS NOT ENOUGH. The English could have moved, by declared edits, in a
 * paragraph this batch never retranslated -- in which case the translation does
 * NOT track the current English there and the row must stay dark. So the second
 * condition: every reversed edit must fall inside a block THIS BATCH WROTE in
 * THIS LANGUAGE, read out of BATCH1-FINAL.json.
 *
 * Both hold -> stamp with basis `proved`, one statement per row, read back.
 * Either fails -> REFUSE THAT ROW AND NAME IT. An undeclared English change is a
 * finding, not an obstacle.
 *
 * ============ THE CONTROL ============
 *
 * A proof nobody has watched fail is not a proof. Before anything is written the
 * script re-runs its own verification against a replayed English with ONE BYTE
 * CHANGED, and refuses to continue unless that is rejected. The tamper is in
 * memory; nothing is sent.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DECLARED_ENGLISH_EDITS, editsFor, reverseDeclaredEdits, declaredEditControls }
  from "./lib/declared-english-edits.mjs";

const KNOWN = new Set(["--apply", "--slug"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
  }
}
const APPLY = argv.includes("--apply");
const si = argv.indexOf("--slug");
const ONLY = si >= 0 && argv[si + 1] && !argv[si + 1].startsWith("--") ? argv[si + 1] : "";

const broken = declaredEditControls();
if (broken.length) {
  console.error("DECLARED-EDIT FIXTURES FAILED: " + broken.join("; "));
  console.error("No verdict printed: a replay that does nothing would vouch for any English.");
  process.exit(2);
}

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
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw last;
}
/* The gate's own function, server side, so there is no second implementation. */
const trHash = (text) => rest("rpc/translation_hash", { method: "POST", body: JSON.stringify({ p_a: text }) });

const spec = JSON.parse(readFileSync(join(ROOT, "BATCH1-FINAL.json"), "utf8"));
const BATCH = "cda6698a-ade7-49dd-9d61-01e5d538bb88";

/* The candidate set: translated rows of every lesson carrying a declared edit. */
const slugs = [...new Set(DECLARED_ENGLISH_EDITS.map((e) => e.slug))].filter((s) => !ONLY || s === ONLY);
const rows = await rest("lessons?select=id,slug,language,lesson_group_id,content_md," +
  "en_content_hash,en_content_hash_basis,translation_batch_id&slug=in.(" + slugs.join(",") + ")&order=slug,language");
const enOf = new Map(rows.filter((r) => r.language === "en").map((r) => [r.lesson_group_id, r]));
const targets = rows.filter((r) => r.language !== "en");

/**
 * The whole proof for one row. `tamperAt` flips one byte of the replayed English
 * so the control can watch this refuse.
 */
async function verify(row, en, tamperAt) {
  const back = reverseDeclaredEdits(row.slug, en.content_md);
  if (!back.ok) return { ok: false, why: "backward replay refused -- " + back.why };
  if (!back.applied.length) return { ok: false, why: "no declared edit applies to this lesson" };

  let candidate = back.text;
  if (tamperAt !== undefined) {
    const i = Math.min(tamperAt, candidate.length - 1);
    const ch = candidate[i] === "x" ? "y" : "x";
    candidate = candidate.slice(0, i) + ch + candidate.slice(i + 1);
  }

  const computed = await trHash(candidate);
  if (typeof computed !== "string" || !/^[0-9a-f]{8}$/.test(computed)) {
    return { ok: false, why: "translation_hash returned " + JSON.stringify(computed) };
  }
  if (!row.en_content_hash) return { ok: false, why: "no stored en_content_hash to prove against" };
  if (computed !== row.en_content_hash) {
    return { ok: false, computed,
      why: "reversed English hashes to " + computed + ", stored stamp is " + row.en_content_hash +
           " -- an English change outside the declared list" };
  }

  /* SECOND CONDITION: every reversed edit must sit inside a block this batch
   * rewrote in THIS language. A declared edit in a paragraph nobody
   * retranslated means the translation does not track the current English
   * there, and the hash equality above cannot see that. */
  const written = spec.rows.filter((x) => x.slug === row.slug && x.language === row.language);
  if (!written.length) return { ok: false, why: "this batch wrote nothing for this row" };
  const outside = back.applied.filter((e) => !written.some((w) => w.english_source && w.english_source.includes(e.to)));
  if (outside.length) {
    return { ok: false,
      why: outside.length + " declared edit(s) fall outside every block this batch wrote (" +
           outside.map((e) => e.by).join(", ") + ")" };
  }
  return { ok: true, edits: back.applied.length };
}

console.log("");
console.log("PROVED PROVENANCE -- stamp only what the backward replay proves");
console.log("  declared English edits since 367: " + DECLARED_ENGLISH_EDITS.length);
console.log("DENOMINATOR: " + targets.length + " translated row(s) examined");
console.log("");

/* ---- POSITIVE CONTROL, before anything is written ---- */
{
  const probe = targets.find((r) => editsFor(r.slug).length);
  if (!probe) { console.error("CONTROL: no row with a declared edit; cannot prove the proof."); process.exit(2); }
  const en = enOf.get(probe.lesson_group_id);
  const clean = await verify(probe, en, undefined);
  const dirty = await verify(probe, en, 100);
  if (!clean.ok) {
    console.error("CONTROL FAILED: the untampered replay did not verify on " + probe.slug + " -- " + clean.why);
    console.error("  A proof that cannot pass on a known-good row is not a proof.");
    process.exit(2);
  }
  if (dirty.ok) {
    console.error("CONTROL FAILED: a replayed English with ONE BYTE CHANGED still verified.");
    console.error("  No verdict printed: a proof nobody has watched fail is not a proof.");
    process.exit(2);
  }
  console.log("  control: " + probe.slug + " verifies clean, and REFUSES with one byte changed");
  console.log("           (" + dirty.why.slice(0, 96) + ")");
  console.log("");
}

const staged = [], refused = [];
for (const r of targets) {
  const en = enOf.get(r.lesson_group_id);
  if (!en) { refused.push({ r, why: "no English sibling" }); continue; }
  const v = await verify(r, en, undefined);
  if (!v.ok) { refused.push({ r, why: v.why }); continue; }
  staged.push({ r, en, edits: v.edits });
}

for (const s of staged) {
  console.log("  PROVED   " + (s.r.slug + " " + s.r.language).padEnd(50) +
    s.edits + " declared edit(s) reversed, hash matches, all inside written blocks");
}
for (const x of refused) {
  console.log("  REFUSED  " + (x.r.slug + " " + x.r.language).padEnd(50) + x.why);
}
console.log("");
console.log("  proved " + staged.length + ", refused " + refused.length);

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(refused.length ? 1 : 0);
}

console.log("");
let fail = 0;
for (const s of staged) {
  const next = await trHash(s.en.content_md);
  if (typeof next !== "string" || !/^[0-9a-f]{8}$/.test(next)) {
    console.log("  FAIL  " + s.r.slug + " " + s.r.language + ": live hash unreadable"); fail++; continue;
  }
  /* ONE STATEMENT PER ROW, and the basis travels with the hash -- a CHECK
   * constraint requires it, and a stamp whose job is unlabelled is the defect
   * 367 was corrected for. */
  const back = await rest("lessons?id=eq." + s.r.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ en_content_hash: next, en_content_hash_basis: "proved" }),
  });
  const after = back[0];
  const ok = after.en_content_hash === next && after.en_content_hash_basis === "proved";
  if (!ok) fail++;
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + (s.r.slug + " " + s.r.language).padEnd(50) +
    "en_content_hash " + s.r.en_content_hash + " -> " + after.en_content_hash + "  basis " + after.en_content_hash_basis);
}
console.log("");
if (fail) { console.log(fail + " row(s) did not read back."); process.exitCode = 1; }

/* Through the gate, never off the column. */
let serving = 0;
const still = [];
for (const s of staged) {
  const ok = await rest("rpc/lesson_body_is_servable", { method: "POST", body: JSON.stringify({ p_lesson_id: s.r.id }) });
  if (ok) serving++; else still.push(s.r.slug + " " + s.r.language);
}
console.log("  serving now: " + serving + " of " + staged.length);
if (still.length) for (const t of still) console.log("      still held: " + t);
if (refused.length) {
  console.log("");
  console.log("  " + refused.length + " row(s) refused and left withheld. Each is a finding above.");
}
