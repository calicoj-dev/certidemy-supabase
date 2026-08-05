#requires -Version 5.1
<#
  patch-translate-lessons-rule17.ps1

  Adds the Rule 17 ISO terminology block to translate-lessons.mjs.

  WHY
  ---
  Rule 17 was patched into gen-jta-translations.mjs (task statements, domain
  titles, K/S/A). translate-lessons.mjs is a different script with its own
  system prompt, and it was never told. A single-lesson test run on
  01-04-the-27000-family produced:

      "las Clausulas 4 a 10 no pueden excluirse"        (x2)
      "la clausula de terminos se redujo"               (x2)

  Rule 17 requires capitulo for a whole top-level division and apartado for a
  numbered sub-requirement in es-419, and Secao in pt-BR. Never clausula.

  "Clause" is the single most frequent ISO term across the 49 lessons. Caught
  by reading one translated file before running the other 97 - STYLE-GUIDE S11.

  ASCII-ONLY: the injected JS uses \uXXXX escapes, so this .ps1 and the patch
  text are both plain ASCII and cannot corrupt in transit. Node decodes at
  runtime.

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\supabase\scripts\translate-lessons.mjs"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t    = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")

# Anchor on the KEEP-IN-ENGLISH heading inside systemPrompt(). The Rule 17 block
# is inserted immediately before it, so the terminology rules sit with the other
# translation guidance rather than after the frozen-key list.
$find = "- Every other frontmatter field: lesson_id, module_slug, certification_code, lesson_group_id, order_index, duration_minutes, task_codes, concept_slugs, prerequisites, autho"

$block = @(
  ""
  "ISO STANDARD VOCABULARY (Rule 17). These lessons are built on a published standard, so clause-and-control vocabulary follows the ADOPTED translation - a candidate can open the source and check. Apply these whenever the terms appear:"
  "- 'clause' as a numbered division of an ISO standard: es-419 uses cap\u00edtulo for a whole top-level division (Clause 6) and apartado for a numbered sub-requirement (clause 6.1.3). pt-BR uses Se\u00e7\u00e3o. NEVER cl\u00e1usula in either language - it reads as a contractual clause. 'Clauses 4 to 10' is 'los cap\u00edtulos 4 a 10' / 'as Se\u00e7\u00f5es 4 a 10'."
  "- The ISO 31000:2018 risk triplet in es-419: risk assessment (the WHOLE process) is evaluaci\u00f3n del riesgo; risk analysis is an\u00e1lisis del riesgo; risk evaluation (the THIRD step only) is valoraci\u00f3n del riesgo. NEVER apreciaci\u00f3n, which is the superseded 2010 rendering. Do not collapse evaluaci\u00f3n and valoraci\u00f3n."
  "- The same triplet in pt-BR: risk assessment (whole process) is processo de avalia\u00e7\u00e3o de riscos; risk analysis is an\u00e1lise de riscos; risk evaluation (third step) is avalia\u00e7\u00e3o de riscos."
  "- Fixed ISO/IEC 27001 renderings: Statement of Applicability is Declaraci\u00f3n de Aplicabilidad / Declara\u00e7\u00e3o de Aplicabilidade. ISMS is SGSI in both. Annex A is Anexo A. reference controls is controles de referencia / refer\u00eancia de controles. nonconformity is no conformidad / n\u00e3o conformidade. corrective action is acci\u00f3n correctiva / a\u00e7\u00e3o corretiva. documented information is informaci\u00f3n documentada / informa\u00e7\u00e3o documentada. interested parties is partes interesadas / partes interessadas. risk owner is propietario del riesgo / propriet\u00e1rio do risco. residual risk is riesgo residual / risco residual. risk treatment is tratamiento del riesgo / tratamento de riscos."
  "- Annex A themes: Controles organizacionales / organizacionais, de personas / de pessoas, f\u00edsicos / f\u00edsicos, tecnol\u00f3gicos / tecnol\u00f3gicos."
  "- A published standard is 'la norma' (es) / 'a norma' (pt), not 'el est\u00e1ndar' / 'o padr\u00e3o'."
  "- AI-era terms are NOT covered by Rule 17 and take the natural operational register. Keep 'prompt' and 'shadow AI' in English (gloss shadow AI on first use: IA en la sombra (shadow AI) / IA sombra (shadow AI)). AI is IA in both languages."
  ""
  "- Every other frontmatter field: lesson_id, module_slug, certification_code, lesson_group_id, order_index, duration_minutes, task_codes, concept_slugs, prerequisites, autho"
) -join "`n"

if ($crlf) { $block = $block -replace "(?<!`r)`n", "`r`n" }

$n = 0; $i = 0
while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
Write-Host ("ANCHOR: {0} (need 1)" -f $n) -ForegroundColor $(if ($n -eq 1) { 'Green' } else { 'Red' })
if ($n -ne 1) {
  Write-Host "ABORTED. Paste the systemPrompt() KEEP-IN-ENGLISH line and I will match it." -ForegroundColor Red
  exit 1
}

if (-not $Apply) {
  Write-Host "`nDRY RUN - anchor matched. Re-run with -Apply to write." -ForegroundColor Yellow
  exit 0
}

[System.IO.File]::WriteAllText($f, $t.Replace($find, $block), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "WROTE $f" -ForegroundColor Green

Write-Host "`nVERIFY (each must be > 0)" -ForegroundColor Cyan
@(
  'ISO STANDARD VOCABULARY (Rule 17)'
  'NEVER cl\u00e1usula'
  'valoraci\u00f3n del riesgo'
  'Declaraci\u00f3n de Aplicabilidad'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -SimpleMatch -Pattern $_).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}

Write-Host "`nSYNTAX CHECK" -ForegroundColor Cyan
Push-Location ([System.IO.Path]::GetDirectoryName($f))
node --check (Split-Path -Leaf $f)
if ($LASTEXITCODE -eq 0) { Write-Host "  node --check OK" -ForegroundColor Green }
else { Write-Host "  SYNTAX FAILED - git restore before proceeding" -ForegroundColor Red }
Pop-Location

Write-Host "`nNEXT: re-translate the test lesson with --force and confirm capitulos." -ForegroundColor Yellow
