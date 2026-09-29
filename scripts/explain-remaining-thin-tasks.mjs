#!/usr/bin/env node
/**
 * explain-remaining-thin-tasks.mjs -- why each AIMS-F task still below the floor of 4 is below it.
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ A COUNT OF THIN TASKS IS NOT A REASON ============
 *
 * "5 tasks remain below 4" invites the wrong repair. Three different things produce that number and they need
 * opposite responses:
 *
 *   the approved set is itself 3     the ruling approved three clauses. The floor is the thing to move, not
 *                                    the map -- the director's own words: "a lower floor for that task, not
 *                                    a stretched map".
 *   a primary is UNDER 15 words      it is linked and primary and does not count as EFFECTIVE, so the map
 *                                    looks thinner than it is. A 6-word definition cannot carry an item.
 *   a primary is a CONTAINER         its text is its children's, and the children are held separately.
 *
 * So every task below the floor is printed with its primaries, each one's word count, and which of the three
 * reasons applies. The enumeration is the artifact; the count is commentary.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { isContainer, MIN_WORDS } from "./lib/effective-primary.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const FLOOR = 4;
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text&order=id");
const byId = new Map(sp.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");

const clausesBySource = new Map();
for (const p of sp) {
  const k = p.source_id;
  if (!clausesBySource.has(k)) clausesBySource.set(k, new Set());
  clausesBySource.get(k).add(String(p.clause));
}

const rows = [];
for (const t of tasks) {
  const prim = ts.filter((r) => r.task_id === t.id && r.role === "primary")
    .map((r) => byId.get(r.passage_id)).filter(Boolean);
  const detail = prim.map((p) => {
    const n = words(p.text);
    const cont = isContainer(String(p.clause), clausesBySource.get(p.source_id) || new Set());
    const effective = !cont && n >= MIN_WORDS;
    return { clause: p.clause, src: p.source_id, n, cont, effective, title: p.title || "" };
  }).sort((a, b) => String(a.clause).localeCompare(String(b.clause), undefined, { numeric: true }));
  const eff = detail.filter((d) => d.effective).length;
  rows.push({ code: t.code, eff, detail, linked: prim.length });
}
const thin = rows.filter((r) => r.eff < FLOOR)
  .sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

console.log("AIMS-F TASKS BELOW THE FLOOR OF " + FLOOR + " EFFECTIVE PRIMARIES");
console.log("  tasks            " + rows.length);
console.log("  below the floor  " + thin.length);
console.log("  (effective = not a container AND at least " + MIN_WORDS + " words of its own text)");
console.log("");
for (const r of thin) {
  const short = r.detail.filter((d) => !d.effective && !d.cont);
  const conts = r.detail.filter((d) => d.cont);
  let reason;
  if (short.length || conts.length) {
    reason = "the map has " + r.linked + " primary link(s) but only " + r.eff + " EFFECTIVE: " +
      [short.length ? short.length + " under " + MIN_WORDS + " words" : null,
        conts.length ? conts.length + " container(s)" : null].filter(Boolean).join(", ");
  } else {
    reason = "every primary is effective -- THE APPROVED SET IS ITSELF " + r.eff +
      ". The floor is the thing to move here, not the map.";
  }
  console.log("  task " + r.code + "   " + r.eff + " effective of " + r.linked + " primary link(s)");
  console.log("      " + reason);
  for (const d of r.detail) {
    console.log("        " + (d.effective ? "yes " : "NO  ") + d.clause.padEnd(10) + String(d.n).padStart(4) +
      "w  " + (d.cont ? "CONTAINER  " : d.n < MIN_WORDS ? "under " + MIN_WORDS + "w  " : "           ") +
      d.title.slice(0, 44));
  }
  console.log("");
}
const setIsThree = thin.filter((r) => r.detail.every((d) => d.effective));
const hasShort = thin.filter((r) => r.detail.some((d) => !d.effective));
console.log("SPLIT, because the two need opposite responses");
console.log("  the approved set is itself under the floor   " + setIsThree.length +
  (setIsThree.length ? ": " + setIsThree.map((r) => r.code).join(", ") : ""));
console.log("      A LOWER FLOOR for these tasks, not a stretched map -- the director's own test.");
console.log("  a primary is linked but not effective        " + hasShort.length +
  (hasShort.length ? ": " + hasShort.map((r) => r.code).join(", ") : ""));
console.log("      These have room only if a longer clause exists to link; the short one stays linked and");
console.log("      simply cannot carry a key on its own.");
