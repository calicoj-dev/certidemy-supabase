#requires -Version 5.1
<#
  patch-gen-jta-translations-rule17.ps1

  Three edits to supabase\scripts\gen-jta-translations.mjs:

    P1  CERT_ID silent fallback -> hard exit.
        Line 96 defaults to SM-AI-I. Forget the env var and the script writes
        machine translations into a cert whose 116 rows are reviewed and
        approved. Same DEFAULT_CERT_CODE pattern that caused four bugs and was
        deleted from the generator scripts.

    P2  Rule 17 ISO terminology block into translateSystem().
        A dry run on ISMS-F produced "clausulas 4 e 5" (pt) and "clausulas 4 y
        5" (es) - six errors in five domain rows. The glossary lives inline in
        this function; a terminology document the generator never reads is
        decoration.

    P3  Stale header knob list (ONLY=ksa is missing; CERT_ID default is gone).

  DRY RUN BY DEFAULT. -Apply to write.

  ASCII-ONLY on both sides:
   * This .ps1 has no non-ASCII literal - PS 5.1 decodes a BOM-less .ps1 as
     ANSI and would mangle them.
   * The injected JS uses \uXXXX escapes, so the patch text is ASCII too and
     cannot corrupt in transit. Node decodes at runtime. Same convention as
     load-jta-i18n.mjs.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\supabase\scripts\gen-jta-translations.mjs"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t    = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")

$edits = @()
function Add-Edit($id, $find, $replace) {
  $script:edits += [PSCustomObject]@{ Id = $id; Find = $find; Replace = $replace }
}

# --------------------------------------------------------------------------
# P1 - CERT_ID must be explicit
# --------------------------------------------------------------------------
$p1find = 'const CERT_ID = process.env.CERT_ID || "11111111-1111-1111-1111-111111111111"; // SM-AI-I'
$p1repl = @(
  '// CERT_ID is MANDATORY. It used to default to SM-AI-I, which meant a forgotten'
  '// env var silently wrote machine translations into a cert with 116 reviewed,'
  '// approved rows. A run against the wrong cert has already happened once via a'
  '// leftover $env:CERT_ID. Fail loudly instead.'
  'const CERT_ID = process.env.CERT_ID;'
  'if (!CERT_ID) {'
  '  console.error("CERT_ID is required. Set it explicitly - there is no default.");'
  '  console.error(''  PowerShell:  $env:CERT_ID="<uuid>"'');'
  '  console.error("  Clear a stale one with:  Remove-Item Env:\\CERT_ID");'
  '  process.exit(1);'
  '}'
) -join "`n"
Add-Edit 'P1' $p1find $p1repl

# --------------------------------------------------------------------------
# P2 - Rule 17 block. Inserted before the "formal competency statements" line
# so it sits with the other terminology rules.
#
# Escapes used:  \u00e1 a  \u00e7 c  \u00e3 a  \u00ed i  \u00f3 o  \u00e9 e
# --------------------------------------------------------------------------
$p2find = '  - These are formal competency statements, not marketing copy: preserve meaning precisely, keep it concise and professional, no added flourish.'
$p2repl = @(
  '  - ISO STANDARD VOCABULARY (Rule 17). Where a certification is built on a published standard, clause-and-control vocabulary follows the ADOPTED translation, because a candidate can open the source and check. These rules fire only when the terms appear:'
  '  - ''clause'' as a numbered division of an ISO standard: pt-BR is Se\u00e7\u00e3o (ABNT NBR ISO/IEC 27001 normative text: "os requisitos especificados nas Se\u00e7\u00f5es 4 a 10"). es-419 is cap\u00edtulo for a whole top-level division and apartado for a numbered sub-requirement. NEVER cl\u00e1usula in either language - it reads as a contractual clause.'
  '  - The ISO 31000:2018 risk triplet in es-419, which changed meaning from the 2010 edition: risk assessment (the WHOLE process) is evaluaci\u00f3n del riesgo; risk analysis is an\u00e1lisis del riesgo; risk evaluation (the THIRD step only) is valoraci\u00f3n del riesgo. NEVER apreciaci\u00f3n, which is the superseded 2010 rendering. Do not collapse evaluaci\u00f3n and valoraci\u00f3n - the distinction is what the task assesses.'
  '  - The same triplet in pt-BR: risk assessment (whole process) is processo de avalia\u00e7\u00e3o de riscos; risk analysis is an\u00e1lise de riscos; risk evaluation (third step) is avalia\u00e7\u00e3o de riscos.'
  '  - Fixed ISO 27001 renderings: Statement of Applicability is Declaraci\u00f3n de Aplicabilidad / Declara\u00e7\u00e3o de Aplicabilidade. ISMS is SGSI in both. Annex A is Anexo A. reference controls is controles de referencia / refer\u00eancia de controles. nonconformity is no conformidad / n\u00e3o conformidade. documented information is informaci\u00f3n documentada / informa\u00e7\u00e3o documentada. interested parties is partes interesadas / partes interessadas. risk owner is propietario del riesgo / propriet\u00e1rio do risco. residual risk is riesgo residual / risco residual.'
  '  - Annex A themes: Controles organizacionales/organizacionais, de personas/de pessoas, f\u00edsicos/f\u00edsicos, tecnol\u00f3gicos/tecnol\u00f3gicos.'
  '  - Keep ''shadow AI'' in English on first use, glossed: IA en la sombra (shadow AI) / IA sombra (shadow AI).'
  '  - These are formal competency statements, not marketing copy: preserve meaning precisely, keep it concise and professional, no added flourish.'
) -join "`n"
Add-Edit 'P2' $p2find $p2repl

