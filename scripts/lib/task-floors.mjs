/**
 * task-floors.mjs -- the ONE reader of `TASK-FLOORS-<CERT>.json` (ruled PROMPT-109 s4).
 *
 * `verify-cert` hard-coded 8 and so disagreed with the director's own ruling: it reported AIMS-F task
 * 5.5 "below floor" at 6 when 6 IS 5.5's floor, lowered in PROMPT-104 with the measurement behind it.
 * A checker that cannot see a ruling reports a conforming bank as failing, and a permanently red suite
 * teaches people to read red as normal.
 *
 * DEFAULT: min(default_floor, 2 x effective primaries) when an effective-primary count is supplied,
 * else `default_floor` from the file (8 where no file exists). The cap of 2 items per
 * (source, edition, clause) per task is what makes 2 x effective the ceiling a task can actually hold.
 *
 * AN OVERRIDE WITHOUT `ruled_in` IS AN ERROR, not a pass: an unattributed lowered floor is
 * indistinguishable from a typo, and it is the one edit that can make a thin task look finished.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_FLOOR = 8;

/**
 * @param {string} certCode e.g. "AIMS-F"
 * @returns {{defaultFloor:number, overrides:Map<string,{floor:number,ruled_in:string,reason:string}>,
 *            source:string, errors:string[]}}
 */
export function loadTaskFloors(certCode) {
  /* TWO SPELLINGS. The existing file is `TASK-FLOORS-AIMSF.json` for cert code `AIMS-F` -- the
   * convention drops the hyphen. Looking only for the literal code found no file and returned the
   * default 8 silently, which is exactly the shape of the bug this module was written to fix. Both
   * forms are tried and the one found is named in `source`. */
  const names = [certCode.replace(/-/g, ""), certCode]
    .map((n) => "TASK-FLOORS-" + n + ".json");
  const errors = [];
  const found = names.find((n) => existsSync(join(ROOT, n)));
  if (!found) {
    return { defaultFloor: DEFAULT_FLOOR, overrides: new Map(),
      source: "no file (tried " + names.join(", ") + "; default " + DEFAULT_FLOOR + ")", errors };
  }
  const path = join(ROOT, found);
  let doc;
  try { doc = JSON.parse(readFileSync(path, "utf8")); }
  catch (e) {
    errors.push(found + " is not readable JSON: " + (e && e.message));
    return { defaultFloor: DEFAULT_FLOOR, overrides: new Map(), source: "UNREADABLE", errors };
  }
  const defaultFloor = Number.isFinite(doc.default_floor) ? doc.default_floor : DEFAULT_FLOOR;
  const overrides = new Map();
  for (const [code, v] of Object.entries(doc.per_task_overrides || {})) {
    if (code.startsWith("_")) continue;          /* `_what` and friends are documentation, not tasks */
    const r = validateOverride(code, v);
    if (r.error) { errors.push(r.error); continue; }
    overrides.set(code, r.value);
  }
  return { defaultFloor, overrides, source: found, errors };
}

/**
 * Validate ONE override entry. Exported so the controls exercise the real rule rather than a copy
 * of it -- the `ruled_in` control used to mirror this logic inline, which proved only that the
 * mirror agreed with itself.
 *
 * ============ A TEMPORARY EXCEPTION (PROMPT-123 s3) ============
 *
 * `temporary: true` means the task goes live BELOW what its map should support, because the reason
 * it is short is a defect being fixed rather than a thin map. It is neither a pass nor a fail:
 * verify-cert reports it as a WARN and NAMES it, so the exception cannot quietly become standard.
 *
 * It must carry a REASON as well as a ruling. `ruled_in` says who allowed it; without the reason
 * nobody can later tell whether the condition that justified it still holds, and that is the only
 * thing that makes it temporary rather than permanent.
 *
 * @returns {{error:string|null, value:object|null}}
 */
export function validateOverride(code, v) {
  const bad = (why) => ({ error: code + ": " + why, value: null });
  if (!v || typeof v !== "object") return bad("override is not an object");
  if (!Number.isFinite(v.floor)) return bad("override has no numeric `floor`");
  if (!v.ruled_in || typeof v.ruled_in !== "string" || !v.ruled_in.trim()) {
    return bad("override has no `ruled_in` -- an unattributed floor is an error, not a pass");
  }
  const temporary = v.temporary === true;
  if (temporary && !String(v.reason || "").trim()) {
    return bad("a temporary exception has no `reason` -- a temporary floor nobody can re-examine " +
      "is a permanent one");
  }
  return { error: null,
    value: { floor: v.floor, ruled_in: v.ruled_in, reason: v.reason || "", temporary } };
}

/**
 * The floor for one task. `effectivePrimaries` is optional; when given, the derived ceiling applies.
 * @returns {{floor:number, why:string}}
 */
