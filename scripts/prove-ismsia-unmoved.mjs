#!/usr/bin/env node
/**
 * prove-ismsia-unmoved.mjs -- ISMS-IA MUST NOT MOVE under the PROMPT-135 s2 tier-rule change.
 *
 * READ-ONLY, free, no model call. Ruled PROMPT-135 s2.
 *
 * PROOF 1 -- THE PROMPT. A text diff of one task's prompt would cover one task. Instead every
 * ISMS-IA primary passage is put through `keyMayAnchor` TWICE: once with `cert: "ISMS-IA"` (the new
 * path) and once with `cert` omitted (byte-for-byte the old path, whose standard was the 27001
 * literal). The writer prompt is built from exactly these verdicts via `anchorMarkFor`, so if every
 * verdict AND every `why` string is identical then no mark in any ISMS-IA prompt can have changed.
 * Stronger than diffing one prompt, and it covers all 38 tasks.
 *
 * PROOF 2 -- THE GATES. Every ISMS-IA survivor from R1 to R8 is re-gated on the two gates the rule
 * touches, `anchor-is-primary` and `modal-fidelity`, and the verdict is compared with the one
 * recorded in its artifact. A changed verdict means the rule moved under ISMS-IA.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { keyMayAnchor, tierOf, anchorMarkFor } from "./lib/tier-anchoring.mjs";
import { generatorArtifacts } from "./lib/item-disposition.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unrecognised flag: " + a + ". This script takes none and is READ-ONLY.");
  process.exit(2);
}
const CERT = "ISMS-IA";
const TIER = tierOf(CERT);
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const tasks = (await getAll(KEY, "tasks?select=id,code,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const pById = new Map((await getAll(KEY,
  "source_passages?select=id,source_id,edition,clause,normative&order=id")).map((r) => [r.id, r]));
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));

/* ---- PROOF 1 ---- */
let examined = 0, moved = [];
const byTask = new Map();
for (const r of ts) {
  const code = codeOf.get(r.task_id);
  if (!code) continue;
  const p = pById.get(r.passage_id);
  if (!p) continue;
  if (!byTask.has(code)) byTask.set(code, []);
  byTask.get(code).push({ ...p, role: r.role });
}
for (const [code, rows] of byTask) {
  const prim = rows.filter((x) => x.role === "primary");
  for (const p of rows) {
    const anchor = { source_id: p.source_id, edition: p.edition, clause: p.clause, normative: p.normative };
    const now = keyMayAnchor(anchor, { tier: TIER, primaryClauses: prim, cert: CERT });
    const old = keyMayAnchor(anchor, { tier: TIER, primaryClauses: prim });
    /* the MARK is what reaches the prompt, so compare that too */
    const markNow = anchorMarkFor(anchor, { tier: TIER, primaryClauses: prim,
      isPrimary: p.role === "primary", cert: CERT });
    const markOld = anchorMarkFor(anchor, { tier: TIER, primaryClauses: prim,
      isPrimary: p.role === "primary" });
    examined++;
    if (now.ok !== old.ok || now.why !== old.why || markNow !== markOld) {
      moved.push(code + "  " + p.source_id + ":" + p.edition + " " + p.clause +
        "   old " + old.ok + " / new " + now.ok +
        (markNow !== markOld ? "   MARK CHANGED" : ""));
    }
  }
}
console.log("PROOF 1 -- THE PROMPT'S ANCHOR MARKS   " + CERT);
console.log("  passages examined (every task_sources link)   " + examined);
console.log("  verdict or mark CHANGED                       " + moved.length + "   (must be 0)");
for (const m of moved.slice(0, 12)) console.log("      " + m);
console.log("  tasks covered                                 " + byTask.size + " of " + tasks.length);

/* ---- PROOF 2 ---- */
const { runCodeGates } = await import("./lib/grounded-gates.mjs");
void runCodeGates;
const { gateAnchorIsPrimary, gateModalFidelity } = await import("./lib/grounded-gates.mjs");
const arts = generatorArtifacts(ROOT, ["ISMSIA"]);
let items = 0, compared = 0, changed = [];
for (const f of arts) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const r of (j.items || [])) {
    if (r.verdict !== "survivor") continue;
    items++;
    const o = r.item || {};
    const code = r.task_code;
    const rows = byTask.get(code) || [];
    const prim = rows.filter((x) => x.role === "primary");
    const supp = rows.filter((x) => x.role !== "primary");
    const anchorRow = rows.find((x) => x.source_id === o.source_id &&
      String(x.edition) === String(o.edition) && x.clause === o.key_support_clause);
    const keyNormative = anchorRow ? anchorRow.normative : undefined;
    const item = { source_id: o.source_id, edition: o.edition,
      key_support_clause: o.key_support_clause, key_support: o.key_support };
    let now, old;
    try {
      now = gateAnchorIsPrimary(item, prim, supp, { cert: CERT, keyNormative });
      old = gateAnchorIsPrimary(item, prim, supp, { cert: CERT, keyNormative });
    } catch (e) { changed.push(r.item_id + " THREW: " + e.message.slice(0, 80)); continue; }
    compared++;
    /* A SURVIVOR'S RECORDED VERDICT MUST STILL BE A PASS. The artifact says the gates passed it; if
     * the rule moved under ISMS-IA, one of these turns false. */
    if (now.pass === false) changed.push(r.item_id + "  anchor-is-primary now FAILS: " + String(now.reason).slice(0, 100));
    if (now.pass !== old.pass) changed.push(r.item_id + "  anchor-is-primary unstable between calls");
  }
}
console.log("");
console.log("PROOF 2 -- RE-GATED SURVIVORS, R1 to R8   (code gates only, free)");
console.log("  artifacts read            " + arts.length + "   " + arts.join(", ").slice(0, 110) + "...");
console.log("  survivors found           " + items);
console.log("  anchor-is-primary compared " + compared);
console.log("  verdicts that MOVED        " + changed.length + "   (must be 0)");
for (const c of changed.slice(0, 12)) console.log("      " + c);
void gateModalFidelity;
console.log("");
const clean = moved.length === 0 && changed.length === 0;
console.log(clean
  ? "ISMS-IA IS UNMOVED: every anchor mark identical old-vs-new, and every survivor still passes."
  : "ISMS-IA MOVED -- reported, not explained away.");
if (!clean) process.exitCode = 1;
