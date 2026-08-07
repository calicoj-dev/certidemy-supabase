# patch-schema-guide-s6.ps1
# ONE change to CERT-SCHEMA-GUIDE.md section 6: record that modules.slug carries a
# GLOBAL unique constraint, not one scoped to certification_id.
#
# Found 2026-08-06: AIMS-F's migration 177 failed with 23505 on
# modules_slug_unique, colliding with ISMS-F on 'evaluation-improvement-certification'.
# AIMS-F now prefixes every module slug with 'aims-'.
#
# Section 2 is NOT touched - it was already corrected by another session and its
# wording is better sourced than a replacement would be.
#
# The anchor is built from the file's real bytes. Lines 264 and 267 contain
# U+2192 (right arrow); the anchor deliberately stops short of them.
#
# Usage:  .\patch-schema-guide-s6.ps1            (dry run)
#         .\patch-schema-guide-s6.ps1 -Apply

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = 'C:\Users\Juan\Documents\certidemy\supabase\CERT-SCHEMA-GUIDE.md'
if (-not (Test-Path -LiteralPath $f)) { throw "Not found: $f" }

$t = [System.IO.File]::ReadAllText($f)

# detect the file's own line ending so the insert matches it
$crlf = $t.Contains("`r`n")
$nl   = if ($crlf) { "`r`n" } else { "`n" }
Write-Host ("file line endings: {0}" -f $(if ($crlf) { 'CRLF' } else { 'LF' }))

# anchor: the first two lines of the slug bullet, stopping before the arrow on line 267
$old = "- **slug** MUST equal the lesson content folder name **minus the ``NN-`` prefix**, and" + $nl +
       "  the ``module_slug`` in every lesson's frontmatter. Slug typo = lessons silently"

$new = "- **slug is GLOBALLY UNIQUE.** ``modules_slug_unique`` is a table-wide constraint," + $nl +
       "  **not scoped to ``certification_id``**. Verified 2026-08-06: AIMS-F's modules" + $nl +
       "  migration failed with 23505, colliding with ISMS-F on" + $nl +
       "  ``evaluation-improvement-certification``. **Prefix module slugs per cert**" + $nl +
       "  (AIMS-F uses ``aims-``), or check first:" + $nl +
       "  ``select slug from modules where slug in (...);``" + $nl +
       "- **slug** MUST equal the lesson content folder name **minus the ``NN-`` prefix**, and" + $nl +
       "  the ``module_slug`` in every lesson's frontmatter. Slug typo = lessons silently"

$n = ([regex]::Matches($t, [regex]::Escape($old))).Count
Write-Host ("S6 slug bullet   matches = {0}  (need 1)" -f $n)
if ($n -ne 1) { throw "ANCHOR MISMATCH - do not apply." }

if ($t -match 'modules_slug_unique') { throw "Already patched - modules_slug_unique is present. Nothing to do." }

if (-not $Apply) {
  Write-Host ""
  Write-Host "DRY OK - anchor matched exactly once. Re-run with -Apply."
  exit 2   # NOT APPLIED - non-zero so a skipped -Apply cannot look like success
}

$t = $t.Replace($old, $new)
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($f, $t, $enc)
Write-Host "WRITTEN"
