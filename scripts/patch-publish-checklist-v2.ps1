#requires -Version 5.1
<#
  patch-publish-checklist-v2.ps1

  Four corrections to CERT-PUBLISH-CHECKLIST.md, all found while publishing
  ISMS-F (cert #8).

    A  S1  The description note is stale. It says description stays NULL until
           a long-form pass; all 24 rows across 8 certs are populated.

    B  NEW S3  module_translations. ISMS-F published with zero rows while every
           other cert had full coverage - the Spanish and Portuguese module
           titles and descriptions rendered in English. Found by a human
           clicking through the course, not by any check.

    C  S5 (was S4)  Two more proposed invariants, including the one that would
           have caught B in a single query.

    D  S6 (was S5)  A module-translation step in the order, and a note that
           step 4 already existed and was bypassed.

  ON D. The checklist ALREADY said "Add the cert to CLAIMS in
  load-cert-i18n.mjs". ISMS-F's claims were written by direct SQL instead, so
  the rows lived only in the database and the loader would have skipped the
  cert while rewriting the other seven. The checklist was right; it was not
  followed. That is worth stating rather than quietly strengthening the wording.

  ASCII-only: the section sign is built with [char].

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\supabase\CERT-PUBLISH-CHECKLIST.md"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t    = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")
$S    = [char]0x00A7       # section sign
$EM   = [char]0x2014       # em dash
$EN   = [char]0x2013       # en dash - the order list at S5 uses this, not EM
$AR   = [char]0x2192       # right arrow

$edits = @()

# --- A: the stale description note ------------------------------------------
$edits += ,@('A  S1 description note is stale',
  '| `description` | NULL until a long-form translation pass. The catalogue only reads `claim`. |',
  '| `description` | Populated in all three languages for every cert. The catalogue card reads `claim`; the certification page reads `description`. (This row previously said NULL; that stopped being true once the long-form pass ran, and the note was never updated.) |')

# --- B: new section 3 --------------------------------------------------------
$b2 = @(
  "## 3. Module titles and descriptions $EM ``module_translations``"
  ""
  "The module cards inside the course. Without rows, a Spanish or Portuguese"
  "candidate reads the whole module list in English while the lessons around it"
  "are translated."
  ""
  "**ISMS-F published with zero rows.** Every other cert had full coverage. No"
  "check caught it $EM ``verify-cert`` does not look at this table, and the view"
  "built to expose it is never consulted. It was found by a human opening the"
  "Spanish course and noticing."
  ""
  "| Column | Value |"
  "|---|---|"
  "| ``title`` | Required, es-419 and pt-BR. Match the domain translations already approved $EM a module title and its domain title are the same string to a candidate. |"
  "| ``description`` | Required. One or two sentences, same register as the English. |"
  "| ``is_provisional`` | ``true`` on write. These are AI-drafted; the flag is what says so. Flip after review, like the JTA translations. |"
  ""
  "``load-module-i18n.mjs`` is a **hardcoded backfill for four specific certs**,"
  "not a reusable tool. A new cert needs its rows written directly, with"
  "``` ``$``$ ```-quoted strings so apostrophes cannot terminate a literal."
  ""
  "**Check:**"
  ""
  '```sql'
  "select * from public.v_module_i18n_coverage order by certification_code;"
  '```'
  ""
  "Every cert should show ``modules = es_419 = pt_br``. A new cert appearing as"
  "the only row where those disagree is the failure this section exists for."
  ""
  "---"
  ""
  "## 4. Status"
) -join "`n"
$edits += ,@('B  new S3, Status renumbered to S4', "## 3. Status", $b2)

# --- C: proposed invariants --------------------------------------------------
$c1 = @(
  "A third worth considering, since it is the same class of failure:"
  ""
  '```'
  "$($S)12  No secure item is public       quiz_questions where pool='secure'"
  "                                    and visibility <> 'secure' = 0"
  '```'
) -join "`n"
$c2 = @(
  "A third worth considering, since it is the same class of failure:"
  ""
  '```'
  "$($S)12  No secure item is public       quiz_questions where pool='secure'"
  "                                    and visibility <> 'secure' = 0"
  '```'
  ""
  "Two more, added after ISMS-F. The first would have caught the module gap in"
  "one query; the second catches a source file and the database disagreeing,"
  "which cost two reverted corrections in one session:"
  ""
  '```'
  "$($S)12  Module translations complete   v_module_i18n_coverage: for this cert,"
  "                                    modules = es_419 = pt_br"
  "$($S)12  Claim loader knows this cert   the cert code appears in the CLAIMS"
  "                                    object in load-cert-i18n.mjs"
  '```'
  ""
  "The second cannot be a database check $EM it compares a source file against"
  "rows $EM but it is the one that matters most. A row written by hand and never"
  "added to its loader survives until someone runs the loader, at which point it"
  "is silently skipped or overwritten."
) -join "`n"
$edits += ,@('C  S5 two more proposed invariants', $c1, $c2)

