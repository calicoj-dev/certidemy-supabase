# fix-dry-exit-codes.ps1
# Makes every patch script's DRY path exit NON-ZERO.
#
# WHY. Twice on 2026-08-06 a patch was dry-run, printed "DRY OK", and the -Apply
# step was skipped - once on load-cert-i18n.mjs and once on
# load-cert-descriptions.mjs. Both times the next command ran against an
# unpatched file and everything downstream looked plausible.
#
# The cause is a design error, not inattention: `exit 0` on the dry path means
# "I deliberately did nothing" is reported with the same exit code as success.
# Every other tool in this project exits 0 only when work was done. A dry run
# that prints a wall of green text and exits 0 is indistinguishable from a
# completed patch at a glance, and any chained command continues past it.
#
# exit 2 makes a skipped -Apply visible: PowerShell surfaces it, $LASTEXITCODE
# is non-zero, and && chains stop. Nothing about the patch behaviour changes.
#
# Usage:  .\fix-dry-exit-codes.ps1            (dry run - and yes, this one
#                                              exits 2 as well, on purpose)
#         .\fix-dry-exit-codes.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'

$targets = @(
  'C:\Users\Juan\Documents\certidemy\supabase\scripts\patch-schema-guide-s6.ps1',
  'C:\Users\Juan\Documents\certidemy\supabase\scripts\patch-item-pipeline-attribution.ps1',
  'C:\Users\Juan\Documents\certidemy\certidemy-web\scripts\patch-load-cert-i18n-aims-f.ps1',
  'C:\Users\Juan\Documents\certidemy\certidemy-web\scripts\patch-load-cert-descriptions-aims-f.ps1'
)

$old = '  exit 0'
$new = '  exit 2   # NOT APPLIED - non-zero so a skipped -Apply cannot look like success'

$plan = @()
foreach ($f in $targets) {
  if (-not (Test-Path -LiteralPath $f)) {
    Write-Host ("SKIP (not found)   {0}" -f [System.IO.Path]::GetFileName($f))
    continue
  }
  $t = [System.IO.File]::ReadAllText($f)

  if ($t -match 'NOT APPLIED') {
    Write-Host ("SKIP (already)     {0}" -f [System.IO.Path]::GetFileName($f))
    continue
  }

  $n = ([regex]::Matches($t, [regex]::Escape($old))).Count
  Write-Host ("{0,-18} {1}   'exit 0' occurrences = {2}" -f 'CANDIDATE', [System.IO.Path]::GetFileName($f), $n)

  if ($n -ne 1) {
    Write-Host ("   -> expected exactly 1; leaving this file alone")
    continue
  }
  $plan += @{ path = $f; text = $t }
}

Write-Host ""
Write-Host ("{0} file(s) to change." -f $plan.Count)

if (-not $Apply) {
  Write-Host "DRY - nothing written. Re-run with -Apply."
  exit 2
}

$enc = New-Object System.Text.UTF8Encoding($false)
foreach ($p in $plan) {
  $t = $p.text.Replace($old, $new)
  [System.IO.File]::WriteAllText($p.path, $t, $enc)
  Write-Host ("patched  {0}" -f [System.IO.Path]::GetFileName($p.path))
}
Write-Host "DONE"