export function floorFor(taskCode, floors, effectivePrimaries = null) {
  const ov = floors.overrides.get(taskCode);
  if (ov) {
    return { floor: ov.floor, why: "override " + ov.ruled_in + (ov.temporary ? " (TEMPORARY)" : ""),
      temporary: ov.temporary === true, ruled_in: ov.ruled_in, reason: ov.reason };
  }
  if (Number.isFinite(effectivePrimaries)) {
    const derived = Math.min(floors.defaultFloor, 2 * effectivePrimaries);
    return { floor: derived, why: "min(" + floors.defaultFloor + ", 2 x " + effectivePrimaries + " effective)" };
  }
  return { floor: floors.defaultFloor, why: "default" };
}

/** Both directions, and the two cases PROMPT-109 s4 names by number. */
export function taskFloorControls() {
  const cases = [];
  const ok = (what, pass) => cases.push({ what, pass });

  const real = loadTaskFloors("AIMS-F");
  ok("AIMS-F floors file is readable with no errors", real.errors.length === 0);
  ok("default_floor is 8", real.defaultFloor === 8);
  ok("5.5 carries an override", real.overrides.has("5.5"));
  ok("5.5's floor is 6", floorFor("5.5", real).floor === 6);
  ok("5.5's floor names its ruling", /PROMPT-104/.test(floorFor("5.5", real).why));
  ok("4.1's floor is 7", floorFor("4.1", real).floor === 7);
  ok("a task with no override gets the default", floorFor("1.1", real).floor === 8);

  /* THE TWO CASES RULED BY NUMBER: 5.5 at 6 passes, 5.5 at 5 fails. */
  const f55 = floorFor("5.5", real).floor;
  ok("5.5 holding 6 items is AT floor (passes)", 6 >= f55);
  ok("5.5 holding 5 items is BELOW floor (fails)", !(5 >= f55));

  /* the derived default, and that it never exceeds default_floor */
  ok("2 effective primaries derives a floor of 4", floorFor("9.9", real, 2).floor === 4);
  ok("9 effective primaries is capped at default_floor", floorFor("9.9", real, 9).floor === 8);

  /* AN OVERRIDE WITHOUT `ruled_in` IS AN ERROR. Through the REAL validator, not a mirror of it. */
  {
    const synth = { defaultFloor: 8, overrides: new Map(), source: "synthetic", errors: [] };
    ok("an override with no ruled_in is rejected",
      !!validateOverride("9.9", { floor: 3 }).error);
    ok("...and such a task falls back to the default rather than to 3",
      floorFor("9.9", synth).floor === 8);
    ok("an override with a ruled_in is accepted",
      validateOverride("9.9", { floor: 3, ruled_in: "PROMPT-X" }).error === null);
    ok("an override with no numeric floor is rejected",
      !!validateOverride("9.9", { ruled_in: "PROMPT-X" }).error);

    /* ============ TEMPORARY EXCEPTIONS (PROMPT-123 s3), BOTH DIRECTIONS ============ */
    ok("a temporary exception WITHOUT ruled_in fails",
      !!validateOverride("1.6", { floor: 0, temporary: true, reason: "a reason" }).error);
    ok("a temporary exception WITHOUT a reason fails",
      !!validateOverride("1.6", { floor: 0, temporary: true, ruled_in: "PROMPT-123 s3" }).error);
    ok("a temporary exception WITH both is accepted",
      validateOverride("1.6", { floor: 0, temporary: true, ruled_in: "PROMPT-123 s3",
        reason: "gate defects fixed in s2; rescues pending read" }).error === null);
    ok("...and it is marked temporary",
      validateOverride("1.6", { floor: 0, temporary: true, ruled_in: "PROMPT-123 s3",
        reason: "r" }).value.temporary === true);
    ok("a NON-temporary override is not marked temporary",
      validateOverride("1.6", { floor: 4, ruled_in: "PROMPT-111 s2" }).value.temporary === false);
    ok("a non-temporary override needs no reason",
      validateOverride("1.6", { floor: 4, ruled_in: "PROMPT-111 s2" }).error === null);
    ok("`temporary: 'yes'` is NOT temporary -- only the boolean counts",
      validateOverride("1.6", { floor: 4, ruled_in: "P", temporary: "yes" }).value.temporary === false);
    /* and floorFor must carry the flag through, or verify-cert cannot warn on it */
    const tmp = { defaultFloor: 8, source: "synthetic", errors: [],
      overrides: new Map([["1.6", { floor: 0, ruled_in: "PROMPT-123 s3", reason: "r", temporary: true }]]) };
    ok("floorFor carries `temporary` through", floorFor("1.6", tmp).temporary === true);
    ok("floorFor names it TEMPORARY in `why`", /TEMPORARY/.test(floorFor("1.6", tmp).why));
    ok("floorFor on a task with no override reports no temporary flag",
      floorFor("9.9", tmp).temporary !== true);
  }

  const missing = loadTaskFloors("NO-SUCH-CERT-ZZ");
  ok("a cert with no floors file gets default 8 and no error",
    missing.defaultFloor === 8 && missing.overrides.size === 0 && missing.errors.length === 0);

  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}
