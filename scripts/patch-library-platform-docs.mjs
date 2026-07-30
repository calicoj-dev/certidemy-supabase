/**
 * patch-library-platform-docs.mjs
 *
 * Adds a "Platform documents" section to the sales library and makes the modal
 * behave for an asset that is not about a certification.
 *
 * WHY THIS IS SLIGHTLY AWKWARD
 *
 * The library is cert-scoped end to end: pick a certification, then click nodes in
 * its flow. "What is Certidemy?" belongs to no certification, so it needs its own
 * entry point outside the flow, and the modal's Certification row has to disappear
 * for it - otherwise a document about the whole platform announces itself as being
 * about whichever certification happened to be selected.
 *
 * generate() is reused unchanged. It sends certification_code, and render-asset
 * now skips that guard for platform assets, so passing the selected code along is
 * harmless and avoids inventing a second code path for one button.
 *
 * THE SECOND EDIT EXTRACTS THE EXISTING <Row> VERBATIM
 *
 * The Certification row contains a middle dot that renders as mojibake in a
 * PowerShell terminal, so retyping it from what the terminal showed would corrupt
 * it. The script locates the span and wraps the original bytes in a conditional
 * instead of reproducing them.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-library-platform-docs.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-library-platform-docs.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/certidemy-web/components/console/library-flow.tsx";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

if (!existsSync(SRC)) {
  console.error("library-flow.tsx not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;
const isCRLF = text.includes("\r\n");
const NL = isCRLF ? "\r\n" : "\n";
const join = (lines, indent) => lines.map((l) => (l ? indent + l : "")).join(NL);

console.log("Library platform documents " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("what_is_certidemy")) {
  console.log("  already patched - 'what_is_certidemy' is present. Nothing to do.");
  process.exit(0);
}

let failed = 0;

function indentAt(src, index) {
  const lineStart = src.lastIndexOf("\n", index - 1) + 1;
  const m = src.slice(lineStart, index).match(/^[ \t]*/);
  return m ? m[0] : "";
}

/* ==================================================================== */
/* 1. The Platform documents section                                    */
/* ==================================================================== */
//
// Placed immediately before the language selector. It sits between the
// certification picker and the language row - a distinct bordered section, so
// the reading order is: which certification, what applies to everything, which
// language, then the flow.

const LANG_MARKER = "{/* ---- language ---- */}";
const langIdx = text.indexOf(LANG_MARKER);
if (langIdx === -1) {
  console.log("  FAIL language section marker not found");
  failed += 1;
} else {
  const indent = indentAt(text, langIdx);
  const block =
    join(
      [
        "{/* ---- platform documents ----",
        "    Not about any one certification, so outside the flow entirely. The",
        "    selected certification is irrelevant here and the modal hides it. */}",
        '<div className="mt-6 border-t border-[var(--color-surface-edge)] pt-6">',
        '  <p className="font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">',
        "    Platform documents",
        "  </p>",
        "  <button",
        '    type="button"',
        "    onClick={() =>",
        "      setPending({",
        "        certCode: cert.code,",
        "        action: {",
        '          id: "what_is_certidemy",',
        '          label: "What is Certidemy?",',
        "          hint:",
        '            "A one-page introduction: why Certidemy exists, what it does differently, and the catalogue as it stands today. Safe to send.",',
        "        },",
        "      })",
        "    }",
        '    className="ci-press mt-2 w-full rounded-xl border border-[var(--color-surface-edge)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"',
        "  >",
        '    <span className="block text-sm font-medium text-[var(--color-ink)]">',
        "      What is Certidemy?",
        "    </span>",
        '    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-ink-soft)]">',
        "      One page. Why it exists, what it does differently, and the catalogue",
        "      as it stands - counted live, not typed.",
        "    </span>",
        "  </button>",
        "</div>",
        "",
      ],
      indent,
    ).slice(indent.length) + NL + indent;

  text = text.slice(0, langIdx) + block + text.slice(langIdx);
  console.log("  ok   platform documents section (indent " + indent.length + ")");
}

/* ==================================================================== */
/* 2. Hide the Certification row for a platform asset                   */
/* ==================================================================== */
//
// The original <Row .. /> is extracted and re-wrapped rather than retyped: it
// contains a middle dot that a PowerShell terminal renders as mojibake, and
// reproducing it from that rendering would corrupt the file.

const certRowIdx = text.indexOf('label="Certification"');
if (certRowIdx === -1) {
  console.log('  FAIL label="Certification" not found');
  failed += 1;
} else {
  const rowStart = text.lastIndexOf("<Row", certRowIdx);
  const rowEnd = text.indexOf("/>", certRowIdx);
  if (rowStart === -1 || rowEnd === -1) {
    console.log("  FAIL could not bound the Certification <Row .. /> span");
    failed += 1;
  } else {
    const indent = indentAt(text, rowStart);
    const original = text.slice(rowStart, rowEnd + 2);
    const wrapped =
      '{pending.action.id !== "what_is_certidemy" && (' +
      NL +
      indent +
      "  " +
      original +
      NL +
      indent +
      ")}";
    text = text.slice(0, rowStart) + wrapped + text.slice(rowEnd + 2);
    console.log(
      "  ok   Certification row hidden for platform assets (indent " +
        indent.length +
        ")",
    );
  }
}

/* ==================================================================== */

if (failed > 0) {
  console.log("\n" + failed + " edit(s) failed. NOTHING written.");
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. Both edits located.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build`.");
  console.log("");
  console.log("Then /console/library: a Platform documents section under the");
  console.log("certification picker, and the modal should NOT show a Certification");
  console.log("row for it.");
}
