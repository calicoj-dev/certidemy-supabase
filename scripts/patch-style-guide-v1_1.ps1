#requires -Version 5.1
<#
  patch-style-guide-v1_1.ps1

  Three amendments to STYLE-GUIDE-ISMS-F.md, all arising from the spelling
  incident:

    A  S6  British -> American, with the count that settled it. S6 was wrong,
           and it was wrong in a way that would have shipped 49 lessons in one
           dialect against ~2,600 items in another.

    B  S4  A note that generated items inherit the catalog's American default,
           because item-pipeline.mjs contains no spelling instruction at all.
           Any future cert that sets a different dialect for lessons has the
           same collision waiting.

    C  S11 NEW - read the first generated batch before scaling it. This is the
           rule that caught the defect, and it generalises well beyond spelling.

  ASCII-only. DRY RUN BY DEFAULT.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\supabase\STYLE-GUIDE-ISMS-F.md"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")
$edits = @()

# The guide uses em-dashes in prose. This .ps1 stays pure ASCII (PS 5.1 decodes
# a BOM-less .ps1 as ANSI), so the character is built rather than typed.
$EM = [char]0x2014

# --------------------------------------------------------------------------
# A - S6 spelling
# --------------------------------------------------------------------------
$a1 = "**British spelling**, following ISO's own English: *organisation, unauthorised,`nrecognise, prioritise*."
$b1 = @(
  "**American spelling**, following the rest of the catalog: *organization,"
  "unauthorized, recognize, prioritize, behavior, analyze, catalog*."
  ""
  "This reversed the original ruling and the reversal is the point. S6 first said"
  "British, reasoning that ISO's own English is British. That ignored the seven"
  "certs already shipped. Counting en-language items settled it:"
  ""
  "| cert | british | american |"
  "|---|---|---|"
  "| AIE-I | 0 | 19 |"
  "| AIGRM-I | 0 | 110 |"
  "| AIHR-I | 5 | 25 |"
  "| AISM-I | 7 | 80 |"
  "| SD-AI-I | 0 | 15 |"
  "| SM-AI-I | 1 | 45 |"
  "| SPO-AI-I | 1 | 54 |"
  ""
  "**348 American to 14 British**, and the British hits are incidental rather than"
  "a convention. A candidate moving between Certidemy certs would notice a dialect"
  "switch long before they would notice that one cert matched its source"
  "document's house style."
  ""
  "It was also the cheaper direction: 49 lesson files against 5,548 existing"
  "items. Corrected by ``scripts/patch-isms-f-spelling.ps1`` - 852 replacements,"
  "605 insertions and 605 deletions, no structural drift."
) -join "`n"
$edits += ,@('A', 'S6 spelling: British -> American', $a1, $b1)

# --------------------------------------------------------------------------
# B - S4 widgets, generated-item note
# --------------------------------------------------------------------------
$a2 = "Only three of the six primitives have schemas in the spec. **Do not invent`nconfiguration for ``toggle-and-observe``, ``highlight-mistake`` or`n``annotated-diagram``** $EM confirm the schema first."
$b2 = @(
  "Only three of the six primitives have schemas in the spec. **Do not invent"
  "configuration for ``toggle-and-observe``, ``highlight-mistake`` or"
  "``annotated-diagram``** $EM confirm the schema first."
  ""
  "**Generated items follow the catalog, not this guide.** ``item-pipeline.mjs``"
  "contains no spelling instruction, so both generators default to American."
  "Lessons and items therefore have to agree by the lessons matching the"
  "catalog $EM and any future cert that sets a different dialect for its prose has"
  "this collision waiting, silently, until the first item is read."
) -join "`n"
$edits += ,@('B', 'S4: generated items inherit the catalog default', $a2, $b2)

