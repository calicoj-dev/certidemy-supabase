# patch-jta-translations-aims-terminology.ps1
# Adds an ISO/IEC 42001 terminology rule to gen-jta-translations.mjs.
#
# WHY. Line 233 fixes "ISMS is SGSI in both", which is correct for ISMS-F. With
# no equivalent rule for the AI management system, the model coined SGSIA by
# analogy - and then drifted to "SGSI de IA" on four task statements, including
# task 3.7, whose entire point is distinguishing an ISMS from an AIMS.
#
# SGSIA is not a term. Verified 2026-08-07 against the Spanish-language market:
# certification bodies use either "sistema de gestion de IA" spelled out (DEKRA,
# BSI), the acronym SGIA (Bureau Veritas, iso.cat), or the English AIMS
# (Intertek, G-CERTI). The official Spanish adoption is UNE-ISO/IEC 42001,
# titled "Tecnologia de la informacion - Inteligencia artificial - Sistema de
# gestion" - spelled out, no acronym.
#
# RULING: spell it out. SGIA is defensible but minority usage, and a learner who
# meets an acronym in a task statement and never in a lesson has no way to
# resolve it. The lessons already spell it out; the JTA should match.
#
# Pure ASCII: accented characters are built with [char]0xNNNN.
#
# Usage:  .\patch-jta-translations-aims-terminology.ps1            (dry run)
#         .\patch-jta-translations-aims-terminology.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = 'C:\Users\Juan\Documents\certidemy\supabase\scripts\gen-jta-translations.mjs'
if (-not (Test-Path -LiteralPath $f)) { throw "Not found: $f" }

$t = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")
$nl   = if ($crlf) { "`r`n" } else { "`n" }
Write-Host ("file line endings: {0}" -f $(if ($crlf) { 'CRLF' } else { 'LF' }))

if ($t -match 'NEVER coin an acronym') { throw "Already patched. Nothing to do." }

$oacute = [char]0x00F3   # o acute
$aacute = [char]0x00E3   # a tilde

# anchor: the tail of the fixed-renderings line, which ends with residual risk
$old = 'residual risk is riesgo residual / risco residual.'

$new = 'residual risk is riesgo residual / risco residual.' + $nl +
       '  - ISO/IEC 42001 AI MANAGEMENT SYSTEM. Spell it out: sistema de gesti' + $oacute + 'n de IA (es-419) / sistema de gest' + $aacute + 'o de IA (pt-BR). NEVER coin an acronym for it - not SGSIA, not SGIA, not SGSI de IA. SGSI means information SECURITY management system and belongs only to ISO/IEC 27001; reusing or extending it for the AI management system is wrong, and it is most wrong in the tasks that contrast the two. Where a statement mentions both, keep them plainly distinct: SGSI for the information security management system, sistema de gesti' + $oacute + 'n de IA / sistema de gest' + $aacute + 'o de IA for the AI one.'

$n = ([regex]::Matches($t, [regex]::Escape($old))).Count
Write-Host ("anchor matches = {0}  (need 1)" -f $n)
if ($n -ne 1) { throw "ANCHOR MISMATCH - do not apply." }

if (-not $Apply) {
  Write-Host ""
  Write-Host "DRY OK - anchor matched exactly once. Re-run with -Apply."
  exit 2   # NOT APPLIED - non-zero so a skipped -Apply cannot look like success
}

$t = $t.Replace($old, $new)
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($f, $t, $enc)
Write-Host "WRITTEN"
