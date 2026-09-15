#!/usr/bin/env node
/**
 * smoke-analyzer-access.mjs - who may pull a curriculum coverage report?
 *
 * WRITES. `--apply` to run for real; dry by default, and a dry run prints the
 * fixtures it would create and makes no request. Unknown flags exit 2.
 *
 *   node --dns-result-order=ipv4first scripts/smoke-analyzer-access.mjs
 *   node --dns-result-order=ipv4first scripts/smoke-analyzer-access.mjs --apply
 *
 * Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY. The
 * anon key is not optional: the property under test is what a real browser
 * session can do, and a real browser session is a password sign-in against the
 * anon key. A service-role call would prove nothing -- see below.
 *
 * ===================== WHY THIS EXISTS =====================
 *
 * analyze-curriculum has two ways in: platform_admin, and a partner company
 * holding the `curriculum_coverage` feature. THE PARTNER BRANCH HAD NEVER
 * EXECUTED. Not once, for anyone, since the function was deployed.
 *
 * `public.company_features` has been EMPTY platform-wide since it was created:
 * zero rows, zero distinct feature keys. `company_has_feature` therefore
 * answered false for every argument it was ever passed, so every partner call
 * 403-ed before reaching anything. The branch read as working because nothing
 * could reach it.
 *
 * What it actually did, until 2026-09-15, was take `body.company_id` and hand
 * it straight to `company_has_feature` -- a pure lookup over company_features
 * that says nothing about who is asking. Any authenticated learner JWT plus a
 * granted company's id was a complete authorization, and `analysis_runs`
 * recorded the run against whatever company id arrived in the body.
 *
 * SO THE EMPTY TABLE WAS THE ONLY CONTROL, and "leave the table empty" is not
 * a fix -- the first row ever written to company_features is also the moment
 * the tool is sold to its first partner. This script exists so that row is not
 * the first time the branch runs.
 *
 * ===================== WHY IT CREATES FIXTURES =====================
 *
 * It cannot test what it cannot reach. Three distinct identities are needed and
 * none exists on this platform:
 *
 *   ADMIN_G   team_admin of a company holding curriculum_coverage
 *   MEMBER_G  plain team_member of that SAME company
 *   ADMIN_H   team_admin of a DIFFERENT company, with no grant
 *
 * MEMBER_G is the one that matters most and the one a hand-test would skip. A
 * coverage report is commercial information about a partner's own product;
 * membership is too wide a door, and the difference between "belongs to the
 * company" and "administers the company" is invisible unless someone holds both
 * and only one gets in.
 *
 * ===================== THE GRANT SELF-EXPIRES =====================
 *
 * The company_features row this script writes carries `expires_at = now() + 15
 * minutes`. company_has_feature checks expires_at, so even a teardown that dies
 * halfway leaves a grant that closes itself. A test whose cleanup failure is a
 * live entitlement is not a test worth running.
 *
 * Teardown still runs in a finally, still verifies itself, and prints exact
 * recovery SQL if any part of it fails.
 *
 * ===================== WHAT MAKES A REFUSAL MEAN ANYTHING =====================
 *
 * Six 403s is the result a completely broken deployment produces. A wrong URL,
 * a 500 on every body, a grant insert that silently failed -- each refuses
 * everything, and each passes a test that only counts refusals. So three
 * controls run FIRST and are hard requirements:
 *
 *   GRANTED    company_has_feature(G, curriculum_coverage) must be TRUE and
 *              company_has_feature(H, ...) must be FALSE, read back from the
 *              database after the insert. Without this, every 403 below is
 *              consistent with "the fixture never landed", which is exactly the
 *              state this whole function spent its life in.
 *
 *   SERVES     ADMIN_G must receive a report. If the entitled caller is refused
 *              too, the refusals prove the endpoint is broken, not guarded.
 *
 *   ALIVE      an unauthenticated request must be refused by the platform
 *              (verify_jwt = true), which also pins that the pin is still in
 *              config.toml.
 *
 * ===================== BOTH DIRECTIONS ON tables_read =====================
 *
 * `tables_read` lists internal table names and is now admin-only. Asserting a
 * partner does not receive it passes cleanly against a response that dropped it
 * for everybody, so the other half needs a real platform_admin. Supply
 * CERTIDEMY_ADMIN_EMAIL / CERTIDEMY_ADMIN_PASSWORD to test it.
 *
 * IT DELIBERATELY DOES NOT CREATE ONE. Every other fixture here is bounded --
 * a company nobody uses, a grant that expires, a learner with no seats. A
 * platform_admin is not: the role clears 45 RLS policies across 42 tables, and
 * a transient one whose teardown fails is a live administrator account. When
 * the credentials are absent this reports UNTESTED and says so in the verdict.
 * AN UNTESTED CONTROL IS NEVER COUNTED AS A PASS.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const HERE = dirname(fileURLToPath(import.meta.url));
// The anon key lives in the sibling web repo -- it is a NEXT_PUBLIC_ value and
// public by design, and that is the only copy of it on a normal workstation.
// Named explicitly rather than discovered, so a missing key is an absent file
// and not a silent skip.
for (const p of [
  join(HERE, ".env"),
  join(HERE, "..", ".env"),
  join(HERE, "..", "..", ".env"),
  join(HERE, "..", "..", "certidemy-web", ".env.local"),
]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/*
 * TWO FLAG CONVENTIONS EXIST IN THIS DIRECTORY AND THEY ARE OPPOSITES. This
 * script is the --apply family: dry by default, --apply to write. `--dry` is
 * NOT a flag here and exits 2 rather than being ignored, because a reader who
 * believes in it would otherwise be running the live path while reading a word
 * that means the opposite.
 */
