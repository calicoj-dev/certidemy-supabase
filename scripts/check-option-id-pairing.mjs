#!/usr/bin/env node
/**
 * check-option-id-pairing.mjs -- do a question's language siblings pair their options BY ID?
 *
 * READ-ONLY. Unknown flags exit 2. Ruled PROMPT-95 addendum, second question.
 *
 * ============ THE QUESTION AND WHY IT IS NOT THE ONE IT LOOKS LIKE ============
 *
 * "Confirm that es-419 and pt-BR option texts are joined by option id, not by position, so a shuffled
 * attempt in Spanish or Portuguese shows the right text beside the right id."
 *
 * AT SERVE TIME THERE IS NO JOIN AT ALL. `generate-mock-exam` selects `.eq("language", language)` and serves
 * THAT row's own options. Each language is a separate row in `quiz_questions` carrying its own `options`
 * array and its own `correct_answer`. So the text beside id `b` in a Spanish attempt is the Spanish row's own
 * option `b`, and the shuffle -- seeded on (session_id, question_id), where the question id is that Spanish
 * row's id -- reorders that row's own pairs. There is no cross-language lookup to get wrong.
 *
 * ============ SO WHAT THIS ACTUALLY CHECKS IS THE CONVENTION UNDERNEATH ============
 *
 * Measured on ISMS-F: 880 of 880 groups carry the SAME `correct_answer` id and the same option count in all
 * three languages. Translations are positionally parallel and keyed by id -- option `a` in English is the
 * Spanish `a`'s source. Nothing asserts that; it is a convention every translation pass has happened to hold.
 *
 * It matters for the thing NOT yet done: grounded items are English-only today (49 rows, no
 * `question_group_id`, so no sibling can exist -- checked, which is why the PROMPT-95 s1d rebalance of those
 * 49 rows broke no pairing). When they ARE translated, a pipeline that writes options in its own order will
 * silently break the pairing, and the failure is invisible at serve time because each row grades itself.
 *
 * This is therefore a FORWARD guard: run it after any translation pass that touches an option set.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const keyId = (q) => (Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer);

console.log("OPTION-ID PAIRING ACROSS LANGUAGE SIBLINGS");
console.log("");
console.log("  cert         groups  all 3 langs   same key id   same count   MISMATCHED");
console.log("  " + "-".repeat(76));
let totGroups = 0, totFull = 0, totKey = 0, totCount = 0;
const mismatches = [];
for (const c of certs) {
  const qs = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,options,correct_answer" +
    "&certification_id=eq." + c.id + "&retired_at=is.null&order=question_group_id");
  const g = new Map();
  for (const q of qs) {
    if (!q.question_group_id) continue;
    if (!g.has(q.question_group_id)) g.set(q.question_group_id, {});
    g.get(q.question_group_id)[q.language] = q;
  }
  let full = 0, sameKey = 0, sameCount = 0;
  for (const [gid, v] of g) {
    const langs = Object.keys(v);
    if (langs.length < 2) continue;         /* a single-language group has nothing to pair */
    full++;
    const ids = langs.map((L) => keyId(v[L]));
    const counts = langs.map((L) => (v[L].options || []).length);
    const kOk = new Set(ids).size === 1;
    const cOk = new Set(counts).size === 1;
    if (kOk) sameKey++;
    if (cOk) sameCount++;
    if (!kOk || !cOk) {
      mismatches.push({ cert: c.code, gid, langs, ids, counts, kOk, cOk });
    }
  }
  totGroups += g.size; totFull += full; totKey += sameKey; totCount += sameCount;
  if (!full) continue;
  console.log("  " + c.code.padEnd(12) + String(g.size).padStart(6) + String(full).padStart(13) +
    String(sameKey).padStart(14) + String(sameCount).padStart(13) +
    String(full - Math.min(sameKey, sameCount)).padStart(13));
}
console.log("  " + "-".repeat(76));
console.log("  TOTAL       " + String(totGroups).padStart(6) + String(totFull).padStart(13) +
  String(totKey).padStart(14) + String(totCount).padStart(13) +
  String(totFull - Math.min(totKey, totCount)).padStart(13));
console.log("");
/* THE CHECK MUST BE ABLE TO FIRE. A corpus where every group is single-language would print all-clean and
 * mean nothing, so the denominator is asserted before the verdict. */
if (!totFull) {
  console.log("VACUOUS: no group carries more than one language, so nothing was paired and this is NOT a");
  console.log("clean result. It is no result.");
  process.exitCode = 2;
} else if (!mismatches.length) {
  console.log("EVERY multi-language group pairs its options BY ID: same key id, same option count, across");
  console.log(totFull + " group(s). So a shuffled attempt in es-419 or pt-BR shows that row's own text beside");
  console.log("that row's own id -- and there is no cross-language join at serve time to get wrong.");
} else {
  console.log("MISMATCHED GROUPS, " + mismatches.length + " -- the pairing is broken and a side-by-side");
  console.log("review would compare different options:");
  for (const m of mismatches.slice(0, 20)) {
    console.log("  " + m.cert + "  " + m.gid + "   langs " + m.langs.join("/") +
      (m.kOk ? "" : "   key ids " + m.ids.join("/")) +
      (m.cOk ? "" : "   counts " + m.counts.join("/")));
  }
  if (mismatches.length > 20) console.log("  ... and " + (mismatches.length - 20) + " more");
  process.exitCode = 1;
}
console.log("");
console.log("WHY THIS IS A FORWARD GUARD. Grounded items are English-only today and carry no");
console.log("question_group_id, so the PROMPT-95 s1d rebalance of 49 rows could not break a pairing. Run this");
console.log("after any translation pass that writes an option set, because a pipeline that orders options its");
console.log("own way breaks the pairing silently -- each row still grades itself correctly.");
