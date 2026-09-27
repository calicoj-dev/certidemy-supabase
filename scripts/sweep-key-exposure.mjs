#!/usr/bin/env node
/**
 * sweep-key-exposure.mjs - can a STRANGER read an item's key or its text through PostgREST?
 *
 * READ-ONLY except for one synthetic learner, which is deleted. `--apply` to run; dry by default;
 * unknown flags exit 2. NO VALUE IS EVER PRINTED: every assertion is on PRESENCE.
 *
 * ============ WHY THIS EXISTS ============
 *
 * submit-quiz-answer returned a SECURE item's correct_answer to a brand-new learner (2026-09-27).
 * One endpoint that fetches by id and hands back the key is a reason to ask whether the table itself
 * does, because an edge function is not the only way to reach a row: PostgREST exposes the table
 * directly, and RLS IS NOT A GRANT -- the table-level grant is checked BEFORE row-level security, so
 * a column grant and a policy are two different questions with two different answers.
 *
 * ============ TWO ROLES, AND A CONTROL FOR EACH ============
 *
 * A refusal proves nothing unless something proves the probe could have succeeded. So each role
 * probes something it SHOULD be able to read:
 *
 *   anon           a public certification row -- if that fails, the anon key is wrong
 *   authenticated  a PRACTICE item's question_text -- if that fails, the JWT is wrong and every
 *                  "no" below is vacuous rather than clean
 *
 * ============ WHAT IT CANNOT SEE ============
 *
 * It probes what PostgREST serves. An edge function runs as service_role and is checked separately,
 * by reading each one's response shape; no black-box probe can enumerate those.
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

/* Views over quiz_questions, from the catalogue rather than typed here. */
const VIEWS = ["v_live_items", "v_question_group_integrity", "v_schema_guardrails",
  "v_exam_exposure", "v_governance_guardrails", "v_retired_items_evidence", "v_user_due_reviews"];

