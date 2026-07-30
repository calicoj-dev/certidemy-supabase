/**
 * patch-domain-bar-fixes.mjs
 *
 * Two fixes to the certification page's domain rows.
 *
 * ============================================================================
 * 1. THE BAR WAS HIDDEN WHEN COLLAPSED
 * ============================================================================
 *
 * Everything inside <details> AFTER the <summary> is hidden while closed. The
 * weight bar was placed there, so it only appeared on the expanded domain -
 * three rows with no bar and one with. The bar belongs INSIDE the summary, which
 * is the always-visible region; only the description collapses.
 *
 * <summary> takes display:block fine, so it can hold the title row and the bar
 * stacked. That also suppresses the default disclosure triangle in most engines,
 * with the webkit rule covering the rest.
 *
 * ============================================================================
 * 2. THE BARS WERE EXAGGERATING - THIS ONE IS A CORRECTNESS FIX
 * ============================================================================
 *
 * Width was (weightPct / maxWeight) * 100, so the largest domain always filled
 * the whole track. On AIHR-I that made a 30% domain read as the entire
 * examination, under a heading that says "exam composition".
 *
 * Scaled to max, four domains of 20/30/30/20 render as 67/100/100/67 - the eye
 * adds that to far more than the exam. Scaled to 100 they render as 20/30/30/20
 * and sum to exactly the form. A composition chart whose parts do not sum to the
 * whole is telling the reader something false, and this document family has
 * spent its whole existence not doing that.
 *
 * maxWeight becomes unused, so it is removed from the component, its prop type
 * and the call site, and the const that computed it. An unused binding left
 * behind would fail lint anyway.
 *
 * Anchors are normalised to the file's line endings - this file is CRLF.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-domain-bar-fixes.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-domain-bar-fixes.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/certidemy-web/app/[locale]/(marketing)/certifications/[code]/page.tsx";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. drop the maxWeight const ------------------------------------ */

const A1_FROM =
  "  const maxWeight = Math.max(...weighted.map((d) => d.weightPct), 1);\n";
const A1_TO = "";

/* ---- 2. drop it from the call site ---------------------------------- */

const A2_FROM = "<DomainRow key={d.code} domain={d} maxWeight={maxWeight} />";
const A2_TO = "<DomainRow key={d.code} domain={d} />";

/* ---- 3. DomainRow, replaced whole ---------------------------------- */

const A3_FROM = [
  "function DomainRow({",
  "  domain,",
  "  maxWeight,",
  "}: {",
  "  domain: DomainRowData;",
  "  maxWeight: number;",
  "}) {",
  "  // A domain with a description becomes a native disclosure; one without stays",
  "  // exactly as it was. No arrow that opens nothing.",
  "  const hasDesc = Boolean(domain.description);",
  '  const Card = hasDesc ? "details" : "div";',
  '  const Head = hasDesc ? "summary" : "div";',
  "",
  "  return (",
  '    <Card className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-lift)] p-5 shadow-[var(--shadow-card)]">',
  "      <Head",
  "        className={`flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden ${",
  '          hasDesc ? "cursor-pointer" : ""',
  "        }`}",
  "      >",
  '        <div className="flex min-w-0 items-center gap-2">',
  '          <span className="shrink-0 rounded-md bg-[var(--color-surface-deep)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-mute)]">',
  "            {domain.code}",
  "          </span>",
  '          <span className="text-sm font-medium text-[var(--color-ink)]">',
  "            {domain.title}",
  "          </span>",
  "        </div>",
  '        <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-[var(--color-ink-mute)]">',
  "          {domain.weightPct}%",
  "          {hasDesc && (",
  '            <span className="inline-block transition-transform group-open:rotate-90">',
  "              &#8250;",
  "            </span>",
  "          )}",
  "        </span>",
  "      </Head>",
  "",
  '      <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surface-deep)]">',
  "        <div",
  '          className="h-full rounded-full bg-[var(--color-accent)]"',
  "          style={{ width: `${(domain.weightPct / maxWeight) * 100}%` }}",
  "        />",
  "      </div>",
  "",
  "      {hasDesc && (",
  '        <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">',
  "          {domain.description}",
  "        </p>",
  "      )}",
  "    </Card>",
  "  );",
  "}",
].join("\n");

