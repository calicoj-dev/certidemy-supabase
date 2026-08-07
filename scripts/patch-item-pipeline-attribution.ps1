# patch-item-pipeline-attribution.ps1
# Adds an ATTRIBUTION rule to scripts/lib/item-pipeline.mjs.
#
# WHY (HANDOFF v5.5 section 2): the pipeline has no attribution rule at all, so it
# asserts ISO requirements from training knowledge. ISMS-F shipped items claiming
# "27001 requires the risk register to be a living document" (the standard never
# mentions a risk register) and "certificates are valid for three years" (that is
# ISO/IEC 17021-1). verify-cert cannot see this class of error - all 29 invariants
# held throughout.
#
# WHY IN THE GENERATOR, not just the JTA: correcting task 5.2's K/S/A fields did
# NOT stop the generator reasserting the own-work audit rule. Three regeneration
# attempts were needed. The model's ISO prior overrides clean input.
#
# THREE EDITS, following the CUE_NEUTRALITY_RULES pattern already in this file:
#   1. ATTRIBUTION_RULES const after the item-cue-guard import
#   2. interpolate it into draftSystem, after PARALLEL OPTIONS
#   3. numbered check 7 in critiqueSystem, so the reviewer enforces it
#
# Anchors built from a codepoint dump of the live file (385 lines, LF, ASCII).
#
# Usage:  .\patch-item-pipeline-attribution.ps1            (dry run)
#         .\patch-item-pipeline-attribution.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = 'C:\Users\Juan\Documents\certidemy\supabase\scripts\lib\item-pipeline.mjs'
if (-not (Test-Path -LiteralPath $f)) { throw "Not found: $f" }

$t = [System.IO.File]::ReadAllText($f)

$crlf = $t.Contains("`r`n")
$nl   = if ($crlf) { "`r`n" } else { "`n" }
Write-Host ("file line endings: {0}" -f $(if ($crlf) { 'CRLF' } else { 'LF' }))

if ($t -match 'ATTRIBUTION_RULES') { throw "Already patched - ATTRIBUTION_RULES present. Nothing to do." }

# --- edit 1: the const -------------------------------------------------------
$old1 = 'import { CUE_NEUTRALITY_RULES, auditItem, shuffleOptions } from "./item-cue-guard.mjs";'

$new1 = 'import { CUE_NEUTRALITY_RULES, auditItem, shuffleOptions } from "./item-cue-guard.mjs";' + $nl +
        '' + $nl +
        '// ---------------------------------------------------------------------------' + $nl +
        '// ATTRIBUTION - for certs whose subject matter is a published standard or' + $nl +
        '// framework. Interpolated into the draft prompt and enforced by the critique' + $nl +
        '// stage. Added 2026-08-06 after ISMS-F shipped items asserting requirements' + $nl +
        '// that the standard does not contain (HANDOFF v5.5 section 2). verify-cert' + $nl +
        '// checks structure, coverage, cue neutrality, firewall and Bloom - it does NOT' + $nl +
        '// check whether a factual claim is true. This is the only guard on that class.' + $nl +
        '// ---------------------------------------------------------------------------' + $nl +
        'export const ATTRIBUTION_RULES = `ATTRIBUTION - applies only where the subject matter is a published' + $nl +
        'standard, framework, or named body of knowledge:' + $nl +
        '  - State what a document REQUIRES only where it is a requirement in that' + $nl +
        '    document text. Preserve the modal: "shall" is a requirement, "should" is' + $nl +
        '    guidance, and a NOTE is neither.' + $nl +
        '  - Where a widely-taught rule is an IMPLICATION of the text rather than the' + $nl +
        '    text itself, attribute it to practice - "in practice", "commonly", "most' + $nl +
        '    certification bodies" - never to the standard.' + $nl +
        '  - Where the real source is a DIFFERENT document, name that document. Audit' + $nl +
        '    conduct rules are ISO 19011. Certification cycles and certificate validity' + $nl +
        '    are ISO/IEC 17021-1 and the scheme-specific requirements standard. Do not' + $nl +
        '    attribute either to the management system standard being taught.' + $nl +
        '  - NEVER write "the standard requires X" where X is common professional' + $nl +
        '    vocabulary rather than text. A risk register, maturity levels, a' + $nl +
        '    three-year certificate and a RACI matrix are practice, not requirements.' + $nl +
        '  - A DISTRACTOR may be a false attribution - that is a real misconception and' + $nl +
        '    makes a good distractor. The KEY and the EXPLANATION must never contain' + $nl +
        '    one.`;'

# --- edit 2: draftSystem ------------------------------------------------------
$old2 = '  - PARALLEL OPTIONS: write all four options in the same grammatical form, the' + $nl +
        '    same level of specificity, and closely matched length.'

$new2 = '  - PARALLEL OPTIONS: write all four options in the same grammatical form, the' + $nl +
        '    same level of specificity, and closely matched length.' + $nl +
        '' + $nl +
        '${ATTRIBUTION_RULES}'

# --- edit 3: critiqueSystem ---------------------------------------------------
$old3 = '  6. EXPLANATION REFERENCES: the explanation must refer to options by their' + $nl +
        '     content or substance, never by letter (no "option a/b/c/d"). Rewrite any' + $nl +
        '     letter reference to name what the option actually says.'

$new3 = '  6. EXPLANATION REFERENCES: the explanation must refer to options by their' + $nl +
        '     content or substance, never by letter (no "option a/b/c/d"). Rewrite any' + $nl +
        '     letter reference to name what the option actually says.' + $nl +
        '  7. FALSE ATTRIBUTION: any KEY or EXPLANATION that says a standard requires' + $nl +
        '     something the standard does not contain must be rewritten. Check the' + $nl +
        '     modal - a "should" or a NOTE is not a requirement - and check the source:' + $nl +
        '     audit conduct rules belong to ISO 19011, certification cycles and' + $nl +
        '     certificate validity to ISO/IEC 17021-1. Practice vocabulary (risk' + $nl +
        '     register, maturity levels, three-year certificates) is NOT normative text.' + $nl +
        '     Attribute it to practice or cut it. A DISTRACTOR built on a false' + $nl +
        '     attribution is legitimate and should be kept.'

$edits = @(
  @{ name='1 ATTRIBUTION_RULES const'; old=$old1; new=$new1 },
  @{ name='2 draftSystem interp';      old=$old2; new=$new2 },
  @{ name='3 critiqueSystem check 7';  old=$old3; new=$new3 }
)

$fail = $false
foreach ($e in $edits) {
  $n = ([regex]::Matches($t, [regex]::Escape($e.old))).Count
  Write-Host ("{0,-28} matches = {1}  (need 1)" -f $e.name, $n)
  if ($n -ne 1) { $fail = $true }
}
if ($fail) { throw "ANCHOR MISMATCH - do not apply." }

if (-not $Apply) {
  Write-Host ""
  Write-Host "DRY OK - all three anchors matched exactly once. Re-run with -Apply."
  exit 0
}

foreach ($e in $edits) { $t = $t.Replace($e.old, $e.new) }

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($f, $t, $enc)
Write-Host "WRITTEN"
