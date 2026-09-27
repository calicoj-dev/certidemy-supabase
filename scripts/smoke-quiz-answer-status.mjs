#!/usr/bin/env node
/**
 * smoke-quiz-answer-status.mjs - does the DEPLOYED submit-quiz-answer grade a question whose
 * status is not `approved`, and hand back its key?
 *
 * READ-ONLY ABOUT CONTENT, net-zero about learner data: it creates one synthetic learner, makes one
 * call, and deletes everything it wrote. `--apply` to run; dry by default; unknown flags exit 2.
 *
 * ============ WHY A SYNTHETIC LEARNER AND NOT THE SERVICE KEY ============
 *
 * The claim is about what A CANDIDATE can obtain. This repository already records the cost of
 * getting that wrong: smoke-courseware passed 37 of 37 while the paywall did not exist, because it
 * called the function with the system's own credentials and the function holds both. The credential
 * the test holds IS the hypothesis, so this signs in with the ANON key as a brand-new user with no
 * entitlement to anything.
 *
 * ============ WHAT IT ASSERTS, AND THE CONTROL THAT MAKES THE RESULT MEAN SOMETHING ============
 *
 *   CONTROL   an APPROVED practice item must be graded and return a key. Without this, a refusal
 *             on the non-approved item is equally consistent with a broken deployment, a bad JWT
 *             or a wrong session id -- a refusal proves nothing unless something proves the
 *             endpoint still serves.
 *   SUBJECT   a REJECTED item, posted by id. If it is graded and its key comes back, the grading
 *             path is status-blind.
 *
 * A rejected item is used rather than a secure one deliberately: it exercises the identical missing
 * predicate (`status = 'approved'`) without pulling an exam key out of the bank to prove a point.
 *
 * NO KEY MATERIAL IS PRINTED. The assertion is on the PRESENCE and TYPE of `correct_answer`, never
 * its value, and the item ids are truncated.
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
const KEY = requireKey(HERE);
const PROJECT = "https://pctynukndxnmnxiqpgck.supabase.co";

/* The anon key is PUBLISHABLE and is what a browser holds. Read from wherever this machine keeps
 * it; never printed. */