const KNOWN = new Set(["--apply", "--url", "--cert", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("This script is the --apply family: DRY BY DEFAULT, --apply to write.");
    console.error("`--dry` is not a flag here and does not make anything safer.");
    console.error("Known flags: --apply, --url, --cert, --verbose.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");

const PROJECT_REF = "pctynukndxnmnxiqpgck";
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = arg("url", `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1`);
const ENDPOINT = `${BASE.replace(/\/+$/, "")}/analyze-curriculum`;
const CERT = arg("cert", "AISM-I");
const FEATURE = "curriculum_coverage";

const ADMIN_EMAIL = process.env.CERTIDEMY_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.CERTIDEMY_ADMIN_PASSWORD ?? "";

/*
 * Long enough that the density gate has something to chew on. The analyzer's
 * verdict is irrelevant here -- a suppressed coverage number is still a 200 and
 * still proves the caller got in -- but a one-word body invites a 400 that
 * would read as a refusal.
 */
const SAMPLE_TEXT = [
  "Module 1. Introduction to service management for artificial intelligence.",
  "This programme covers the service value system, governance of AI services,",
  "incident and problem management, change enablement, continual improvement,",
  "supplier management, service level management, and the practices required to",
  "operate machine learning systems in production. Participants learn to define",
  "service levels, monitor model performance, manage drift, and escalate",
  "incidents through an agreed process. The course also addresses risk",
  "management, stakeholder communication, documentation practices, and the",
  "measurement of value delivered to the organisation and its customers.",
].join(" ").repeat(6);

/* ----------------------------------------------------------------- harness */

let passed = 0;
const failures = [];
const untested = [];

function record(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name} -- ${detail}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${detail}`);
  }
}
function skip(name, why) {
  untested.push(`${name} -- ${why}`);
  console.log(`  UNTESTED  ${name}`);
  console.log(`            ${why}`);
}

/**
 * A TRANSPORT FAILURE IS NOT A REFUSAL. Returned as `reached: false` so a
 * timeout can never be counted as the boundary holding -- an unreachable host
 * refuses everything, which is the exact misreading this script exists to rule
 * out.
 */
async function post(token, body) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: ANON_KEY,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* a non-JSON body is still evidence */ }
    if (VERBOSE) console.log(`        <- ${res.status} ${text.slice(0, 240)}`);
    return { reached: true, status: res.status, text, json };
  } catch (e) {
    const why = e?.cause?.code ?? e?.name ?? String(e);
    if (VERBOSE) console.log(`        <- unreachable: ${why}`);
    return { reached: false, status: 0, text: "", json: null, why };
  }
}

const reportBody = (companyId) => ({
  text: SAMPLE_TEXT,
  mode: "report",
  certification_code: CERT,
  // Nothing is persisted. analysis_runs is a commercial record and this is a
  // test; the property under test is who gets IN, which is decided before the
  // insert is reached.
  persist: false,
  ...(companyId === undefined ? {} : { company_id: companyId }),
});

/** A refusal must be a refusal AND must carry no report. */
function refused(name, res) {
  if (!res.reached) {
    skip(name, `the endpoint was not reached (${res.why}); a timeout refuses everything`);
    return;
  }
  const isRefusal = res.status === 401 || res.status === 403;
  record(`${name} is refused`, isRefusal, `HTTP ${res.status}: ${res.text.slice(0, 200)}`);
  const carriesReport = res.json?.report != null || res.json?.results != null;
  record(`${name} carries no report`, !carriesReport, `body: ${res.text.slice(0, 200)}`);
}

/* ------------------------------------------------------------------ preflight */

console.log("");
console.log(`smoke-analyzer-access -- ${ENDPOINT}`);
console.log(`certification: ${CERT}   feature: ${FEATURE}`);
console.log(APPLY ? "mode: APPLY (fixtures will be created and removed)" : "mode: DRY");
console.log("");

const stamp = Date.now().toString(36);
const NAME_G = `zz-smoke-analyzer-granted-${stamp}`;
const NAME_H = `zz-smoke-analyzer-other-${stamp}`;
const mail = (who) => `zz-smoke-analyzer-${who}-${stamp}@certidemy-test.invalid`;
const PASSWORD = `Sm0ke!${stamp}!aZ`;

if (!APPLY) {
  console.log("Would create:");
  console.log(`  company   ${NAME_G}   + ${FEATURE} grant, expires_at = now + 15 min`);
  console.log(`  company   ${NAME_H}   no grant`);
  console.log(`  user      ${mail("adming")}   team_admin of ${NAME_G}`);
  console.log(`  user      ${mail("memberg")}  team_member of ${NAME_G}`);
  console.log(`  user      ${mail("adminh")}   team_admin of ${NAME_H}`);
  console.log("");
  console.log("Then 3 controls and 6 authorization assertions, then remove all of it.");
  console.log("");
  console.log("A DRY RUN HAS TESTED NOTHING. It made no request and reached no endpoint.");
  console.log("Re-run with --apply.");
  // Named here rather than enforced, so a dry run still prints the plan on a
  // machine with no keys -- and so the operator learns what --apply will need
  // BEFORE it has created half a fixture set.
  const missing = [
    SERVICE_KEY ? null : "SUPABASE_SERVICE_ROLE_KEY",
    ANON_KEY ? null : "SUPABASE_ANON_KEY",
  ].filter(Boolean);
  if (missing.length) {
    console.log("");
    console.log(`--apply will refuse: ${missing.join(", ")} not set.`);
  }
  process.exit(0);
}

/*
 * PAST THIS POINT THE SCRIPT WRITES. Both keys are hard requirements and the
 * anon key is not a convenience: the property under test is what a real browser
 * session can do, and that is a password sign-in against the anon key. Running
 * the assertions as service-role would hold both credentials and measure the
 * system against itself -- the failure smoke-courseware recorded against the
 * paywall, in a second place.
 */
if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set. Fixtures cannot be created.");
  process.exit(2);
}
if (!ANON_KEY) {
  console.error("SUPABASE_ANON_KEY is not set. A service-role run would prove nothing.");
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const created = { companies: [], users: [] };

async function makeUser(who) {
  const email = mail(who);
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${who}: ${error.message}`);
  created.users.push(data.user.id);
  return { id: data.user.id, email };
}

