#requires -Version 5.1
<#
  patch-17024-edition-pin.ps1

  Pins every CLAIM surface to ISO/IEC 17024:2026.

  WHY
  ---
  ISO/IEC 17024:2026 replaced the 2012 edition in March 2026. CLAIMS-POLICY.md
  S4 was pinned to :2026 earlier today, but only the policy document changed.
  Every surface that makes the claim still said bare "17024", whose referent is
  now ambiguous - and the 2026 edition added clause 6.5 (AI in the certification
  process), which Certidemy has NOT assessed itself against. CLAIMS-POLICY
  Class C already forbids any 6.5 conformance claim; this makes sure no surface
  implies one.

  APPROACH
  --------
  In a CLAIM file, every "ISO/IEC 17024" is part of a claim, so the whole file
  is pinned rather than a list of phrases. An earlier draft used a phrase list
  and the phrases overlapped ("built to the ISO/IEC 17024 framework" contains
  "built to the ISO/IEC 17024"), which inflated counts and risked double-pins.
  A whole-file replace with a not-already-pinned guard has neither problem.

  NOTE: bare "ISO 17024" (no /IEC) is deliberately NOT matched. It appears in
  objections.ts only inside the DON'T-SAY examples - "Yes, we're ISO 17024
  certified" - which quote the forbidden claim and must stay as written.

  WHAT IS NOT TOUCHED
  -------------------
   * ISMS-F lesson 05-06 and AIE-I 03-05 / 03-06 - these TEACH what 17024 is.
     Edition-independent facts; pinning would date teaching content for nothing.
   * Handoffs, migrations, code comments, verify-cert, JTA and BoK - internal.
   * SCHEME-*.md - separate pass; each also needs its own wording checked
     against CLAIMS-POLICY S5.
   * The 8 database description rows - already pinned by SQL.

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$web = "C:\Users\Juan\Documents\certidemy\certidemy-web"
$sup = "C:\Users\Juan\Documents\certidemy\supabase"

$BARE   = 'ISO/IEC 17024'
$PINNED = 'ISO/IEC 17024:2026'

$TARGETS = @(
  "$sup\functions\_shared\factsheet.ts"
  "$sup\functions\_shared\enginebrief.ts"
  "$sup\functions\_shared\objections.ts"
  "$sup\functions\_shared\whatis.ts"
  "$web\lib\legal\content.ts"
  "$web\app\llms.txt\route.ts"
  "$web\scripts\load-cert-descriptions.mjs"
  "$web\components\console\library-flow.tsx"
)

Write-Host "TARGET FILES" -ForegroundColor Cyan
$found = @()
foreach ($p in $TARGETS) {
  if (Test-Path -LiteralPath $p) { $found += $p; Write-Host ("  ok      {0}" -f (Split-Path $p -Leaf)) -ForegroundColor Green }
  else { Write-Host ("  MISSING {0}" -f $p) -ForegroundColor Red }
}
if ($found.Count -ne $TARGETS.Count) { Write-Host "`nABORTED - fix the paths first." -ForegroundColor Red; exit 1 }

Write-Host "`nOCCURRENCES" -ForegroundColor Cyan
$plan = @(); $grand = 0
foreach ($p in $found) {
  $t = [System.IO.File]::ReadAllText($p)
  $all  = ([regex]::Matches($t, [regex]::Escape($BARE))).Count
  $done = ([regex]::Matches($t, [regex]::Escape($PINNED))).Count
  $todo = $all - $done
  if ($todo -gt 0) {
    $plan += [pscustomobject]@{ Path = $p; Name = (Split-Path $p -Leaf); Todo = $todo }
    $grand += $todo
    Write-Host ("  {0,-30} {1,3} to pin  ({2} already)" -f (Split-Path $p -Leaf), $todo, $done)
  } else {
    Write-Host ("  {0,-30}   - already pinned ({1})" -f (Split-Path $p -Leaf), $done) -ForegroundColor DarkGray
  }
}
Write-Host ("  files: {0}   occurrences: {1}" -f $plan.Count, $grand) -ForegroundColor Cyan

if (-not $Apply) {
  Write-Host "`nDRY RUN - nothing written. Re-run with -Apply." -ForegroundColor Yellow
  exit 0
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$SENTINEL = [string][char]0x0001 + "P" + [string][char]0x0001
foreach ($f in $plan) {
  $t = [System.IO.File]::ReadAllText($f.Path)
  $t = $t.Replace($PINNED, $SENTINEL)   # protect what is already pinned
  $t = $t.Replace($BARE,   $PINNED)     # pin the rest
  $t = $t.Replace($SENTINEL, $PINNED)   # restore
  [System.IO.File]::WriteAllText($f.Path, $t, $utf8)
  Write-Host ("  WROTE {0}" -f $f.Name) -ForegroundColor Green
}

Write-Host "`nVERIFY - unpinned occurrences remaining (expect 0)" -ForegroundColor Cyan
$left = 0
foreach ($p in $found) {
  $t = [System.IO.File]::ReadAllText($p)
  $c = ([regex]::Matches($t, [regex]::Escape($BARE))).Count - ([regex]::Matches($t, [regex]::Escape($PINNED))).Count
  if ($c -gt 0) { Write-Host ("  LEFT {0}: {1}" -f (Split-Path $p -Leaf), $c) -ForegroundColor Red; $left += $c }
}
if ($left -eq 0) { Write-Host "  clean" -ForegroundColor Green }

Write-Host "`nDOUBLE-PIN CHECK (expect 0)" -ForegroundColor Cyan
$dbl = 0
foreach ($p in $found) { $dbl += ([regex]::Matches([System.IO.File]::ReadAllText($p), '17024:2026:2026')).Count }
if ($dbl -eq 0) { Write-Host "  clean" -ForegroundColor Green } else { Write-Host ("  {0} DOUBLE-PINNED" -f $dbl) -ForegroundColor Red }

Write-Host "`nSENTINEL CHECK (expect 0 - a leaked control char would corrupt the file)" -ForegroundColor Cyan
$sen = 0
foreach ($p in $found) { $sen += ([regex]::Matches([System.IO.File]::ReadAllText($p), [char]0x0001)).Count }
if ($sen -eq 0) { Write-Host "  clean" -ForegroundColor Green } else { Write-Host ("  {0} LEAKED - git restore those files" -f $sen) -ForegroundColor Red }

Write-Host "`nNEXT: npm run build (web), then deploy render-asset from the parent folder." -ForegroundColor Yellow
