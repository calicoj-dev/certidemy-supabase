/**
 * patch-library-modal-preview.mjs
 *
 * Two changes to the Generate Document modal:
 *
 *   1. An in-modal LANGUAGE SELECTOR, so a rep does not have to close the modal
 *      and reset the page selector to send the same document in Spanish.
 *
 *   2. An inline PDF PREVIEW after generating, so a rep who is not sure whether
 *      they want the blueprint or the JTA can look at both and decide instead of
 *      downloading two files and opening them.
 *
 * THE ONE THING THAT MUST NOT GO WRONG
 *
 * Switching language CLEARS the generated state. Without that, the preview keeps
 * showing the previously generated document while the header reports the new
 * language - and a rep sends the wrong file convinced they checked it. That is
 * strictly worse than having no preview at all, because it manufactures false
 * confidence in exactly the distracted, busy case the preview exists to protect.
 *
 * WHY THE PREVIEW COSTS NOTHING
 *
 * The storage path is a content hash, so previewing then downloading renders the
 * document once, not twice - both hit the same cached object. Previewing the
 * blueprint and the JTA to compare renders each once, ever, until their data
 * changes. preview_url is a second signature on the same object without a
 * download disposition (render-asset, signInline).
 *
 * TWO EDITS ARE LOCATED PROGRAMMATICALLY, NOT BY LITERAL ANCHOR
 *
 * This file nests deeply enough that its indentation has already been miscounted
 * once tonight. Rather than hard-code leading whitespace, the script finds the
 * <Row label="Language" /> span and the "Downloads are logged" paragraph by their
 * distinctive content, then derives the indentation from the located line. An
 * anchor that computes its own indentation cannot be off by two spaces.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-library-modal-preview.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-library-modal-preview.mjs
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

console.log("Library modal preview " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("preview_url")) {
  console.log("  already patched - 'preview_url' is present. Nothing to do.");
  process.exit(0);
}

let failed = 0;

/** The whitespace beginning the line that contains `index`. */
function indentAt(src, index) {
  const lineStart = src.lastIndexOf("\n", index - 1) + 1;
  const m = src.slice(lineStart, index).match(/^[ \t]*/);
  return m ? m[0] : "";
}

/* ==================================================================== */
/* 1. Pending type gains preview_url - find the Done shape              */
/* ==================================================================== */
//
// `done` currently holds { url, filename }. It needs the preview URL too.

const DONE_FROM =
  'const [done, setDone] = useState<{ url: string; filename: string } | null>(null);';
const DONE_TO =
  'const [done, setDone] = useState<{\n' +
  '    url: string;\n' +
  '    previewUrl: string | null;\n' +
  '    filename: string;\n' +
  '  } | null>(null);';

if ((text.split(DONE_FROM).length - 1) === 1) {
  text = text.replace(DONE_FROM, DONE_TO.replace(/\n/g, NL));
  console.log("  ok   done state gains previewUrl");
} else {
  console.log("  FAIL done state declaration not found exactly once");
  failed += 1;
}

/* ==================================================================== */
/* 2. setDone call in generate() carries the preview URL                */
/* ==================================================================== */