async function signIn(email) {
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return data.session.access_token;
}

async function makeCompany(name) {
  const { data, error } = await sb
    .from("companies")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw new Error(`company ${name}: ${error.message}`);
  created.companies.push(data.id);
  return data.id;
}

/* ---------------------------------------------------------------- fixtures */

let tokens = {};
let companyG = null;
let companyH = null;

try {
  console.log("Fixtures");
  companyG = await makeCompany(NAME_G);
  companyH = await makeCompany(NAME_H);

  const adminG = await makeUser("adming");
  const memberG = await makeUser("memberg");
  const adminH = await makeUser("adminh");

  // The profile is written by on_auth_user_created, a trigger that exists only
  // in the live database and in no migration. If it ever goes missing this loop
  // is what says so, rather than six unexplained 403s downstream.
  for (const u of [adminG, memberG, adminH]) {
    const { data, error } = await sb
      .from("profiles")
      .select("id, platform_role")
      .eq("id", u.id)
      .maybeSingle();
    if (error) throw new Error(`profile read ${u.email}: ${error.message}`);
    if (!data) throw new Error(`no profile row for ${u.email} -- on_auth_user_created did not fire`);
    if (data.platform_role !== "learner") {
      throw new Error(`${u.email} is ${data.platform_role}, expected learner`);
    }
  }

  const { error: tmErr } = await sb.from("team_members").insert([
    { company_id: companyG, user_id: adminG.id, role: "team_admin" },
    { company_id: companyG, user_id: memberG.id, role: "team_member" },
    { company_id: companyH, user_id: adminH.id, role: "team_admin" },
  ]);
  if (tmErr) throw new Error(`team_members: ${tmErr.message}`);

  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error: cfErr } = await sb.from("company_features").insert({
    company_id: companyG,
    feature_key: FEATURE,
    expires_at: expires,
    notes: "smoke-analyzer-access.mjs, self-expiring, safe to delete",
  });
  if (cfErr) throw new Error(`company_features: ${cfErr.message}`);

  console.log(`  company G ${companyG}  (granted, expires ${expires})`);
  console.log(`  company H ${companyH}  (no grant)`);
  console.log("");

  tokens = {
    adminG: await signIn(adminG.email),
    memberG: await signIn(memberG.email),
    adminH: await signIn(adminH.email),
  };

  /* ------------------------------------------------------------- controls */

  console.log("CONTROLS -- without these, every refusal below is also what a broken");
  console.log("deployment produces");

  {
    // GRANTED. Read back through the same function the endpoint calls, so this
    // proves the path the endpoint takes, not merely that a row exists.
    const { data: gG, error: eG } = await sb.rpc("company_has_feature", {
      p_company_id: companyG,
      p_feature_key: FEATURE,
    });
    const { data: gH, error: eH } = await sb.rpc("company_has_feature", {
      p_company_id: companyH,
      p_feature_key: FEATURE,
    });
    if (eG || eH) {
      record("GRANTED control", false, `rpc error: ${eG?.message ?? eH?.message}`);
    } else {
      record("GRANTED  company G holds the feature", gG === true, `company_has_feature(G) = ${gG}`);
      record("GRANTED  company H does not", gH === false, `company_has_feature(H) = ${gH}`);
    }
  }

  const servesRes = await post(tokens.adminG, reportBody(undefined));
  if (!servesRes.reached) {
    skip("SERVES  a team_admin of the granted company receives a report",
      `the endpoint was not reached (${servesRes.why})`);
  } else {
    record(
      "SERVES  a team_admin of the granted company receives a report",
      servesRes.status === 200 && servesRes.json?.report != null,
      `HTTP ${servesRes.status}: ${servesRes.text.slice(0, 240)}`,
    );
  }

  refused("ALIVE   an unauthenticated request", await post(null, reportBody(companyG)));

  /* -------------------------------------------------- the property itself */

  console.log("");
  console.log("AUTHORIZATION");

  {
    const res = await post(tokens.adminG, reportBody(companyG));
    if (!res.reached) {
      skip("a team_admin naming their own company is served", `not reached (${res.why})`);
    } else {
      record(
        "a team_admin naming their own company is served",
        res.status === 200 && res.json?.report != null,
        `HTTP ${res.status}: ${res.text.slice(0, 200)}`,
      );
      // The partner-facing half of the tables_read property.
      record(
        "a partner response carries no tables_read",
        res.json?.tables_read === undefined,
        `tables_read: ${JSON.stringify(res.json?.tables_read)}`,
      );
      // Filtered server-side, so no renderer can leak one.
      const internal = (res.json?.report?.integrity ?? []).filter(
        (f) => f.visibility === "internal",
      );
      record(
        "a partner response carries no internal-only finding",
        internal.length === 0,
        `${internal.length} internal finding(s) present`,
      );
    }
  }

  // THE ONE A HAND-TEST SKIPS. Same company, same grant, one role down.
  refused(
    "a plain team_member of the granted company, naming it",
    await post(tokens.memberG, reportBody(companyG)),
  );
  refused(
    "a plain team_member of the granted company, naming nothing",
    await post(tokens.memberG, reportBody(undefined)),
  );

  // THE ONE THE OLD CODE ALLOWED. A real team_admin, a real grant, someone
  // else's company id.
  refused(
    "a team_admin of another company passing the granted company's id",
    await post(tokens.adminH, reportBody(companyG)),
  );
  refused(
    "a team_admin of a company with no grant",
    await post(tokens.adminH, reportBody(undefined)),
  );

  /* ------------------------------------- the other direction on tables_read */

  console.log("");
  console.log("ADMIN DIRECTION");

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sess, error: sErr } = await anon.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (sErr) {
      skip("a platform_admin still receives tables_read", `admin sign-in failed: ${sErr.message}`);
    } else {
      const res = await post(sess.session.access_token, reportBody(undefined));
      if (!res.reached) {
        skip("a platform_admin still receives tables_read", `not reached (${res.why})`);
      } else {
        record(
          "a platform_admin is served",
          res.status === 200 && res.json?.report != null,
          `HTTP ${res.status}: ${res.text.slice(0, 200)}`,
        );
        record(
          "a platform_admin still receives tables_read",
          Array.isArray(res.json?.tables_read) && res.json.tables_read.length > 0,
          `tables_read: ${JSON.stringify(res.json?.tables_read)}`,
        );
      }
    }
  } else {
    skip(
      "a platform_admin still receives tables_read",
      "CERTIDEMY_ADMIN_EMAIL / CERTIDEMY_ADMIN_PASSWORD are not set. Proving a " +
        "partner does not receive tables_read passes just as cleanly against a " +
        "response that dropped it for everyone, so only this half tells those apart.",
    );
  }
} catch (err) {
  failures.push(`fixtures -- ${err.message}`);
  console.log("");
  console.log(`  FAIL  fixtures: ${err.message}`);
} finally {
  /* ----------------------------------------------------------- teardown */

  console.log("");
  console.log("Teardown");
  const leaks = [];

  for (const id of created.companies) {
    const { error } = await sb.from("company_features").delete().eq("company_id", id);
    if (error) leaks.push(`company_features for ${id}: ${error.message}`);
  }
  for (const id of created.companies) {
    const { error } = await sb.from("team_members").delete().eq("company_id", id);
    if (error) leaks.push(`team_members for ${id}: ${error.message}`);
  }
  for (const id of created.users) {
    // profiles.id references auth.users ON DELETE CASCADE (confdeltype 'c'),
    // so the profile goes with the user.
    const { error } = await sb.auth.admin.deleteUser(id);
    if (error) leaks.push(`user ${id}: ${error.message}`);
  }
  for (const id of created.companies) {
    const { error } = await sb.from("companies").delete().eq("id", id);
    if (error) leaks.push(`company ${id}: ${error.message}`);
  }

  // TEARDOWN ASSERTS ITSELF. "delete returned no error" is the same class of
  // claim as every other silent success in this repo; the only evidence that
  // the grant is gone is reading the grant back.
  const { count, error: verifyErr } = await sb
    .from("company_features")
    .select("company_id", { count: "exact", head: true })
    .in("company_id", created.companies.length ? created.companies : [
      "00000000-0000-0000-0000-000000000000",
    ]);
  if (verifyErr) {
    leaks.push(`could not verify company_features is clean: ${verifyErr.message}`);
  } else if (count !== 0) {
    leaks.push(`${count} company_features row(s) survive teardown`);
  }

  if (leaks.length === 0) {
    console.log("  clean -- every fixture removed and the grant verified gone");
  } else {
    console.log("  TEARDOWN INCOMPLETE:");
    for (const l of leaks) console.log(`    X ${l}`);
    console.log("");
    console.log("  The grant carries expires_at = now + 15 min and closes itself, but");
    console.log("  remove the rows anyway:");
    for (const id of created.companies) {
      console.log(`    delete from public.company_features where company_id = '${id}';`);
      console.log(`    delete from public.team_members    where company_id = '${id}';`);
      console.log(`    delete from public.companies       where id         = '${id}';`);
    }
    for (const id of created.users) {
      console.log(`    -- auth user ${id} (delete via the dashboard or the admin API)`);
    }
    failures.push(`teardown -- ${leaks.length} item(s) not removed`);
  }
}

