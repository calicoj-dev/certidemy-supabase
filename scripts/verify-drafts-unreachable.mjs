#!/usr/bin/env node
/**
 * verify-drafts-unreachable.mjs - can a candidate reach one of the 32 inserted drafts?
 *
 * Read-only about content; creates one synthetic learner and deletes it. `--apply` to run.
 *
 * ============ WHY THIS IS A WIRE CHECK AND NOT A QUERY ============
 *
 * The rows are unservable because three columns say so, and "three columns say so" is a claim about
 * code that reads them. This calls the DEPLOYED functions as a stranger instead:
 *
 *   FORM       generate-mock-exam assembles a real AIMS-F simulator form. None of the 32 ids may
 *              appear in it.
 *   STRANGER   submit-quiz-answer is handed one of the 32 ids directly. It must refuse.
 *
 * ============ AND EACH ONE CARRIES ITS OWN CONTROL ============
 *
 * A form with no draft ids proves nothing if the form is empty, and a refusal proves nothing if the
 * endpoint refuses everything. So the form must contain items, and the stranger check first grades a
 * live APPROVED item successfully. Without those two, both results are silences.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --apply (dry by default).");
  process.exitCode = 2; process.exit();
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const PROJECT = "https://pctynukndxnmnxiqpgck.supabase.co";

function anonKey() {
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  for (const p of [join(HERE, ".env"), join(HERE, "..", ".env"),
                   join(HERE, "..", "..", "certidemy-web", ".env.local")]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*(?:NEXT_PUBLIC_)?SUPABASE_ANON_KEY\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}

async function main() {
  const ANON = anonKey();
  if (!ANON) { console.error("no anon key: a service-role run proves nothing"); return 2; }
  const pin = JSON.parse(readFileSync(join(ROOT, "PILOT-DRAFT-INSERTED.json"), "utf8"));
  const draftIds = new Set(pin.ids);
  const certRows = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
  const cert = certRows[0];

  console.log("");
  console.log("ARE THE 32 DRAFTS REACHABLE BY A CANDIDATE?");
  console.log("  drafts inserted " + pin.ids.length + " on " + pin.inserted_on);
  if (!APPLY) { console.log(""); console.log("Dry run. Re-run with --apply."); return 0; }

  const email = "smoke-reach-" + Math.abs(Date.now() % 100000) + "@certidemy-smoke.invalid";
  const password = "Re4ch!" + Math.abs(Date.now() % 1000000) + "aA";
  let userId = null;
  let formOk = null, strangerOk = null;
  try {
    const mk = await fetch(PROJECT + "/auth/v1/admin/users", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const mkBody = await mk.json();
    if (!mk.ok) throw new Error("createUser " + mk.status);
    userId = mkBody.id;
    const si = await fetch(PROJECT + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const siBody = await si.json();
    if (!si.ok || !siBody.access_token) throw new Error("signIn " + si.status);
    const jwt = siBody.access_token;
    const call = (fn, body) => fetch(PROJECT + "/functions/v1/" + fn, {
      method: "POST",
      headers: { apikey: ANON, Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    /* ---------------- 1. ONE ASSEMBLED FORM ---------------- */
    const r = await call("generate-mock-exam", { certification_id: cert.id, mode: "simulator", language: "en" });
    let form = null;
    try { form = await r.json(); } catch { form = null; }
    const qs = (form && (form.questions || form.items)) || [];
    const ids = qs.map((q) => q.id || q.question_id).filter(Boolean);
    const hits = ids.filter((id) => draftIds.has(id));
    console.log("");
    console.log("  FORM  generate-mock-exam  HTTP " + r.status + "   items assembled: " + ids.length);
    if (ids.length === 0) {
      console.log("        CONTROL FAILED: the form is empty, so 'no drafts in it' is a silence.");
      formOk = null;
    } else {
      formOk = hits.length === 0;
      console.log("        of the 32 drafts, present in the form: " + hits.length +
        (hits.length ? "  <- " + hits.map((h) => h.slice(0, 8)).join(" ") : ""));
      /* The control that makes the absence mean something: the form is drawn from the same
       * certification the drafts were inserted into. */
      console.log("        control: the form is non-empty and drawn from AIMS-F, the same");
      console.log("        certification the drafts belong to, so they were eligible by cert.");
    }

    /* ---------------- 2. THE STRANGER, WITH A CONTROL FIRST ---------------- */
    const approved = (await getAll(KEY,
      "quiz_questions?select=id&certification_id=eq." + cert.id +
      "&language=eq.en&pool=eq.practice&status=eq.approved&retired_at=is.null"))[0];
    const sess = await fetch(REST_URL + "/quiz_sessions", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify({ user_id: userId, certification_id: cert.id, kind: "practice" }),
    });
    const sBody = await sess.json();
    const sessionId = Array.isArray(sBody) ? sBody[0].id : sBody.id;

    const submit = async (qid) => {
      const res = await call("submit-quiz-answer",
        { session_id: sessionId, question_id: qid, user_answer: ["a"], time_taken_seconds: 5 });
      let b = null; try { b = await res.json(); } catch { b = null; }
      return { status: res.status, key: !!(b && b.correct_answer) };
    };
    const ctl = await submit(approved.id);
    console.log("");
    console.log("  STRANGER  control, a live APPROVED practice item   HTTP " + ctl.status +
      "   key returned: " + (ctl.key ? "YES" : "no"));
    if (!(ctl.status === 200 && ctl.key)) {
      console.log("        CONTROL FAILED: the endpoint did not serve the control, so a refusal below");
      console.log("        would say nothing about the drafts.");
      strangerOk = null;
    } else {
      const one = pin.ids[0];
      const d = await submit(one);
      strangerOk = d.status >= 400 && !d.key;
      console.log("  STRANGER  one of the 32 drafts " + one.slice(0, 8) + "            HTTP " + d.status +
        "   key returned: " + (d.key ? "YES" : "no") + "   " + (strangerOk ? "refused" : "NOT REFUSED"));
      console.log("        NOTE which rule refuses it: these rows are pool='secure', so the pool");
      console.log("        refusal fires first and the status filter is never reached. That is three");
      console.log("        independent reasons, and this proves the outermost one.");
    }

    console.log("");
    const verdict = formOk === true && strangerOk === true;
    console.log("  form excludes all 32:      " + (formOk === null ? "UNASSERTED" : formOk ? "yes" : "NO"));
    console.log("  stranger refused a draft:  " + (strangerOk === null ? "UNASSERTED" : strangerOk ? "yes" : "NO"));
    console.log("  " + (verdict ? "THE DRAFTS ARE UNREACHABLE ON THE WIRE." : "NOT PROVEN -- see above."));
    return verdict ? 0 : 1;
  } finally {
    if (userId) {
      for (const p of ["quiz_attempts?user_id=eq." + userId, "fsrs_reviews?user_id=eq." + userId,
                       "fsrs_cards?user_id=eq." + userId, "user_concept_mastery?user_id=eq." + userId,
                       "exam_session_items?session_id=in.(select id from quiz_sessions where user_id=eq." + userId + ")"]) {
        await fetch(REST_URL + "/" + p, { method: "DELETE",
          headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=minimal" } }).catch(() => {});
      }
      await fetch(REST_URL + "/quiz_sessions?user_id=eq." + userId, { method: "DELETE",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=minimal" } }).catch(() => {});
      await fetch(PROJECT + "/auth/v1/admin/users/" + userId,
        { method: "DELETE", headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
      console.log("  synthetic learner deleted");
    }
  }
}
process.exitCode = await main();