async function main() {
  const ANON = anonKey();
  if (!ANON) { console.error("no anon key: a service-role run proves nothing"); return 2; }

  const qs = await getAll(KEY, "quiz_questions?select=id,pool,status,visibility,retired_at");
  const secure = qs.find((r) => r.pool === "secure" && r.status === "approved" && !r.retired_at);
  const practice = qs.find((r) => r.pool === "practice" && r.status === "approved" && !r.retired_at);
  if (!secure || !practice) { console.error("could not find one secure and one practice item -- UNSOUND"); return 2; }

  console.log("");
  console.log("KEY EXPOSURE THROUGH POSTGREST, PROBED AS A STRANGER");
  console.log("  secure subject " + secure.id.slice(0, 8) + " (visibility=" + secure.visibility +
    ")   practice subject " + practice.id.slice(0, 8) + " (visibility=" + practice.visibility + ")");
  if (!APPLY) { console.log(""); console.log("Dry run. Re-run with --apply."); return 0; }

  const email = "smoke-sweep-" + Math.abs(Date.now() % 100000) + "@certidemy-smoke.invalid";
  const password = "Sw3ep!" + Math.abs(Date.now() % 1000000) + "aA";
  let userId = null;
  const findings = [];
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

    /* PRESENCE ONLY: the row count, and which of the requested columns came back non-null. The
     * values are never read into a variable that is printed. */
    const probe = async (path, who) => {
      const headers = who === "anon"
        ? { apikey: ANON }
        : { apikey: ANON, Authorization: "Bearer " + jwt };
      const r = await fetch(REST_URL + "/" + path, { headers });
      let rows = null;
      try { rows = await r.json(); } catch { rows = null; }
      const n = Array.isArray(rows) ? rows.length : null;
      const cols = Array.isArray(rows) && rows.length
        ? Object.entries(rows[0]).filter(([, v]) => v !== null && v !== undefined).map(([k]) => k)
        : [];
      return { status: r.status, n, cols };
    };

    const line = (label, r, expect) => {
      const got = r.status >= 400 ? "HTTP " + r.status
        : (r.n === 0 ? "0 rows" : r.n + " row(s), non-null: " + (r.cols.join("/") || "none"));
      const bad = expect === "refused" && r.status < 400 && r.n > 0;
      console.log("    " + (bad ? "LEAK " : "     ") + label.padEnd(56) + got);
      if (bad) findings.push(label);
      return !bad;
    };

    /* ---------------- CONTROLS FIRST ---------------- */
    console.log("");
    console.log("  CONTROLS -- a refusal below means nothing unless these succeed");
    const ctlAnon = await probe("certifications?select=code&limit=1", "anon");
    console.log("    anon can read a certification row                        " +
      (ctlAnon.status < 400 && ctlAnon.n > 0 ? "yes" : "NO -- anon key is wrong, results are vacuous"));
    const ctlAuth = await probe("quiz_questions?select=question_text&id=eq." + practice.id, "auth");
    const authWorks = ctlAuth.status < 400 && ctlAuth.n > 0;
    console.log("    authenticated can read a PRACTICE stem                   " +
      (authWorks ? "yes" : "NO -- JWT is wrong, results are vacuous"));
    if (!(ctlAnon.status < 400 && ctlAnon.n > 0) || !authWorks) {
      console.log("");
      console.log("  UNSOUND. No verdict.");
      return 1;
    }

    /* ---------------- THE KEY ---------------- */
    console.log("");
    console.log("  correct_answer -- the column the whole sweep is about");
    for (const who of ["anon", "auth"]) {
      for (const [what, id] of [["secure", secure.id], ["practice", practice.id]]) {
        await line(who + " -> quiz_questions.correct_answer (" + what + ")",
          await probe("quiz_questions?select=correct_answer&id=eq." + id, who), "refused");
      }
    }

    /* ---------------- THE SECURE ROW AT ALL ---------------- */
    console.log("");
    console.log("  the SECURE row through any granted column");
    for (const who of ["anon", "auth"]) {
      await line(who + " -> quiz_questions.question_text (secure)",
        await probe("quiz_questions?select=question_text&id=eq." + secure.id, who), "refused");
      await line(who + " -> quiz_questions.explanation (secure)",
        await probe("quiz_questions?select=explanation&id=eq." + secure.id, who), "refused");
    }

    /* ---------------- PRACTICE TEXT: REPORTED, NOT A FINDING OF THIS CLASS ---------------- */
    console.log("");
    console.log("  PRACTICE text -- reported, not the section-1 class (practice, not secure)");
    for (const who of ["anon", "auth"]) {
      const r = await probe("quiz_questions?select=explanation&id=eq." + practice.id, who);
      console.log("         " + (who + " -> quiz_questions.explanation (practice)").padEnd(56) +
        (r.status >= 400 ? "HTTP " + r.status : r.n + " row(s), non-null: " + (r.cols.join("/") || "none")));
    }

    /* ---------------- EVERY VIEW OVER THE TABLE ---------------- */
    console.log("");
    console.log("  views over quiz_questions");
    for (const v of VIEWS) {
      for (const who of ["anon", "auth"]) {
        await line(who + " -> " + v, await probe(v + "?select=*&limit=1", who), "refused");
      }
    }

    console.log("");
    if (findings.length) {
      console.log("  " + findings.length + " LEAK(S): " + findings.join("; "));
    } else {
      console.log("  NO LEAK of a key or of a secure row through PostgREST, for either role.");
      console.log("  Both controls passed, so that is a measurement and not a silence.");
    }
    return findings.length ? 1 : 0;
  } finally {
    if (userId) {
      await fetch(PROJECT + "/auth/v1/admin/users/" + userId,
        { method: "DELETE", headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
      console.log("  synthetic learner deleted");
    }
  }
}
process.exitCode = await main();
