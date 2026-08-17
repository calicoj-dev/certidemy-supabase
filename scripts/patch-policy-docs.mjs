/**
 * patch-policy-docs.mjs
 *
 * Two gaps found by reading the documents rather than assuming their contents:
 *
 *   CERT-PUBLISH-CHECKLIST.md has NO OB3 SECTION AT ALL. Earlier handoffs record
 *   "add check-ob3-endpoints.ps1 to the checklist" as though there were a
 *   verification section to append to. There is not -- the file is catalogue
 *   claims and sample questions, written 26 July, before any of the OB3 work.
 *   Its cert register also lists 7 of 11.
 *
 *   CLAIMS-POLICY.md has no 1EdTech entry. Class D covers "any claim that
 *   Certidemy is, or is affiliated with, a standards body", which nearly reaches
 *   it -- but "1EdTech conformant" does not obviously read as an affiliation
 *   claim, and as of the dual-proof change it is now PARTLY TRUE, which makes it
 *   more dangerous rather than less. A partly-true claim is the kind someone
 *   makes in good faith on a sales call.
 *
 * Run from wherever the docs live (the supabase repo root).
 *
 * Usage:  node patch-policy-docs.mjs --dry
 *         node patch-policy-docs.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DRY = process.argv.includes("--dry");

/* ============================ CERT-PUBLISH-CHECKLIST ====================== */

const CHECKLIST = "CERT-PUBLISH-CHECKLIST.md";

const OB3_SECTION = `
---

## 6. Open Badges 3.0 — the credential surface

**Added August 2026.** Sections 1–5 are about whether a certification can be
SOLD. This one is about whether the credential it produces can be VERIFIED by
someone who is not us — which is the entire claim the product rests on.

Every check here has caught a real defect that looked like success. None would
have been caught by "did the page load".

### 6.1 The four identifier documents resolve, anonymously

\`\`\`
cd supabase
node scripts/check-jsonld-safe-mode.mjs \\
  "https://credentials.certidemy.com/issuers/certidemy?cb=$RANDOM" \\
  "https://credentials.certidemy.com/issuers/certidemy/achievements/<CODE>?cb=$RANDOM" \\
  "https://credentials.certidemy.com/issuers/certidemy/status/1?cb=$RANDOM" \\
  "https://credentials.certidemy.com/credentials/<CODE>?cb=$RANDOM"
\`\`\`

Wants **200**, content-type \`application/vc+ld+json\`, and **SAFE MODE PASS** on
all four. Cache-bust every URL: the achievement document changes per
certification and a stale edge copy hides a real failure.

JSON-LD safe mode is a hard requirement of the 1EdTech Issuer certification
profile, added December 2025. A term not defined by any context is an ERROR, not
a silent drop.

*Found by this check:* \`verificationMethod\` not expanding on \`/issuer\`, and a
relative \`@type\` reference on the status list. Both had been shipping.

### 6.2 Both proofs verify, and both reject tampering

\`\`\`
node scripts/verify-rdfc-proof.mjs \\
  "https://credentials.certidemy.com/credentials/<CODE>" --tamper
\`\`\`

Wants **failures: 0**, with \`eddsa-jcs-2022\` and \`eddsa-rdfc-2022\` both
verifying, JCS at \`proof[0]\`, and **both rejecting the altered document**.

The tamper half is the half that matters. A proof that survives a one-character
change is not covering the document — which is exactly what a canonicalizer
silently dropping fields produces. A green run without \`--tamper\` is half the
evidence.

This script shares NO code with the signer. It re-derives base58,
canonicalization and payload assembly from the cryptosuite spec, and fetches the
public key over the network. A signature that verifies only against the code
that produced it proves nothing.

### 6.3 The baked badge is a valid PNG carrying the credential

\`\`\`
curl -s -o badge.png "https://credentials.certidemy.com/credentials/<CODE>/badge"
node scripts/extract-baked.mjs badge.png
\`\`\`

Wants: **~66 KB** (~21 KB artwork + ~45 KB credential), chunk type \`iTXt\`,
**exactly one** \`openbadgecredential\` keyword (the spec forbids more), and the
extracted credential passing safe mode.

*The byte count is the check.* A \`.text()\` decode of PNG bytes produced an
84,276-byte corrupt file served with a 200, twice, in two different proxies, and
the extractor still printed plausible JSON both times.

### 6.4 Type check before every function deploy

\`\`\`
deno check --node-modules-dir=auto supabase/functions/open-badge/index.ts
deno check --node-modules-dir=auto supabase/functions/credential-og/index.ts
\`\`\`

\`--node-modules-dir=auto\` is required: \`npm install jsonld\` created a
\`node_modules\` that puts Deno in manual mode, and the failure
(\`Could not find a matching package for 'npm:@types/node'\`) reads like a code
error. It is not.

\`supabase functions deploy\` bundles with esbuild, which strips types WITHOUT
checking them. A type error deploys clean and fails at runtime — on the mint
path, where it costs a paid attempt.

*Found by this check the first time it was ever run:* 30 errors across two
functions, including \`signDocument\` having been type-broken since Open Badges
shipped.

### 6.5 Before changing the credential document shape

**Grep both repos for readers of the field you are changing.**

\`\`\`
Get-ChildItem -Recurse -Path certidemy-web -Include *.ts,*.tsx |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  Select-String -Pattern '\\.<field>\\b'
Get-ChildItem -Recurse -Path supabase\\functions -Include *.ts |
  Select-String -Pattern '\\.<field>\\b'
\`\`\`

Adding \`eddsa-rdfc-2022\` turned \`proof\` into an array. Correct in itself, and it
broke the badge panel — which destructured it as an object — on a live paying
customer's credential. The grep that found the one affected consumer took four
seconds and ran after the deploy rather than before.

### 6.6 A new certification needs its badge in TWO places

\`public/badges/<CODE>.png\` in the web repo, AND the \`BADGE_CODES\` set in
\`app/[locale]/(marketing)/certifications/[code]/page.tsx\`, AND regenerated into
\`_shared/badges.ts\` via \`gen-badges-module.mjs\`.

Three lists, one truth. Miss the first and the cert page renders a broken image;
miss the third and \`?doc=baked\` 404s.
`;

