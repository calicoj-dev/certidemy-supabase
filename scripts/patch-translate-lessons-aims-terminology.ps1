# patch-translate-lessons-aims-terminology.ps1
# Adds the ISO/IEC 42001 terminology rule to translate-lessons.mjs.
#
# WHY. gen-jta-translations.mjs made this error and was fixed in f5cd8c4. The
# lesson translator has its OWN prompt and made the same error independently:
# 67 occurrences of the invented acronym SGSIA across 17 es-419 and 10 pt-BR
# lesson files.
#
# SGSIA is not a term. The Spanish-language market uses "sistema de gestion de
# IA" spelled out (BSI, DEKRA), SGIA (Bureau Veritas, iso.cat) or the English
# AIMS (Intertek). The official adoption UNE-ISO/IEC 42001 spells it out.
#
# SGSI legitimately means the INFORMATION SECURITY management system and appears
# correctly in the three integration lessons (03-07, 04-07, 05-06). The rule
# must preserve that use while forbidding the coined AI variant.
#
# Pure ASCII: accented characters built with [char]0xNNNN.
#
# Usage:  .\patch-translate-lessons-aims-terminology.ps1            (dry run)
#         .\patch-translate-lessons-aims-terminology.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = 'C:\Users\Juan\Documents\certidemy\supabase\scripts\translate-lessons.mjs'
if (-not (Test-Path -LiteralPath $f)) { throw "Not found: $f" }

$t = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")
$nl   = if ($crlf) { "`r`n" } else { "`n" }
Write-Host ("file line endings: {0}" -f $(if ($crlf) { 'CRLF' } else { 'LF' }))

if ($t -match 'NEVER coin an acronym') { throw "Already patched. Nothing to do." }

$oacute = [char]0x00F3
$atilde = [char]0x00E3

# anchor: the glossary freeze line in the prompt, line ~353
$old = '- The bracketed LABEL in [label]{glossary="slug"}'

$new = '- ISO/IEC 42001 AI MANAGEMENT SYSTEM TERMINOLOGY. Spell it out: sistema de gesti' + $oacute + 'n de IA (es-419) / sistema de gest' + $atilde + 'o de IA (pt-BR). NEVER coin an acronym for it - not SGSIA, not SGIA, not SGSI de IA. SGSI means information SECURITY management system and belongs to ISO/IEC 27001 only; it is correct where the English says ISMS, and wrong everywhere the English says AI management system or AIMS. Several lessons contrast the two, so keeping them distinct is the point rather than a detail.' + $nl +
       '- The bracketed LABEL in [label]{glossary="slug"}'

$n = ([regex]::Matches($t, [regex]::Escape($old))).Count
Write-Host ("anchor matches = {0}  (need 1)" -f $n)
if ($n -ne 1) { throw "ANCHOR MISMATCH - do not apply." }

if (-not $Apply) {
  Write-Host ""
  Write-Host "DRY OK - anchor matched exactly once. Re-run with -Apply."
  exit 2   # NOT APPLIED
}

$t = $t.Replace($old, $new)
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($f, $t, $enc)
Write-Host "WRITTEN"
