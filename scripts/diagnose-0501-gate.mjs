/**
 * diagnose-0501-gate.mjs -- why does the review arm still withhold 05-01 es/pt?
 * READ-ONLY. Asks the 374 helper what the gate expects and compares it to what the
 * review rows carry. Unknown flags exit 2.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { expectedLessonHashes } from "./lib/expected-review-hashes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) { console.error("no flags"); process.exitCode = 2; process.exit(); }

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const rest = async (p, init = {}) => {
  const r = await fetch(REST_URL + "/" + p, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(r.status + " on " + p + "\n" + (await r.text()));
  const t = await r.text(); return t ? JSON.parse(t) : null;
};
const rpc = (n, a) => rest("rpc/" + n, { method: "POST", body: JSON.stringify(a) });

const rows = await getAll(KEY,
  "lessons?select=id,language,mcp_servable,mcp_translation_review_required&slug=eq.05-01-aims-monitoring-and-measurement&order=language");

for (const r of rows) {
  const want = r.language === "en" ? null : await expectedLessonHashes(rpc, r.id);
  const reviews = await getAll(KEY,
    "lesson_translation_reviews?select=reviewed_at,verdict,en_hash,tr_hash,tr_hash_basis,reviewed_by&lesson_id=eq." + r.id + "&order=reviewed_at");
  const serves = await rpc("lesson_body_is_servable", { p_lesson_id: r.id });
  console.log("=== " + r.language + "   servable=" + r.mcp_servable +
    "  review_required=" + r.mcp_translation_review_required + "  GATE=" + serves);
  if (want) console.log("    gate expects   en_hash " + want.en_hash + "   tr_hash " + want.tr_hash);
  for (const v of reviews) {
    const okEn = want && v.en_hash === want.en_hash;
    const okTr = want && v.tr_hash === want.tr_hash;
    console.log("    review " + String(v.reviewed_at).slice(0, 19) + "  " + v.verdict +
      "  en " + v.en_hash + (want ? (okEn ? " MATCH" : " MISMATCH") : "") +
      "  tr " + v.tr_hash + (want ? (okTr ? " MATCH" : " MISMATCH") : "") +
      "  basis " + v.tr_hash_basis);
  }
  if (!reviews.length) console.log("    (no review rows)");
  console.log("");
}
