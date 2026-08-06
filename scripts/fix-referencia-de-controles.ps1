#requires -Version 5.1
<#
  fix-referencia-de-controles.ps1

  Corrects an inverted noun-adjective order in the pt-BR (and one es-419)
  rendering of "reference controls".

  THE DEFECT
  ----------
  The Rule 17 glossary block added to translate-lessons.mjs contained:

      reference controls is controles de referencia / referencia de controles

  The Spanish is right. The Portuguese is INVERTED - "referencia de controles"
  reads as "the reference NUMBER of controls", not "controls that serve as a
  reference". It should be "controles de referencia" in both languages, and the
  es-419 side of that same line already had it right.

  Written by the assistant into the glossary block, so it propagated wherever
  the phrase appears: 2 JTA task statements (3.6, 4.1) and 7 lesson rows.
  Worst instance, 04-01: "O Anexo A agrupa 93 referencia de controles em quatro
  temas" - which is not Portuguese.

  WHAT THIS FIXES
  ---------------
   1. translate-lessons.mjs   - the glossary line, so no future cert inherits it
   2. the lesson .md files    - on disk, both languages
   3. prints the SQL          - for the 2 JTA task_translations rows

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$web  = "C:\Users\Juan\Documents\certidemy\certidemy-web"
$mjs  = "C:\Users\Juan\Documents\certidemy\supabase\scripts\translate-lessons.mjs"
$i18n = "$web\content\isms-f\_i18n"

$E = [char]0x00EA   # e-circumflex, for referencia (pt)
$A = [char]0x00E2   # not used, reserved

# both accented (pt) and unaccented (es) forms, capitalised variants included
$PAIRS = @(
  @("Refer${E}ncia de controles", "Controles de refer${E}ncia"),
  @("refer${E}ncia de controles", "controles de refer${E}ncia"),
  @("Refer${E}ncias de controles", "Controles de refer${E}ncia"),
  @("refer${E}ncias de controles", "controles de refer${E}ncia"),
  @("Referencia de controles",    "Controles de referencia"),
  @("referencia de controles",    "controles de referencia"),
  @("Referencias de controles",   "Controles de referencia"),
  @("referencias de controles",   "controles de referencia")
)

Write-Host "=== 1. the glossary line in translate-lessons.mjs ===" -ForegroundColor Cyan
$t = [System.IO.File]::ReadAllText($mjs)
$bad  = 'controles de referencia / refer\u00eancia de controles'
$good = 'controles de referencia / controles de refer\u00eancia'
$n = ([regex]::Matches($t, [regex]::Escape($bad))).Count
Write-Host ("  anchor: {0} (need 1)" -f $n) -ForegroundColor $(if ($n -eq 1) { 'Green' } else { 'Red' })
if ($n -ne 1) { Write-Host "  ABORTED - glossary line not found as expected" -ForegroundColor Red; exit 1 }

Write-Host "`n=== 2. lesson files on disk ===" -ForegroundColor Cyan
$files = @(Get-ChildItem -Path "$i18n\*\*\*.md")
$hits = @()
foreach ($f in $files) {
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $k = 0
  foreach ($p in $PAIRS) { $k += ([regex]::Matches($c, [regex]::Escape($p[0]))).Count }
  # 03-05 is EXCLUDED in both languages: its English reads "whose annex is a
  # control reference" - a reference OF controls - which "referencia de
  # controles" renders correctly. Only "reference controls" is inverted.
  if ($k -gt 0 -and $f.Name -notlike '03-05-*') {
    $lang = Split-Path (Split-Path (Split-Path $f.FullName -Parent) -Parent) -Leaf
    $hits += [pscustomobject]@{ Path = $f.FullName; Lang = $lang; Name = $f.Name; Count = $k }
  }
}
if ($hits.Count -eq 0) { Write-Host "  none found" -ForegroundColor Yellow }
$hits | ForEach-Object { Write-Host ("  {0,-8} {1,-42} x{2}" -f $_.Lang, $_.Name, $_.Count) }
Write-Host ("  files: {0}   occurrences: {1}" -f $hits.Count, ($hits | Measure-Object Count -Sum).Sum) -ForegroundColor Cyan

if (-not $Apply) {
  Write-Host "`nDRY RUN - nothing written. Re-run with -Apply." -ForegroundColor Yellow
  exit 0
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($mjs, $t.Replace($bad, $good), $utf8)
Write-Host "`n  WROTE translate-lessons.mjs" -ForegroundColor Green
Push-Location ([System.IO.Path]::GetDirectoryName($mjs)); node --check translate-lessons.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "  SYNTAX FAILED - git restore it" -ForegroundColor Red }
else { Write-Host "  node --check OK" -ForegroundColor Green }
Pop-Location

foreach ($h in $hits) {
  $c = [System.IO.File]::ReadAllText($h.Path)
  foreach ($p in $PAIRS) { $c = $c.Replace($p[0], $p[1]) }
  [System.IO.File]::WriteAllText($h.Path, $c, $utf8)
}
Write-Host ("  WROTE {0} lesson file(s)" -f $hits.Count) -ForegroundColor Green

Write-Host "`n=== RESIDUAL on disk (expect none) ===" -ForegroundColor Cyan
$left = 0
foreach ($f in $files) {
  $c = [System.IO.File]::ReadAllText($f.FullName)
  foreach ($p in $PAIRS) { $left += ([regex]::Matches($c, [regex]::Escape($p[0]))).Count }
}
if ($left -eq 0) { Write-Host "  clean" -ForegroundColor Green }
else { Write-Host ("  {0} REMAINING" -f $left) -ForegroundColor Red }

Write-Host "`n=== 3. SQL for the 2 JTA rows - run in the editor ===" -ForegroundColor Cyan
Write-Host @"

update public.task_translations tt
set statement = replace(
      replace(statement, 'refer$($E)ncia de controles', 'controles de refer$($E)ncia'),
      'referencia de controles', 'controles de referencia')
from public.tasks t
where t.id = tt.task_id
  and t.certification_id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643'
  and tt.statement ~* 'refer.ncia de controles';

-- verify: expect 0
select count(*) from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643'
  and tt.statement ~* 'refer.ncia de controles';
"@ -ForegroundColor Gray

Write-Host "`nNEXT: push the corrected lessons with update-lesson-content.mjs" -ForegroundColor Yellow
Write-Host "      (--lang pt-BR and --lang es-419, scoped to the changed files)." -ForegroundColor Yellow