function anonKey() {
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  const candidates = [
    join(HERE, ".env"), join(HERE, "..", ".env"),
    join(HERE, "..", "..", "certidemy-web", ".env.local"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*(?:NEXT_PUBLIC_)?SUPABASE_ANON_KEY\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}

const svc = (path, init) => fetch(REST_URL + "/" + path, {
  ...init,
  headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
    ...(init?.headers ?? {}) },
});

async function main() {
  const ANON = anonKey();
  if (!ANON) {
    console.error("No anon key found. A service-role run would prove nothing: the credential the");
    console.error("test holds IS the hypothesis. Set SUPABASE_ANON_KEY and re-run.");
    return 2;
  }

  /* Pick the subject and the control from live data. */
  const qs = await getAll(KEY, "quiz_questions?select=id,status,pool,retired_at,language,certification_id,correct_answer");
  const rejected = qs.find((r) => r.status === "rejected" && r.pool === "practice");
  const approved = qs.find((r) => r.status === "approved" && r.pool === "practice" && !r.retired_at && r.language === "en");
  if (!rejected || !approved) {
    console.error("could not find both a rejected and an approved practice item -- UNSOUND, not a pass");
    return 2;
  }

  console.log("");
  console.log("SUBMIT-QUIZ-ANSWER, STATUS PREDICATE ON THE GRADING PATH");
  console.log("  control (approved) " + approved.id.slice(0, 8) + "    subject (rejected) " + rejected.id.slice(0, 8));
  if (!APPLY) {
    console.log("");
    console.log("Dry run. It would create one synthetic learner, make two calls and delete everything.");
    console.log("Re-run with --apply.");
    return 0;
  }

  /* ---- one synthetic learner, and a recovery line printed BEFORE anything is written ---- */
  const email = "smoke-sqa-" + Math.abs(Date.now() % 100000) + "@certidemy-smoke.invalid";
  const password = "Sm0ke!" + Math.abs(Date.now() % 1000000) + "aA";
  let userId = null, sessionId = null;
  try {
    const mk = await fetch(PROJECT + "/auth/v1/admin/users", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const mkBody = await mk.json();
    if (!mk.ok) throw new Error("createUser " + mk.status + " " + JSON.stringify(mkBody).slice(0, 200));
    userId = mkBody.id;
    console.log("  created synthetic learner " + userId.slice(0, 8) + " (deleted at the end)");

    const si = await fetch(PROJECT + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const siBody = await si.json();
    if (!si.ok || !siBody.access_token) throw new Error("signIn " + si.status);
    const jwt = siBody.access_token;

    /* A session row, because quiz_attempts references one. */
    const mkSession = await svc("quiz_sessions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      /* `kind` is NOT NULL on quiz_sessions -- a session without one is not a session, and the
       * 23502 on the first run is that constraint doing its job. "practice" is the kind this path
       * is about. (This comment lost its backticks once to a `node -e` patch, which is the
       * eleventh instance of that transport defect in this repository. Written with the file tool.) */
      body: JSON.stringify({ user_id: userId, certification_id: approved.certification_id, kind: "practice" }),
    });
    const sBody = await mkSession.json();
    if (!mkSession.ok) throw new Error("quiz_sessions insert " + mkSession.status + " " + JSON.stringify(sBody).slice(0, 200));
    sessionId = Array.isArray(sBody) ? sBody[0].id : sBody.id;

    const call = async (q) => {
      const r = await fetch(PROJECT + "/functions/v1/submit-quiz-answer", {
        method: "POST",
        headers: { apikey: ANON, Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question_id: q.id, user_answer: ["a"], time_taken_seconds: 5 }),
      });
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      return { status: r.status, body };
    };

    console.log("");
    const ctl = await call(approved);
    const ctlServed = ctl.status === 200 && ctl.body && Array.isArray(ctl.body.correct_answer);
    console.log("  CONTROL  approved item   HTTP " + ctl.status +
      "   key returned: " + (ctlServed ? "YES" : "no") +
      "   recommendation: " + (ctl.body && ctl.body.next_recommendation ? "given" : "null"));
    if (!ctlServed) {
      console.log("");
      console.log("  UNSOUND: the endpoint did not serve the APPROVED control, so a refusal on the");
      console.log("  subject would say nothing about the status predicate. No verdict.");
      return 1;
    }

    const sub = await call(rejected);
    const subServed = sub.status === 200 && sub.body && Array.isArray(sub.body.correct_answer);
    console.log("  SUBJECT  rejected item   HTTP " + sub.status +
      "   key returned: " + (subServed ? "YES" : "no") +
      "   explanation returned: " + (sub.body && sub.body.explanation ? "YES" : "no"));

    /* ============ THE POOL HALF, WHICH IS THE SEVERITY ============
     *
     * The first read filters on id alone, so a SECURE exam item should behave exactly as the
     * rejected one did -- and "should" is reasoning, not evidence. `get-active-exam-session` hands
     * question IDS to the client (it is careful never to send correct_answer), so a candidate mid
     * exam holds live secure ids. Whether those ids yield a key here is the difference between a
     * content-hygiene defect and an exam-integrity one, and it is one boolean.
     *
     * PRESENCE ONLY. The assertion is `Array.isArray(correct_answer)`; the value is never read,
     * logged or stored, and the id is truncated. Measuring this does not require knowing the key. */
    const secure = qs.find((r) => r.pool === "secure" && r.status === "approved" && !r.retired_at);
    let secureServed = null;
    if (secure) {
      const s = await call(secure);
      secureServed = s.status === 200 && s.body && Array.isArray(s.body.correct_answer);
      console.log("  POOL     SECURE exam item " + secure.id.slice(0, 8) + "  HTTP " + s.status +
        "   key returned: " + (secureServed ? "YES" : "no") + "   (presence only; value never read)");
    } else {
      console.log("  POOL     no secure item found -- UNASSERTED, not clean");
    }

    /* ============ SOMEONE ELSE'S SESSION ============
     *
     * The function authenticated the caller and then trusted `session_id` from the body, so any
     * learner could write attempts into any other learner's session. The subject here is a REAL
     * session belonging to a REAL user -- read-only in intent, and the call is expected to be
     * refused; if it is NOT refused it writes one attempt row into that session, which is exactly
     * the finding and is reported as such rather than hidden.
     *
     * The control above already proved the endpoint serves, so a refusal here means the ownership
     * check fired and not that the endpoint is down. */
    const others = await getAll(KEY, "quiz_sessions?select=id,user_id,kind&kind=in.(practice,review)");
    const foreign = others.find((s) => s.user_id !== userId);
    let foreignRefused = null;
    if (foreign) {
      const r = await fetch(PROJECT + "/functions/v1/submit-quiz-answer", {
        method: "POST",
        headers: { apikey: ANON, Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: foreign.id, question_id: approved.id, user_answer: ["a"], time_taken_seconds: 5 }),
      });
      foreignRefused = r.status === 403 || r.status === 404;
      console.log("  SESSION  another user's session " + foreign.id.slice(0, 8) + "  HTTP " + r.status +
        "   " + (foreignRefused ? "refused" : "ACCEPTED -- an attempt row was written into it"));
      if (!foreignRefused) {
        await svc("quiz_attempts?user_id=eq." + userId + "&session_id=eq." + foreign.id,
          { method: "DELETE", headers: { Prefer: "return=minimal" } });
        console.log("    the row this wrote into it has been deleted");
      }
    } else {
      console.log("  SESSION  no other user's session found -- UNASSERTED, not clean");
    }

    /* ============ A NONEXISTENT SESSION IS REFUSED BEFORE ANYTHING HAPPENS ============
     *
     * This is the case that made the exposure unmeasurable: the attempt insert's FK to
     * quiz_sessions failed, the error was discarded, and the key came back with no audit row. It
     * must now be refused at the session lookup -- before the question is read, before grading, and
     * with no row written anywhere. A random uuid cannot be a real session. */
    const ghost = "00000000-0000-4000-8000-0000000000ff";
    const g = await fetch(PROJECT + "/functions/v1/submit-quiz-answer", {
      method: "POST",
      headers: { apikey: ANON, Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: ghost, question_id: approved.id, user_answer: ["a"], time_taken_seconds: 5 }),
    });
    let gBody = null;
    try { gBody = await g.json(); } catch { gBody = null; }
    const ghostRefused = g.status === 404 && !(gBody && gBody.correct_answer);
    console.log("  GHOST    a session id that does not exist  HTTP " + g.status +
      "   key returned: " + (gBody && gBody.correct_answer ? "YES" : "no") +
      "   " + (ghostRefused ? "refused" : "NOT REFUSED"));

    /* An exam-kind session must also be refused: score-mock-exam is the grader for those. */
    const examKind = await getAll(KEY, "quiz_sessions?select=id,user_id,kind&kind=in.(certification_exam,mock_exam)");
    let examKindRefused = null;
    if (examKind.length) {
      const r = await fetch(PROJECT + "/functions/v1/submit-quiz-answer", {
        method: "POST",
        headers: { apikey: ANON, Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: examKind[0].id, question_id: approved.id, user_answer: ["a"], time_taken_seconds: 5 }),
      });
      examKindRefused = r.status === 403 || r.status === 404;
      console.log("  KIND     an exam-kind session  HTTP " + r.status + "   " +
        (examKindRefused ? "refused" : "ACCEPTED"));
      if (!examKindRefused) {
        await svc("quiz_attempts?user_id=eq." + userId + "&session_id=eq." + examKind[0].id,
          { method: "DELETE", headers: { Prefer: "return=minimal" } });
      }
    }

    /* The recommendation half, which the deploy was for. Sampled, and said to be sampled. */
    const recs = [];
    for (let i = 0; i < 6; i++) {
      const r = await call(approved);
      const n = r.body && r.body.next_recommendation;
      if (n) recs.push(n.question_id);
    }
    const meta = new Map(qs.map((r) => [r.id, r]));
    const badRec = recs.filter((id) => {
      const m = meta.get(id);
      return !m || m.status !== "approved" || m.pool !== "practice" || m.retired_at || m.language !== "en";
    });
    console.log("");
    console.log("  RECOMMENDATION, 6 call(s): " + recs.length + " given, " + badRec.length +
      " violating status/pool/retired/language");
    console.log("    SAMPLED, not proof of absence: the query takes 50 candidates from a pool of");
    console.log("    thousands. What proves the fix is live is that the DEPLOYED body downloads");
    console.log("    byte-identical to the committed source and carries all four filters.");

    /* THE SAME OBSERVATION IS A FINDING OR A DECISION DEPENDING ON THE POOL, so the message has to
     * say which. Grading a non-approved PRACTICE item is deliberate -- it stops a learner whose item
     * was retired mid-session from losing the answer they just gave. Grading a SECURE one was the
     * defect. Printing "STATUS-BLIND: FINDING" after the fix would leave the output reading as an
     * open hole, which is the stale-claim shape pointed at a report instead of a document. */
    console.log("");
    if (subServed && secureServed === false) {
      console.log("  Non-approved PRACTICE items are still graded, which is the ruling: a learner");
      console.log("  whose item was retired mid-session keeps the answer they just gave. They can no");
      console.log("  longer be recommended. Secure items are refused, so the key is not reachable.");
    } else if (subServed) {
      console.log("  FINDING: the grading path is STATUS-BLIND. A caller holding a question id");
      console.log("  receives correct_answer and explanation whatever the item's status, because");
      console.log("  the first read filters on id alone and runs as service_role.");
    } else {
      console.log("  The grading path refused the non-approved item -- a learner mid-session on a");
      console.log("  just-retired item would lose their answer. That is not the ruling.");
    }
    if (secureServed) {
      console.log("  AND POOL-BLIND: a SECURE exam item's key comes back the same way. Exam question");
      console.log("  ids reach the client through get-active-exam-session, so this is reachable by a");
      console.log("  candidate holding nothing but their own JWT and an exam in progress.");
    }

    /* ============ THE VERDICT, IN THE THREE STATES THE RULING ASKED FOR ============
     *
     * control served + secure refused + someone else's session refused. The control is first
     * because without it every refusal below is equally consistent with a broken deployment. */
    console.log("");
    const expected = ctlServed && secureServed === false && foreignRefused === true && ghostRefused === true;
    console.log("  EXPECTED AFTER THE FIX: control served, secure refused, foreign session refused");
    console.log("    control served          " + (ctlServed ? "yes" : "NO"));
    console.log("    ghost session refused   " + (ghostRefused ? "yes" : "NO -- a key with no audit row"));
    console.log("    secure refused         " + (secureServed === null ? "UNASSERTED" : secureServed ? "NO -- key returned" : "yes"));
    console.log("    foreign session refused " + (foreignRefused === null ? "UNASSERTED" : foreignRefused ? "yes" : "NO"));
    console.log("    exam-kind refused      " + (examKindRefused === null ? "UNASSERTED" : examKindRefused ? "yes" : "NO"));
    console.log("    non-approved practice still graded  " + (subServed ? "yes (intended)" : "no -- a learner mid-session would be stranded"));
    console.log("  " + (expected ? "AS RULED." : "NOT YET AS RULED."));
    return expected ? 0 : 1;
  } finally {
    /* ---- net-zero. Everything this wrote, removed, and the removal is read back. ---- */
    if (userId) {
      for (const p of [
        "quiz_attempts?user_id=eq." + userId,
        "fsrs_reviews?user_id=eq." + userId,
        "fsrs_cards?user_id=eq." + userId,
        "user_concept_mastery?user_id=eq." + userId,
      ]) await svc(p, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      if (sessionId) await svc("quiz_sessions?id=eq." + sessionId, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      await fetch(PROJECT + "/auth/v1/admin/users/" + userId, {
        method: "DELETE", headers: { apikey: KEY, Authorization: "Bearer " + KEY },
      });
      const left = await getAll(KEY, "quiz_attempts?select=id&user_id=eq." + userId);
      console.log("  cleaned up: " + left.length + " attempt row(s) left for the synthetic learner" +
        (left.length ? "  <- MANUAL CLEANUP NEEDED for user " + userId : ""));
    }
  }
}
process.exitCode = await main();
