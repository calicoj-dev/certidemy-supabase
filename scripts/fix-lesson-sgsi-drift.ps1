# fix-lesson-sgsi-drift.ps1
# Replaces SGSI with the spelled-out AI management system in five translated
# lesson files, where the English source says AIMS and the translator wrote the
# ISO/IEC 27001 acronym.
#
# NOT a blanket replacement. SGSI is CORRECT and preserved in:
#   03-07, 04-07, 05-06  (integration lessons, both languages)
#   02-04 and 03-06      (both languages - each explicitly contrasts an ISMS
#                         with the AI management system, matching the English)
#
# The most serious fix is 05-02 es-419, where SGSI appears in the KEY of q1 -
# a question about what internal audit tests, naming the wrong system.
#
# Pure ASCII: accented characters built with [char]0xNNNN.
#
# Usage:  .\fix-lesson-sgsi-drift.ps1            (dry run)
#         .\fix-lesson-sgsi-drift.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Juan\Documents\certidemy\certidemy-web\content\aims-f\_i18n'

$paths  = New-Object System.Collections.ArrayList
$olds   = New-Object System.Collections.ArrayList
$news   = New-Object System.Collections.ArrayList
$counts = New-Object System.Collections.ArrayList

function Add-Edit($lang, $rel, $old, $new, $count) {
  [void]$paths.Add([System.IO.Path]::Combine($root, $lang, $rel))
  [void]$olds.Add($old)
  [void]$news.Add($new)
  [void]$counts.Add($count)
}

Add-Edit 'pt-BR' '03-aims-support-and-operation\03-04-operational-planning-and-control.md' ('relevantes para o SGSI') ('relevantes para o sistema de gest' + [char]0x00E3 + 'o de IA') 3
Add-Edit 'es-419' '03-aims-support-and-operation\03-05-third-party-ai-supply.md' ('para usarse en un SGSI') ('para usarse en un sistema de gesti' + [char]0x00F3 + 'n de IA') 1
Add-Edit 'es-419' '03-aims-support-and-operation\03-05-third-party-ai-supply.md' ('del alcance de su SGSI') ('del alcance de su sistema de gesti' + [char]0x00F3 + 'n de IA') 1
Add-Edit 'es-419' '04-aims-annex-a-controls\04-02-annex-a-and-the-soa.md' ('fuera del alcance del SGSI') ('fuera del alcance del sistema de gesti' + [char]0x00F3 + 'n de IA') 1
Add-Edit 'pt-BR' '04-aims-annex-a-controls\04-02-annex-a-and-the-soa.md' ('fora do escopo do SGSI') ('fora do escopo do sistema de gest' + [char]0x00E3 + 'o de IA') 1
Add-Edit 'es-419' '05-aims-evaluation-and-certification\05-02-aims-internal-audit.md' ('de la organizaci' + [char]0x00F3 + 'n para su SGSI') ('de la organizaci' + [char]0x00F3 + 'n para su sistema de gesti' + [char]0x00F3 + 'n de IA') 1

$fail = $false
for ($i = 0; $i -lt $paths.Count; $i++) {
  $f = $paths[$i]
  if (-not (Test-Path -LiteralPath $f)) {
    Write-Host ("MISSING: " + $f); $fail = $true; continue
  }
  $t = [System.IO.File]::ReadAllText($f)
  $n = ([regex]::Matches($t, [regex]::Escape($olds[$i]))).Count
  Write-Host ("{0,-46} matches={1} need={2}" -f [System.IO.Path]::GetFileName($f), $n, $counts[$i])
  if ($n -ne $counts[$i]) { $fail = $true }
}
if ($fail) { throw "ANCHOR MISMATCH - do not apply." }

if (-not $Apply) {
  Write-Host ""
  Write-Host "DRY OK - all anchors matched. Re-run with -Apply."
  exit 2
}

$enc = New-Object System.Text.UTF8Encoding($false)
for ($i = 0; $i -lt $paths.Count; $i++) {
  $t = [System.IO.File]::ReadAllText($paths[$i])
  $t = $t.Replace($olds[$i], $news[$i])
  [System.IO.File]::WriteAllText($paths[$i], $t, $enc)
  Write-Host ("patched " + [System.IO.Path]::GetFileName($paths[$i]))
}
Write-Host "DONE"
