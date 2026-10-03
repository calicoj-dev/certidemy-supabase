#!/usr/bin/env node
/* Read-only. Exact current state of the three PROMPT-107 revision targets. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "../scripts/_pg.mjs";
import { itemIdOfStem } from "../scripts/lib/item-id.mjs";
import { gateItemOf } from "../scripts/lib/stored-item.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WANT = ["3973e1ff", "182229d1", "1d659dfc", "a3841bda"];
const KEY = requireKey(join(HERE, "..", "scripts"));
const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const rows = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
  "task_id,status&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,key_support,key_support_clause," +
  "source_id,edition,review_verdict,review_note&order=question_id")).map((g) => [g.question_id, g]));

for (const r of rows) {
  const id8 = itemIdOfStem(r.question_text);
  if (!WANT.includes(id8)) continue;
  const g = ig.get(r.id) || {};
  const gi = gateItemOf(r);
  const ds = gi.options.filter((o) => !o.is_correct).map((o) => o.text.length);
  const mean = ds.reduce((a, b) => a + b, 0) / Math.max(1, ds.length);
  const key = gi.options.find((o) => o.is_correct);
  console.log("\n==== " + id8 + "   uuid " + r.id);
  console.log("  verdict=" + g.review_verdict + "   note=" + JSON.stringify(String(g.review_note || "").slice(0, 110)));
  console.log("  anchor: " + g.source_id + " " + g.edition + " cl." + g.key_support_clause);
  console.log("  key_support: " + JSON.stringify(String(g.key_support || "").slice(0, 200)));
  console.log("  correct_answer=" + JSON.stringify(r.correct_answer) + "   key len=" + (key ? key.text.length : "?") +
    "   distractor mean=" + mean.toFixed(1) + "   ratio=" + (key ? (key.text.length / mean).toFixed(2) : "?"));
  console.log("  TARGET key length for +-10% of mean: " + Math.round(mean * 0.9) + " to " + Math.round(mean * 1.1));
  console.log("  STEM (" + String(r.question_text).length + "c): " + JSON.stringify(r.question_text));
  for (const o of r.options || []) {
    console.log("    " + o.id + (gi.options.find((x) => x.id === o.id).is_correct ? " *" : "  ") + " (" + String(o.text).length + "c) " +
      JSON.stringify(o.text));
  }
  console.log("  EXPLANATION: " + JSON.stringify(String(r.explanation || "")));
}
