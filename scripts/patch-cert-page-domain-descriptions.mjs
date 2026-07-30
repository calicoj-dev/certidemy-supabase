/**
 * patch-cert-page-domain-descriptions.mjs
 *
 * Renders each domain's description on the public certification page, as a
 * native disclosure under the weight bar.
 *
 * ============================================================================
 * LINE ENDINGS - WHY THE POWERSHELL ATTEMPT FOUND ZERO MATCHES
 * ============================================================================
 *
 * This file is CRLF. Git on Windows checks files out with autocrlf, so anything
 * never rewritten locally has \r\n. Files delivered during this session are LF,
 * because WriteAllText wrote exactly the LF strings it was given.
 *
 * So multi-line anchors written with \n match the files I authored and silently
 * miss every original file. That is precisely why library-flow.tsx,
 * exam-runner.tsx and score-mock-exam patched cleanly and this page did not.
 *
 * Every anchor here is normalised to the file's own convention before matching.
 * ALL future multi-line patch scripts should do the same - a patch that reports
 * zero matches looks like a stale anchor and is actually an encoding mismatch,
 * which is a long way to travel for the wrong diagnosis.
 *
 * ============================================================================
 * WHY <details> AND NOT A CLIENT COMPONENT
 * ============================================================================
 *
 * The page is a server component. A native disclosure ships no JavaScript, works
 * with the keyboard, is announced correctly by screen readers, and survives with
 * JS disabled. Making the card a client component to toggle one paragraph would
 * add a bundle to a public marketing page for nothing.
 *
 * THE ELEMENT SWAP IS THE POINT. A domain WITH a description renders as
 * details/summary and expands. A domain WITHOUT one renders as plain divs and is
 * byte-for-byte what it is today - no dead arrow, no clickable card that does
 * nothing. Newer certifications may not have descriptions written yet, and an
 * affordance that lies is worse than one that is absent.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-cert-page-domain-descriptions.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-cert-page-domain-descriptions.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/certidemy-web/app/[locale]/(marketing)/certifications/[code]/page.tsx";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. the row type ------------------------------------------------- */

const A1_FROM = ["  title: string;", "  weightPct: number;"].join("\n");
const A1_TO = [
  "  title: string;",
  "  description: string | null;",
  "  weightPct: number;",
].join("\n");

/* ---- 2. pass it through --------------------------------------------- */

const A2_FROM = ["    title: d.title,", "    weightPct: d.weightPct,"].join("\n");
const A2_TO = [
  "    title: d.title,",
  "    description: d.description,",
  "    weightPct: d.weightPct,",
].join("\n");

/* ---- 3. DomainRow, replaced whole ----------------------------------- */
//
// One anchor for the entire function rather than three inside it: the body is
// small, and a single exact match is safer than three that could each drift.

const A3_FROM = [
  "function DomainRow({",
  "  domain,",
  "  maxWeight,",
  "}: {",
  "  domain: DomainRowData;",
  "  maxWeight: number;",
  "}) {",
  "  return (",
  '    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-lift)] p-5 shadow-[var(--shadow-card)]">',
  '      <div className="flex items-center justify-between gap-3">',
  '        <div className="flex min-w-0 items-center gap-2">',
  '          <span className="shrink-0 rounded-md bg-[var(--color-surface-deep)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-mute)]">',
  "            {domain.code}",
  "          </span>",
  '          <span className="text-sm font-medium text-[var(--color-ink)]">',
  "            {domain.title}",
  "          </span>",
  "        </div>",
  '        <span className="shrink-0 font-mono text-xs text-[var(--color-ink-mute)]">',
  "          {domain.weightPct}%",
  "        </span>",
  "      </div>",
  "",
  '      <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surface-deep)]">',
  "        <div",
  '          className="h-full rounded-full bg-[var(--color-accent)]"',
  "          style={{ width: `${(domain.weightPct / maxWeight) * 100}%` }}",
  "        />",
  "      </div>",
  "    </div>",
  "  );",
  "}",
].join("\n");

const A3_TO = [
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

const EDITS = [
  ["DomainRowData.description", A1_FROM, A1_TO],
  ["pass description through", A2_FROM, A2_TO],
  ["DomainRow as a disclosure", A3_FROM, A3_TO],
];

if (!existsSync(SRC)) {
  console.error("certification page not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

/* Detect the file's convention and normalise anchors to it. */
const isCRLF = text.includes("\r\n");
const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

console.log("Cert page domain descriptions " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("hasDesc")) {
  console.log("  already patched - 'hasDesc' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate every anchor, touch nothing ------------------ */
let bad = 0;
for (const [label, from] of EDITS) {
  const needle = nl(from);
  const hits = text.split(needle).length - 1;
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
    if (from.split("\n").length > 6) console.log("         |... (truncated)");
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  process.exit(1);
}

/* ---- phase 2: apply ------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(nl(from), nl(to));
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All three anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build`.");
  console.log("");
  console.log("Then /es-419/certifications/aihr-i - each domain bar should expand");
  console.log("to its Spanish description. Those rows were flipped to reviewed a");
  console.log("few minutes ago, so they are live now.");
}