# --- D: the order ------------------------------------------------------------
$d1 = @(
  "1. ``CERT-CREATION.md`` stages 1$($EN)11 as documented."
  "2. ``verify-cert --cert <CODE>`` green."
  "3. English claim migration."
  "4. Add the cert to ``CLAIMS`` in ``load-cert-i18n.mjs``; ``--dry``, then live."
  "5. Preview candidate sample questions; tag six distinct tasks public."
  "6. Confirm the catalogue card and the carousel render in all three languages."
  "7. Flip status."
) -join "`n"
$d2 = @(
  "1. ``CERT-CREATION.md`` stages 1$($EN)11 as documented."
  "2. ``verify-cert --cert <CODE>`` green."
  "3. English claim migration."
  "4. Add the cert to ``CLAIMS`` in ``load-cert-i18n.mjs``; ``--dry``, then live."
  "5. Write ``module_translations`` for every module, both languages ($($S)3)."
  "6. Preview candidate sample questions; tag six distinct tasks public."
  "7. Confirm the catalogue card and the carousel render in all three languages."
  "8. **Open the course in es-419 and pt-BR and read a module list and a lesson.**"
  "   Steps 4$($AR)7 are all catalogue surfaces. Nothing above this line looks"
  "   inside the course, which is where the module gap and a renderer bug both"
  "   hid on ISMS-F."
  "9. Flip status."
  ""
  "**On step 4.** It already said this when ISMS-F was built, and ISMS-F's claims"
  "were written by direct SQL instead $EM so the rows existed only in the database"
  "and the loader did not know the cert. The checklist was correct and was not"
  "followed. Writing a row by hand is faster; adding it to the loader is what"
  "makes it survive."
) -join "`n"
$edits += ,@('D  S6 order + step 4 note', $d1, $d2)

# ---------------------------------------------------------------------------
Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
$fail = $false
foreach ($e in $edits) {
  $find = $e[1]; if ($crlf) { $find = $find -replace "(?<!`r)`n", "`r`n" }
  $n = 0; $i = 0
  while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  if ($n -eq 1) { Write-Host ("  OK   {0}" -f $e[0]) -ForegroundColor Green }
  else { Write-Host ("  FAIL ({0})  {1}" -f $n, $e[0]) -ForegroundColor Red; $fail = $true }
}
if ($fail) { Write-Host "`nABORTED. Nothing written." -ForegroundColor Red; exit 1 }
if (-not $Apply) { Write-Host "`nDRY RUN - all anchors matched. Re-run with -Apply." -ForegroundColor Yellow; exit 0 }

foreach ($e in $edits) {
  $find = $e[1]; $repl = $e[2]
  if ($crlf) { $find = $find -replace "(?<!`r)`n", "`r`n"; $repl = $repl -replace "(?<!`r)`n", "`r`n" }
  $t = $t.Replace($find, $repl)
}

# renumber the two trailing sections
$t = $t.Replace("## 4. Proposed ``verify-cert`` invariants", "## 5. Proposed ``verify-cert`` invariants")
$t = $t.Replace("## 5. Order for the next cert", "## 6. Order for the next cert")

[System.IO.File]::WriteAllText($f, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "`nWROTE $f" -ForegroundColor Green

Write-Host "`nSECTION HEADINGS" -ForegroundColor Cyan
Select-String -LiteralPath $f -Pattern '^#{1,3} ' | ForEach-Object { Write-Host ("  {0,4}  {1}" -f $_.LineNumber, $_.Line) }

Write-Host "`nVERIFY (each must be > 0)" -ForegroundColor Cyan
@(
  'v_module_i18n_coverage'
  'Claim loader knows this cert'
  'The checklist was correct and was not'
  'Populated in all three languages for every cert'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -SimpleMatch -Pattern $_).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}
