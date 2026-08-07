#requires -Version 5.1
<#
  patch-isms-f-clause-6-3.ps1

  Adds ISO/IEC 27001:2022 clause 6.3 (Planning of changes) to lesson 02-09.

  WHY
  ---
  Checked against the standard: 6.3 is a real numbered requirement sitting in
  the body between 6.2 and 7.1. ISMS-F never mentions it, while the scheme
  claims to cover Clauses 4 to 10. It is one sentence, and it is missing from
  the standard's OWN table of contents - which is how it was missed here, and
  is itself worth teaching.

  WHY A CONCEPT AND NOT A TASK
  ----------------------------
  A new task would mean 50 tasks, a re-derived blueprint, a new lesson, and a
  fresh item batch - and would make SCHEME-ISMS-F.md, the JTA document and the
  jta_versions snapshot all stale on their counts. As a concept on task 2.9 the
  blueprint does not move: still 49 tasks, same weights, same cognitive
  profile, same 40-item form. Concepts go 191 -> 192.

  Task 2.9 is the right home. Its exam-watch already teaches that Clauses 4 to
  7 are Plan, 8 is Do, 9 is Check, 10 is Act. Clause 6.3 is in Plan, and the
  Act step is what decides a change is needed - so the requirement is the loop
  closing on itself, which is exactly what this lesson is about.

  ASCII-only: the em dash is built with [char].

  AFTER APPLYING:
    1. insert the concept row (SQL printed at the end)
    2. update-lesson-content.mjs --lang en
    3. re-translate 02-09 to es-419 and pt-BR, then load both
    4. wire-lessons.mjs   (the new concept_slug must project into lesson_concepts)
    5. regenerate task 2.9's practice items so the concept is TESTED, not just
       taught - otherwise verify-cert's "all testable concepts tested" fails

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\certidemy-web\content\isms-f\02-the-isms-context-and-leadership\02-09-pdca-and-improvement.md"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t    = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")
$EM   = [char]0x2014

$edits = @()

# --- A: frontmatter concept_slugs -------------------------------------------
$edits += ,@('A  frontmatter concept_slugs',
@'
  - pdca-cycle
  - continual-improvement
  - management-system-maturity
'@,
@'
  - pdca-cycle
  - continual-improvement
  - management-system-maturity
  - planned-change
'@)

# --- B: the new concept block, before "Documented and operating" -------------
$block = @(
  "::concept title=`"Changes go through the loop, not around it`""
  "The Act step decides something must change. [Clause 6.3]{glossary=`"planned-change`"} is one sentence about what happens next: when the organization determines that a change to the ISMS is needed, the change is carried out in a planned manner."
  ""
  "It sits in Clause 6, which is Plan. That placement is the loop closing on itself $EM Act decides a change is needed, and Plan governs how it is made."
  ""
  "What `"planned`" rules out is the Friday afternoon fix: a control altered because someone noticed a problem, with no assessment of what else it touches, no update to the Statement of Applicability or the risk treatment plan, and nobody told. The change may even be the right one. It was not carried out in a planned manner, and the system no longer describes itself accurately."
  ""
  "One detail worth carrying: **6.3 does not appear in the standard's table of contents.** It is in the body, between 6.2 and 7.1, and the contents page skips from 6.2 to 7. Reading the contents page is not the same as reading the standard $EM a lesson that costs nothing to learn here and something to learn in an audit."
  "::"
  ""
  "::concept title=`"Documented and operating are different states`""
) -join "`n"

$edits += ,@('B  new concept block', "::concept title=`"Documented and operating are different states`"", $block)

# --- C: summary line ---------------------------------------------------------
$edits += ,@('C  summary',
  '- Documented and operating are different states, and the gap between them is what stage 2 audits find.',
  "- Documented and operating are different states, and the gap between them is what stage 2 audits find.`n- Clause 6.3 requires changes to the ISMS to be carried out in a planned manner $EM the Act step decides, and Plan governs how.")

Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
$fail = $false
foreach ($e in $edits) {
  $find = $e[1]; if ($crlf) { $find = $find -replace "(?<!`r)`n", "`r`n" }
  $n = 0; $i = 0
  while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  if ($n -eq 1) { Write-Host ("  OK   {0}" -f $e[0]) -ForegroundColor Green }
  else { Write-Host ("  FAIL ({0})  {1}" -f $n, $e[0]) -ForegroundColor Red; $fail = $true }
}
if ($fail) {
  Write-Host "`nABORTED. If C failed, paste the ::summary block and I will match it." -ForegroundColor Red
  exit 1
}
if (-not $Apply) { Write-Host "`nDRY RUN - all anchors matched. Re-run with -Apply." -ForegroundColor Yellow; exit 0 }

foreach ($e in $edits) {
  $find = $e[1]; $repl = $e[2]
  if ($crlf) { $find = $find -replace "(?<!`r)`n", "`r`n"; $repl = $repl -replace "(?<!`r)`n", "`r`n" }
  $t = $t.Replace($find, $repl)
}
[System.IO.File]::WriteAllText($f, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "`nWROTE $f" -ForegroundColor Green

Write-Host "`nVERIFY (each must be > 0)" -ForegroundColor Cyan
@(
  '  - planned-change'
  'Changes go through the loop, not around it'
  'glossary="planned-change"'
  'does not appear in the standard'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -SimpleMatch -Pattern $_).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}

Write-Host "`nSECTION MARKERS (concept count should now be 4)" -ForegroundColor Cyan
Select-String -LiteralPath $f -Pattern '^::concept' | ForEach-Object { Write-Host ("  {0,4}  {1}" -f $_.LineNumber, $_.Line) }

Write-Host "`n=== STEP 1: insert the concept row (run in the SQL editor) ===" -ForegroundColor Yellow
Write-Host @"

insert into public.concepts (id, certification_id, slug, name, description)
values (gen_random_uuid(), '0bb3878a-fb89-455d-a84c-bdb9a26b1643', 'planned-change',
        'planned change',
        'the requirement that a determined change to the ISMS be carried out in a planned manner')
on conflict (certification_id, slug) do nothing;

insert into public.task_concepts (task_id, concept_id)
select t.id, c.id
from public.tasks t, public.concepts c
where t.certification_id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643' and t.code = '2.9'
  and c.certification_id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643' and c.slug = 'planned-change'
on conflict do nothing;

-- expect 192 concepts, 195 links
select (select count(*) from public.concepts where certification_id='0bb3878a-fb89-455d-a84c-bdb9a26b1643') as concepts,
       (select count(*) from public.task_concepts tc join public.tasks t on t.id=tc.task_id
         where t.certification_id='0bb3878a-fb89-455d-a84c-bdb9a26b1643') as task_links;
"@ -ForegroundColor Gray