# --------------------------------------------------------------------------
# C - new S11
# --------------------------------------------------------------------------
$a3 = "## Changelog"
$b3 = @(
  "## 11. Read the first generated batch before scaling it"
  ""
  "Every generator in this pipeline can produce 49 tasks' worth of output in one"
  "run. **Generate one, read it in full, then run the rest.**"
  ""
  "This is the rule that caught the spelling defect. The secure-bank generator"
  "was run with ``MAX_TASKS=1`` and ``DRY_RUN=1`` against a single task, and the"
  "eight items came back in American English against 49 British lessons. Had the"
  "full pass run first, the fix would have been ~2,600 items rather than 49"
  "files."
  ""
  "What a first batch is being read for:"
  ""
  "- Does the output match the lessons in **register, dialect and vocabulary**?"
  "- Is the **Bloom level** what the task declares, and do the items read that way?"
  "- Do the distractors reflect **misconceptions from the material**, or generic ones?"
  "- Does anything violate S1 - a recited definition rather than a taught one?"
  ""
  "It applies to the secure bank, the practice bank, JTA translations and lesson"
  "translations alike. The cost is one extra command. The saving is the"
  "difference between correcting a batch and correcting a bank."
  ""
  "---"
  ""
  "## Changelog"
) -join "`n"
$edits += ,@('C', 'S11 new: read the first generated batch', $a3, $b3)

# --------------------------------------------------------------------------
# changelog entry
# --------------------------------------------------------------------------
$a4 = "- **1.0** (4 August 2026) $EM derived from module 1 and its review."
$b4 = @(
  "- **1.1** (4 August 2026) $EM S6 reversed to American spelling after counting"
  "  en-language items across the seven shipped certs (348 to 14). S4 gains a"
  "  note that generated items inherit the catalog default because the item"
  "  pipeline carries no spelling instruction. S11 added: read the first"
  "  generated batch before scaling it - the rule that caught the S6 error at"
  "  the only cheap moment."
  "- **1.0** (4 August 2026) $EM derived from module 1 and its review."
) -join "`n"
$edits += ,@('D', 'changelog 1.1', $a4, $b4)

# --------------------------------------------------------------------------
# apply
# --------------------------------------------------------------------------
Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
$fail = $false
foreach ($e in $edits) {
  $find = if ($crlf) { $e[2] -replace "(?<!`r)`n", "`r`n" } else { $e[2] }
  $n = 0; $i = 0
  while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  if ($n -eq 1) { Write-Host ("  {0}  OK   {1}" -f $e[0], $e[1]) -ForegroundColor Green }
  else { Write-Host ("  {0}  FAIL ({1})  {2}" -f $e[0], $n, $e[1]) -ForegroundColor Red; $fail = $true }
}
if ($fail) { Write-Host "`nABORTED. Nothing written." -ForegroundColor Red; exit 1 }

if (-not $Apply) {
  Write-Host "`nDRY RUN - all anchors matched. Re-run with -Apply." -ForegroundColor Yellow
  exit 0
}

foreach ($e in $edits) {
  $find = if ($crlf) { $e[2] -replace "(?<!`r)`n", "`r`n" } else { $e[2] }
  $repl = if ($crlf) { $e[3] -replace "(?<!`r)`n", "`r`n" } else { $e[3] }
  $t = $t.Replace($find, $repl)
}
[System.IO.File]::WriteAllText($f, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "WROTE $f" -ForegroundColor Green

Write-Host "`nVERIFY (each must be > 0)" -ForegroundColor Cyan
@(
  '**American spelling**, following the rest of the catalog'
  '348 American to 14 British'
  'Generated items follow the catalog, not this guide'
  '11. Read the first generated batch before scaling it'
  '**1.1** (4 August 2026)'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -SimpleMatch -Pattern $_).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}

Write-Host "`nRESIDUAL - the old British ruling must be gone (expect no output)" -ForegroundColor Cyan
Select-String -LiteralPath $f -SimpleMatch -Pattern "**British spelling**, following ISO's own English"