const SETDONE_RE = /setDone\(\{\s*url:\s*([A-Za-z0-9_.?\[\]"' ]+?),\s*filename:\s*([A-Za-z0-9_.?\[\]"' ]+?)\s*\}\)/;
const setDoneMatch = text.match(SETDONE_RE);
if (setDoneMatch) {
  const [whole, urlExpr, fileExpr] = setDoneMatch;
  text = text.replace(
    whole,
    "setDone({ url: " +
      urlExpr.trim() +
      ", previewUrl: res?.preview_url ?? null, filename: " +
      fileExpr.trim() +
      " })",
  );
  console.log("  ok   setDone carries preview_url");
} else {
  console.log("  FAIL setDone({ url, filename }) call not found");
  console.log("       (the generate() function may assign it differently)");
  failed += 1;
}

/* ==================================================================== */
/* 3. Modal container widens when a preview is showing                  */
/* ==================================================================== */

const WIDTH_FROM =
  '<div className="absolute left-1/2 top-1/2 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-surface-edge)] bg-[var(--color-surface)] shadow-2xl">';
const WIDTH_TO =
  "<div className={`absolute left-1/2 top-1/2 " +
  '${done ? "w-[min(96vw,900px)]" : "w-[min(92vw,440px)]"}' +
  " -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-surface-edge)] bg-[var(--color-surface)] shadow-2xl`}>";

if ((text.split(WIDTH_FROM).length - 1) === 1) {
  text = text.replace(WIDTH_FROM, WIDTH_TO);
  console.log("  ok   modal widens for the preview");
} else {
  console.log("  FAIL modal container class not found exactly once");
  failed += 1;
}

/* ==================================================================== */
/* 4. Language Row becomes a selector                                   */
/* ==================================================================== */

const langIdx = text.indexOf('label="Language"');
if (langIdx === -1) {
  console.log('  FAIL label="Language" not found');
  failed += 1;
} else {
  const rowStart = text.lastIndexOf("<Row", langIdx);
  const rowEnd = text.indexOf("/>", langIdx);
  if (rowStart === -1 || rowEnd === -1) {
    console.log("  FAIL could not bound the Language <Row .. /> span");
    failed += 1;
  } else {
    const indent = indentAt(text, rowStart);
    const selector = join(
      [
        '<div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-lift)] px-3 py-2">',
        '  <span className="font-label shrink-0 text-[var(--color-ink-mute)]">',
        "    Language",
        "  </span>",
        '  <div className="flex gap-1">',
        "    {LANGS.map((l) => (",
        "      <button",
        "        key={l.code}",
        '        type="button"',
        "        onClick={() => {",
        "          setLang(l.code);",
        "          // Clearing `done` is load-bearing: a stale preview beside a new",
        "          // language label is how a rep sends the wrong file believing they",
        "          // checked it.",
        "          setDone(null);",
        "          setError(null);",
        "        }}",
        "        disabled={busy}",
        "        className={`ci-press rounded-lg px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${",
        "          lang === l.code",
        '            ? "bg-[var(--color-accent)] text-white"',
        '            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-deep)]"',
        "        }`}",
        "      >",
        "        {l.label}",
        "      </button>",
        "    ))}",
        "  </div>",
        "</div>",
      ],
      indent,
    ).slice(indent.length); // the first line inherits the existing indent

    text = text.slice(0, rowStart) + selector + text.slice(rowEnd + 2);
    console.log("  ok   Language row becomes a selector (indent " + indent.length + ")");
  }
}

/* ==================================================================== */
/* 5. The preview itself                                                */
/* ==================================================================== */

const LOGGED = "own generation date. Downloads are logged.";
const loggedIdx = text.indexOf(LOGGED);
if (loggedIdx === -1) {
  console.log("  FAIL 'Downloads are logged' paragraph not found");
  failed += 1;
} else {
  const closeIdx = text.indexOf("</p>", loggedIdx);
  if (closeIdx === -1) {
    console.log("  FAIL could not find the closing </p> after the logged note");
    failed += 1;
  } else {
    const insertAt = closeIdx + 4;
    const indent = indentAt(text, text.lastIndexOf("<p", loggedIdx));
    const preview = NL + join(
      [
        "{done?.previewUrl && (",
        '  <div className="mt-4">',
        '    <p className="font-label mb-2 text-[var(--color-ink-mute)]">',
        "      Preview",
        "    </p>",
        '    <div className="overflow-hidden rounded-xl border border-[var(--color-surface-edge)] bg-[var(--color-surface-lift)]">',
        "      <iframe",
        "        src={done.previewUrl}",
        "        title={done.filename}",
        '        className="h-[58vh] w-full"',
        "      />",
        "    </div>",
        '    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-mute)]">',
        "      This is the document itself, not an approximation. Switching language",
        "      clears it - generate again to see the other version.",
        "    </p>",
        "  </div>",
        ")}",
      ],
      indent,
    );

    text = text.slice(0, insertAt) + preview + text.slice(insertAt);
    console.log("  ok   preview iframe inserted (indent " + indent.length + ")");
  }
}

/* ==================================================================== */

if (failed > 0) {
  console.log("\n" + failed + " edit(s) failed. NOTHING written.");
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All five edits located.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build`.");
  console.log("");
  console.log("Then /console/library: pick a cert, generate a document, and it");
  console.log("should appear in the modal. Switch language and the preview clears.");
}
