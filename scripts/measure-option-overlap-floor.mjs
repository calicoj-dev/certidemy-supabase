#!/usr/bin/env node
/**
 * measure-option-overlap-floor.mjs -- what the option-overlap floor hides, at every candidate value.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * Ruled by this repository's own threshold rule: *a threshold chosen to reduce noise is justified against the
 * signal it can hide, in the same breath that it is set.* The enemy rule's option half refuses two items that
 * share an option text, and a floor is needed because short options are boilerplate -- "None of the above",
 * "Both A and B" -- which two unrelated items legitimately share.
 *
 * MY FIRST FLOOR WAS 12 CHARACTERS AND ITS OWN TEST CAUGHT IT. "None of the above" normalises to 17
 * characters and "Both A and B" to 12, so both would have made two items enemies. The corpus happens to
 * contain neither, so the feasibility run reported 3 collisions and looked fine -- a guard that fires on the
 * normal case, invisible because the normal case is currently absent. That is the worst version: it would
 * have bitten the first time somebody wrote an ordinary boilerplate option.
 *
 * So the floor is chosen from the DISTRIBUTION, with the collisions at each candidate value printed beside
 * it, and with the boilerplate phrases measured rather than guessed at.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

/* the phrases a floor must NOT catch, declared by name with their normalised length, so the choice of floor
 * is made against real strings rather than against an intuition about length */
const BOILERPLATE = ["None of the above", "All of the above", "Both A and B", "None of these",
  "All of these", "Neither of these", "Any of the above", "It depends", "Not applicable",
  "No documented information is required", "There is no such requirement"];

const certs = (await getAll(KEY, "certifications?select=id,code&order=code")).filter((c) => c.code !== "ZZ-TEST-I");
const lengths = [];
const byText = new Map();
let items = 0;
for (const c of certs) {
  const qs = await getAll(KEY, "quiz_questions?select=id,options&certification_id=eq." + c.id +
    "&language=eq.en&pool=eq.secure&retired_at=is.null&status=in.(approved,pending_review)");
  for (const q of qs) {
    items++;
    for (const o of Array.isArray(q.options) ? q.options : []) {
      const k = norm(o && o.text);
      if (!k) continue;
      lengths.push(k.length);
      if (!byText.has(k)) byText.set(k, new Set());
      byText.get(k).add(c.code + "/" + q.id);
    }
  }
}
lengths.sort((a, b) => a - b);
const pct = (p) => lengths[Math.min(lengths.length - 1, Math.floor((p / 100) * lengths.length))];

console.log("OPTION TEXT LENGTHS over " + items + " secure EN item(s), " + lengths.length + " option(s)");
console.log("  min " + lengths[0] + "   p1 " + pct(1) + "   p5 " + pct(5) + "   p25 " + pct(25) +
  "   median " + pct(50) + "   p75 " + pct(75) + "   max " + lengths[lengths.length - 1]);
console.log("");

console.log("DECLARED BOILERPLATE, with its NORMALISED length -- a floor must sit ABOVE all of these:");
let maxBoiler = 0;
for (const b of BOILERPLATE) {
  const n = norm(b).length;
  maxBoiler = Math.max(maxBoiler, n);
  console.log("  " + String(n).padStart(3) + "   " + JSON.stringify(b));
}
console.log("  -> the longest declared boilerplate is " + maxBoiler + " characters");
console.log("");

console.log("COLLISIONS AT EACH CANDIDATE FLOOR   (a collision = one normalised option text on 2+ items)");
console.log("  floor   colliding texts   items involved   catches boilerplate?");
for (const floor of [0, 8, 12, 20, 30, 40, 50, 60]) {
  const cols = [...byText].filter(([k, v]) => k.length >= floor && v.size > 1);
  const involved = new Set();
  for (const [, v] of cols) for (const x of v) involved.add(x);
  const catches = BOILERPLATE.filter((b) => norm(b).length >= floor);
  console.log("  " + String(floor).padStart(5) + String(cols.length).padStart(18) +
    String(involved.size).padStart
    (17) + "   " + (catches.length ? "YES -- " + catches.length + " of " + BOILERPLATE.length +
      ", longest " + JSON.stringify(catches.sort((a, b) => norm(b).length - norm(a).length)[0]) : "no"));
}
console.log("");
console.log("THE FLOOR MUST SIT ABOVE THE LONGEST BOILERPLATE AND BELOW A REAL HANDOVER. The pair that");
console.log("motivated the rule -- b25f378f's option B against dfc8a1bf's key -- normalises to " +
  norm("The degree to which the activities that were planned got carried out and the intended results " +
    "reached.").length + " characters.");
console.log("");
console.log("COLLIDING TEXTS at the chosen floor, named -- the enumeration is the artifact:");
const CHOSEN = 40;
for (const [k, v] of [...byText].filter(([k, v]) => k.length >= CHOSEN && v.size > 1)
  .sort((a, b) => b[1].size - a[1].size)) {
  console.log("  " + String(k.length).padStart(3) + " chars, " + v.size + " items   " +
    JSON.stringify(k.slice(0, 84)));
  console.log("       " + [...v].map((x) => x.split("/")[0] + ":" + x.split("/")[1].slice(0, 8)).join(" "));
}