const A3_TO = [
  "function DomainRow({ domain }: { domain: DomainRowData }) {",
  "  // A domain with a description becomes a native disclosure; one without stays",
  "  // a plain card. No arrow that opens nothing.",
  "  const hasDesc = Boolean(domain.description);",
  '  const Card = hasDesc ? "details" : "div";',
  '  const Head = hasDesc ? "summary" : "div";',
  "",
  "  return (",
  '    <Card className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-lift)] p-5 shadow-[var(--shadow-card)]">',
  "      {/* The head holds the title row AND the bar: anything placed after a",
  "          <summary> is hidden while the disclosure is closed, so the bar has to",
  "          live inside it to stay visible. Only the description collapses. */}",
  "      <Head",
  "        className={`block [&::-webkit-details-marker]:hidden ${",
  '          hasDesc ? "cursor-pointer" : ""',
  "        }`}",
  "      >",
  '        <div className="flex items-center justify-between gap-3">',
  '          <div className="flex min-w-0 items-center gap-2">',
  '            <span className="shrink-0 rounded-md bg-[var(--color-surface-deep)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-mute)]">',
  "              {domain.code}",
  "            </span>",
  '            <span className="text-sm font-medium text-[var(--color-ink)]">',
  "              {domain.title}",
  "            </span>",
  "          </div>",
  '          <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-[var(--color-ink-mute)]">',
  "            {domain.weightPct}%",
  "            {hasDesc && (",
  '              <span className="inline-block transition-transform group-open:rotate-90">',
  "                &#8250;",
  "              </span>",
  "            )}",
  "          </span>",
  "        </div>",
  "",
  "        {/* Width is the weight itself, not the weight relative to the largest",
  "            domain. Scaled to the maximum, 20/30/30/20 renders as 67/100/100/67",
  "            and the eye adds it to far more than the exam. Scaled to 100 the",
  "            bars sum to the form, which is what a composition chart owes the",
  "            reader. */}",
  '        <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surface-deep)]">',
  "          <div",
  '            className="h-full rounded-full bg-[var(--color-accent)]"',
  "            style={{ width: `${domain.weightPct}%` }}",
  "          />",
  "        </div>",
  "      </Head>",
  "",
  "      {hasDesc && (",
  '        <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">',
  "          {domain.description}",
  "        </p>",
  "      )}",
  "    </Card>",
  "  );",
  "}",
].join("\n");

const EDITS = [
  ["remove the maxWeight const", A1_FROM, A1_TO],
  ["remove maxWeight from the call site", A2_FROM, A2_TO],
  ["DomainRow: bar inside the head, scaled to 100", A3_FROM, A3_TO],
];

if (!existsSync(SRC)) {
  console.error("certification page not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

const isCRLF = text.includes("\r\n");
const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

console.log("Domain bar fixes " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (!text.includes("maxWeight")) {
  console.log("  already patched - 'maxWeight' is gone. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate everything ---------------------------------- */
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
        .slice(0, 6)
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

/* ---- phase 2: apply ------------------------------------------------ */
for (const [, from, to] of EDITS) {
  text = text.replace(nl(from), nl(to));
}

/* A leftover reference would be a silent runtime break, so check. */
if (text.includes("maxWeight")) {
  console.log("\nFAIL: 'maxWeight' still appears after patching. Nothing written.");
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);
console.log("maxWeight fully removed: ok");

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build`.");
  console.log("");
  console.log("On AIHR-I the four bars should now read 20 / 30 / 30 / 20 percent");
  console.log("of the track - visibly summing to the whole exam - and every bar");
  console.log("should be visible whether or not its description is open.");
}