/* ------------------------------------------------------------------ verdict */

console.log("");
console.log(`passed:   ${passed}`);
console.log(`failed:   ${failures.length}`);
console.log(`untested: ${untested.length}`);
for (const f of failures) console.log(`  X ${f}`);

if (untested.length > 0) {
  console.log("");
  console.log("UNTESTED IS NOT PASSED:");
  for (const u of untested) console.log(`  ? ${u}`);
}

console.log("");
if (failures.length > 0) {
  console.log("ANALYZER ACCESS FAILED.");
} else if (untested.length > 0) {
  console.log("Every unentitled caller was refused and an entitled one was served --");
  console.log("but not every control ran. Not a clean result.");
} else {
  console.log("Every unentitled caller was refused, an entitled one was served, and");
  console.log("the grant was proved live at the time of the refusals.");
}
/* ===================================================================== */
/*  NOTHING CALLS process.exit() AFTER A fetch().                        */
/*                                                                       */
/*  Exiting while undici still holds a keep-alive socket trips a libuv   */
/*  assertion on Windows:                                                */
/*                                                                       */
/*    Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),            */
/*    file src\win\async.c, line 76                              */
/*                                                                       */
/*  It fired here on the run that closed this branch -- nine requests to */
/*  the same host, every one of them keep-alive, and then an immediate   */
/*  exit. mint-issuer-key.mjs carries the same note and the same fix:    */
/*  set process.exitCode and let the loop drain on its own. The status   */
/*  the caller sees is identical and the assertion has nothing to trip   */
/*  on.                                                                  */
/*                                                                       */
/*  THE FOUR process.exit() CALLS ABOVE ARE DELIBERATELY UNTOUCHED --    */
/*  unknown flag, dry-run end, and the two missing-key refusals. Every   */
/*  one of them is reached BEFORE any fetch, so there are no handles to  */
/*  tear down, and aborting instantly is the entire point of them.       */
/*                                                                       */
/*  IT MATTERS MORE HERE THAN IN A MINT. An assertion failure aborts the */
/*  process, and the teardown above runs in a finally -- so an exit that */
/*  crashes on the way out could, in a slightly different arrangement,   */
/*  be the thing that leaves a live feature grant behind. The grant's    */
/*  15-minute expiry is the backstop; not crashing is the fix.           */
/* ===================================================================== */
process.exitCode = failures.length === 0 ? 0 : 1;