/* ============================== CLAIMS-POLICY ============================= */

const CLAIMS = "CLAIMS-POLICY.md";

const CLAIMS_C_ADDITION = `- 1EdTech certified, 1EdTech conformant, Open Badges certified, or any
  formulation implying a relationship with 1EdTech — **until listed in the
  Certified Product Directory at imscert.org**. See §3.1.
`;

const CLAIMS_SUBSECTION = `
### 3.1 The 1EdTech boundary

Singled out because it is the most dangerous kind of unearned claim: **partly
true**, and true in a way that is easy to overstate in good faith on a call.

**What is true as of August 2026.** Certidemy issues Open Badges 3.0 credentials
that pass JSON-LD safe-mode validation and carry \`eddsa-rdfc-2022\` — the proof
mechanism 1EdTech's Open Badges 3.0 Conformance and Certification Guide requires.
Every technical requirement of the Issuer certification profile is met.

**What is not true.** Certidemy is not a 1EdTech member, has not run the
certification suite, and is not listed in the Certified Product Directory.
Certification requires membership and a passed test suite; neither has happened.

**Class A — permitted, because a reader can open the document and check it:**

> Our credentials carry the proof mechanism 1EdTech's Open Badges 3.0 conformance
> guide requires.

A fact about our signature. Makes no status claim about us or about 1EdTech.

**Class C — forbidden until listed in the directory:**

> 1EdTech certified · 1EdTech conformant · Open Badges certified · conformance-
> tested · officially recognised by 1EdTech

The check a buyer runs is imscert.org, and it takes ten seconds. A university
procurement officer WILL run it.

**Class D — never:** anything implying Certidemy is a 1EdTech member, partner, or
participant in its governance. This is the standards-body affiliation rule
already stated in Class D, restated here because "conformant" does not obviously
read as an affiliation claim to someone in a hurry.

**When this changes:** passing the suite and appearing in the directory moves the
Class C list to Class A wholesale. Until the directory lists us, it does not
matter how much of the work is done.
`;

/* ================================ apply ================================== */

let changed = 0;

function patch(file, fn) {
  if (!existsSync(file)) {
    console.log(`  skip  ${file} not found in ${process.cwd()}`);
    return;
  }
  const before = readFileSync(file, "utf8");
  const after = fn(before);
  if (after === null) return;
  if (after === before) {
    console.log(`  skip  ${file} -- already patched`);
    return;
  }
  console.log(`  ok    ${file}  ${before.length} -> ${after.length} bytes`);
  if (!DRY) writeFileSync(file, after, "utf8");
  changed++;
}

patch(CHECKLIST, (src) => {
  if (src.includes("## 6. Open Badges 3.0")) return src;
  const anchor = "*Written 26 July 2026, from what AIHR-I needed after verify-cert went green.*";
  if (!src.includes(anchor)) {
    console.error(`ABORT  ${CHECKLIST}: closing line not found -- re-anchor`);
    process.exit(3);
  }
  // Section 6 goes BEFORE the dateline, and the dateline gains a second line.
  return src.replace(
    anchor,
    OB3_SECTION.trimEnd() +
      "\n\n---\n\n" +
      anchor +
      "\n*Section 6 added August 2026, from what the OB3 namespace migration and " +
      "the dual-proof change each broke silently.*",
  );
});

patch(CLAIMS, (src) => {
  if (src.includes("### 3.1 The 1EdTech boundary")) return src;

  // Add the Class C bullet after the salary/labour-market line, which is last.
  const cAnchor = "- Salary, hiring or labour-market outcomes\n";
  if (!src.includes(cAnchor)) {
    console.error(`ABORT  ${CLAIMS}: Class C list tail not found -- re-anchor`);
    process.exit(3);
  }
  let out = src.replace(cAnchor, cAnchor + CLAIMS_C_ADDITION);

  // The subsection goes after the Class D block, before "Overclaims".
  const dAnchor = "### Overclaims about our own product";
  if (!out.includes(dAnchor)) {
    console.error(`ABORT  ${CLAIMS}: Overclaims heading not found -- re-anchor`);
    process.exit(3);
  }
  out = out.replace(dAnchor, CLAIMS_SUBSECTION.trim() + "\n\n" + dAnchor);
  return out;
});

console.log(
  DRY
    ? `\nDRY RUN -- ${changed} file(s) would change, nothing written`
    : `\n${changed} file(s) written`,
);
process.exit(DRY ? 2 : 0);
