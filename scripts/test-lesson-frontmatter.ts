/**
 * test-lesson-frontmatter.ts - the frontmatter parser, exercised.
 *
 *   deno run --allow-read scripts/test-lesson-frontmatter.ts
 *
 * READ-ONLY. No network, no database, no credential. It imports the REAL module
 * rather than restating its logic, because a third implementation of this parser
 * is how the defect below survived.
 *
 * ============ WHAT IT WAS DOING ============
 *
 * `task_codes: ["1.1"]` parsed to `["\"1.1\""]`. The inline-array branch, the
 * indented-list branch and the scalar branch all lacked quote stripping, which
 * `certidemy-web/lib/lessons/parser.ts` has had all along in a `stripQuotes`
 * helper. 618 lessons corpus-wide; SM-AI-II is 132 of 132 and is the only
 * certification in the set that is served.
 *
 * The quoting is REQUIRED, not stylistic. Every affected title contains a colon
 * -- `"Impedimentos: identificarlos y eliminarlos"` -- which YAML cannot carry
 * unquoted. The content was right and the parser was wrong, so "unquote the
 * content" would have broken the frontmatter it was meant to fix.
 *
 * ============ THE ORDER OF OPERATIONS IS THE SUBTLE PART ============
 *
 * Quotes come off BEFORE the number test. `13` is a number and `"13"` is a
 * string, and stripping after the test would have collapsed them -- turning an
 * author's deliberate string into a number on a served field. Both directions
 * are asserted below; only one of them is the bug everyone was looking at.
 */
import { parseLesson } from "../functions/_shared/lesson-blocks.ts";

let pass = 0;
const fails: string[] = [];

function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) {
    pass++;
    console.log(`  PASS  ${name}  ${g}`);
  } else {
    fails.push(`${name}: got ${g}, want ${w}`);
    console.log(`  FAIL  ${name}\n        got  ${g}\n        want ${w}`);
  }
}

const fm = (body: string) =>
  parseLesson(`---\n${body}\n---\n\n::concept\ntext\n::\n`).frontmatter as Record<string, unknown>;

console.log("\n1. THE DEFECT: quotes in all three value paths");
eq("inline array, double quotes", fm(`task_codes: ["1.1", "2.2"]`).task_codes, ["1.1", "2.2"]);
eq("inline array, single quotes", fm(`task_codes: ['1.1']`).task_codes, ["1.1"]);
eq("inline array, unquoted", fm(`task_codes: [1.1, 2.2]`).task_codes, ["1.1", "2.2"]);
eq("indented list, quoted", fm(`concept_slugs:\n  - "a-slug"\n  - 'b-slug'`).concept_slugs, ["a-slug", "b-slug"]);
eq("indented list, unquoted", fm(`concept_slugs:\n  - a-slug`).concept_slugs, ["a-slug"]);
eq("scalar, quoted (a colon forced it)", fm(`title: "Impedimentos: identificarlos"`).title, "Impedimentos: identificarlos");
eq("scalar, unquoted", fm(`title: Two Rules, One Sprint`).title, "Two Rules, One Sprint");

console.log("\n2. THE OTHER DIRECTION: what must NOT change");
eq("bare number stays a number", fm(`duration_minutes: 13`).duration_minutes, 13);
eq("QUOTED number stays a string", fm(`duration_minutes: "13"`).duration_minutes, "13");
eq("an apostrophe mid-value is not a quote pair", fm(`title: It's fine`).title, "It's fine");
eq("a lone leading quote is not a pair", fm(`title: "unbalanced`).title, `"unbalanced`);
eq("empty inline array", fm(`prerequisites: []`).prerequisites, []);
eq("block scalar keeps its shape", fm(`preview: |\n  line one\n  line two`).preview, "line one\nline two");

console.log("\n3. CONTROLS -- the harness must be able to fail");
{
  // If parseLesson were a stub returning {}, every assertion above would read
  // `undefined` against `undefined` for the absent keys and could pass by
  // accident. This proves the module under test actually parses.
  const real = fm(`title: x\nduration_minutes: 4`);
  eq("the real module was imported, not a stub", Object.keys(real).sort(), ["duration_minutes", "title"]);
  // And that it discriminates: two different inputs must not give one answer.
  const a = fm(`title: "quoted"`).title;
  const b = fm(`title: quoted`).title;
  eq("quoted and unquoted converge only after stripping", [a, b], ["quoted", "quoted"]);
  const c = fm(`duration_minutes: 13`).duration_minutes;
  const d = fm(`duration_minutes: "13"`).duration_minutes;
  eq("but number and quoted-number stay distinct", [typeof c, typeof d], ["number", "string"]);
}

console.log("");
console.log(`passed ${pass}   failed ${fails.length}`);
for (const f of fails) console.log(`  X ${f}`);
console.log("");
console.log(fails.length ? "FRONTMATTER PARSER FAILED." : "Quotes come off; types survive.");
if (fails.length) Deno.exit(1);