# --------------------------------------------------------------------------
# P3 - header knob list
# --------------------------------------------------------------------------
$p3find = ' * Knobs: CERT_ID (default SM-AI-I), ONLY, CHUNK (25 statements/call), DRY_RUN,'
$p3repl = @(
  ' * Knobs: CERT_ID (REQUIRED - no default; the script exits if unset),'
  ' * ONLY (all | domains | tasks | ksa), CHUNK (25 statements/call), DRY_RUN,'
) -join "`n"
Add-Edit 'P3' $p3find $p3repl

# --------------------------------------------------------------------------
# PASS 1 - every anchor exactly once, or nothing is written
# --------------------------------------------------------------------------
Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
$fail = $false
foreach ($e in $edits) {
  $find = if ($crlf) { $e.Find -replace "(?<!`r)`n", "`r`n" } else { $e.Find }
  $n = 0; $i = 0
  while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  if ($n -eq 1) { Write-Host ("  {0}  OK   (1 match)" -f $e.Id) -ForegroundColor Green }
  else { Write-Host ("  {0}  FAIL ({1} matches - need exactly 1)" -f $e.Id, $n) -ForegroundColor Red; $fail = $true }
}
if ($fail) { Write-Host "`nABORTED. Nothing written." -ForegroundColor Red; exit 1 }

if (-not $Apply) {
  Write-Host "`nDRY RUN - all anchors matched. Re-run with -Apply to write." -ForegroundColor Yellow
  exit 0
}

# --------------------------------------------------------------------------
# PASS 2 - apply
# --------------------------------------------------------------------------
foreach ($e in $edits) {
  $find = if ($crlf) { $e.Find    -replace "(?<!`r)`n", "`r`n" } else { $e.Find }
  $repl = if ($crlf) { $e.Replace -replace "(?<!`r)`n", "`r`n" } else { $e.Replace }
  $t = $t.Replace($find, $repl)
}
[System.IO.File]::WriteAllText($f, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "WROTE $f" -ForegroundColor Green

# --------------------------------------------------------------------------
# PASS 3 - verify by token
# --------------------------------------------------------------------------
Write-Host "`nTOKEN VERIFY (each must be > 0)" -ForegroundColor Cyan
@(
  'CERT_ID is required. Set it explicitly'
  'ISO STANDARD VOCABULARY (Rule 17)'
  'Se\\u00e7\\u00e3o'
  'valoraci\\u00f3n del riesgo'
  'Declaraci\\u00f3n de Aplicabilidad'
  'CERT_ID (REQUIRED'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -Pattern ([regex]::Escape($_))).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}

Write-Host "`nRESIDUAL - old CERT_ID fallback must be gone (expect no output)" -ForegroundColor Cyan
Select-String -LiteralPath $f -Pattern '11111111-1111-1111-1111-111111111111'

Write-Host "`nSYNTAX CHECK" -ForegroundColor Cyan
Push-Location ([System.IO.Path]::GetDirectoryName($f))
node --check (Split-Path -Leaf $f)
if ($LASTEXITCODE -eq 0) { Write-Host "  node --check OK" -ForegroundColor Green }
else { Write-Host "  node --check FAILED - fix before running" -ForegroundColor Red }
Pop-Location
