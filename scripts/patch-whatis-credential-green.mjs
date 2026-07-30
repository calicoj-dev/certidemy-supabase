/**
 * patch-whatis-credential-green.mjs
 *
 * Gives the Credential box in the "how it works" row a success treatment: pale
 * green fill, green border, deep green label - and the caption beneath it too.
 *
 * WHY IT SHOULD NOT SHARE A COLOUR WITH THE EXAM BOX
 *
 * v2 drew Examination and Credential identically in accent pink, because both
 * were "the paid part". But they are different kinds of thing: the examination is
 * a gate, and the credential is the outcome. Drawing them the same makes the row
 * read as two steps of one transaction rather than as a process that arrives
 * somewhere.
 *
 * Green also does something the pink cannot: it marks the end state as a result
 * worth reaching, which is the whole argument of the document.
 *
 * COLOURS are the green-50 / green-500 / green-700 family, which prints cleanly
 * and is far enough from the accent to read as a different signal rather than a
 * variant of it.
 *
 * THE TONE ARRAY replaces the boolean. Three states now exist - plain, accent,
 * success - and a boolean cannot carry three. Worth doing properly because the
 * next box added to this row will want its own.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-whatis-credential-green.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-whatis-credential-green.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "C:/Users/Juan/Documents/certidemy/supabase/functions/_shared/whatis.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. version bump -------------------------------------------------- */

const A1_FROM = [
  " * 2 - affirmative closing section, attempt wording, redundant Spanish label",
  " *     fixed, catalogue spacing",
  " */",
  'export const WHATIS_RENDERER_VERSION = "2";',
].join("\n");

const A1_TO = [
  " * 2 - affirmative closing section, attempt wording, redundant Spanish label",
  " *     fixed, catalogue spacing",
  " * 3 - the credential box reads as success rather than as a second paid step",
  " */",
  'export const WHATIS_RENDERER_VERSION = "3";',
].join("\n");

/* ---- 2. the success palette ------------------------------------------ */

const A2_FROM =
  "const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);";

const A2_TO = [
  "const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);",
  "",
  "/**",
  " * Success family, for the one box in this document that represents an outcome",
  " * rather than a step. Far enough from the accent to read as a different signal",
  " * rather than a variant of it, and all three print cleanly.",
  " */",
  "const SUCCESS = rgb(0x15 / 255, 0x80 / 255, 0x3d / 255);",
  "const SUCCESS_MID = rgb(0x22 / 255, 0xc5 / 255, 0x5e / 255);",
  "const SUCCESS_SOFT = rgb(0xf0 / 255, 0xfd / 255, 0xf4 / 255);",
].join("\n");

/* ---- 3. tones instead of a boolean ----------------------------------- */

const A3_FROM = [
  "    const labels = [S.fLearn, S.fPractice, S.fExam, S.fCred];",
  "    // First two free, third is the paid step, fourth is public.",
  "    const filled = [false, false, true, true];",
  "",
  "    labels.forEach((label, i) => {",
  "      const x = M + i * (BW + GAP);",
  "      page.drawRectangle({",
  "        x,",
  "        y: top - BH,",
  "        width: BW,",
  "        height: BH,",
  "        color: filled[i] ? ACCENT_SOFT : undefined,",
  "        borderColor: filled[i] ? ACCENT : HAIRLINE,",
  "        borderWidth: filled[i] ? 0.9 : 0.7,",
  "      });",
  "      centered(",
  "        label,",
  "        x + BW / 2,",
  "        top - BH / 2 - 3,",
  "        8.5,",
  "        semi,",
  "        filled[i] ? ACCENT_DEEP : INK,",
  "      );",
].join("\n");

const A3_TO = [
  "    const labels = [S.fLearn, S.fPractice, S.fExam, S.fCred];",
  "    // Three states, so not a boolean: the first two are free and open, the",
  "    // examination is the paid gate, and the credential is the OUTCOME - a",
  "    // different kind of thing that should not share the gate's colour.",
  '    const tones: ("plain" | "accent" | "success")[] = [',
  '      "plain",',
  '      "plain",',
  '      "accent",',
  '      "success",',
  "    ];",
  "",
  "    labels.forEach((label, i) => {",
  "      const x = M + i * (BW + GAP);",
  "      const tone = tones[i];",
  "      page.drawRectangle({",
  "        x,",
  "        y: top - BH,",
  "        width: BW,",
  "        height: BH,",
  "        color:",
  '          tone === "success"',
  "            ? SUCCESS_SOFT",
  '            : tone === "accent"',
  "              ? ACCENT_SOFT",
  "              : undefined,",
  "        borderColor:",
  '          tone === "success"',
  "            ? SUCCESS_MID",
  '            : tone === "accent"',
  "              ? ACCENT",
  "              : HAIRLINE,",
  '        borderWidth: tone === "plain" ? 0.7 : 1,',
  "      });",
  "      centered(",
  "        label,",
  "        x + BW / 2,",
  "        top - BH / 2 - 3,",
  "        8.5,",
  "        semi,",
  '        tone === "success" ? SUCCESS : tone === "accent" ? ACCENT_DEEP : INK,',
  "      );",
].join("\n");

/* ---- 4. the caption under the credential ----------------------------- */

const A4_FROM = [
  "    page.drawText(S.fPublic, {",
  "      x: M + 3 * (BW + GAP),",
  "      y,",
  "      size: 7,",
  "      font: mono,",
  "      color: INK_MUTE,",
  "    });",
].join("\n");

const A4_TO = [
  "    // Green too, so the outcome reads as one thing rather than a box and an",
  "    // unrelated grey note.",
  "    page.drawText(S.fPublic, {",
  "      x: M + 3 * (BW + GAP),",
  "      y,",
  "      size: 7,",
  "      font: mono,",
  "      color: SUCCESS,",
  "    });",
].join("\n");

const EDITS = [
  ["version bump to 3", A1_FROM, A1_TO],
  ["success palette", A2_FROM, A2_TO],
  ["tones instead of a boolean", A3_FROM, A3_TO],
  ["credential caption in green", A4_FROM, A4_TO],
];

if (!existsSync(SRC)) {
  console.error("whatis.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

const isCRLF = text.includes("\r\n");
const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

console.log("whatis credential green " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("SUCCESS_SOFT")) {
  console.log("  already patched - 'SUCCESS_SOFT' is present. Nothing to do.");
  process.exit(0);
}

let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(nl(from)).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log(
      from
        .split("\n")
        .slice(0, 5)
        .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
        .join("\n"),
    );
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  process.exit(1);
}

for (const [, from, to] of EDITS) {
  text = text.replace(nl(from), nl(to));
}

/* The old boolean must be gone, or the two paths would disagree. */
if (text.includes("filled[i]")) {
  console.log("\nFAIL: 'filled[i]' still present after patching. Nothing written.");
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);
console.log("old boolean removed: ok");

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("");
  console.log("NOW deploy: supabase functions deploy render-asset");
  console.log("Version 3 changes the cache path, so it regenerates fresh.");
}
