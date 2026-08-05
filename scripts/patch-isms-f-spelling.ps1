#requires -Version 5.1
<#
  patch-isms-f-spelling.ps1

  Converts ISMS-F's 49 lesson files from British to American spelling.

  WHY
  ---
  STYLE-GUIDE-ISMS-F S6 set British spelling on the reasoning that ISO's own
  English is British. That ignored the seven certs already shipped. A count of
  en-language items across the catalog settled it:

      AIE-I 0/19, AIGRM-I 0/110, AIHR-I 5/25, AISM-I 7/80,
      SD-AI-I 0/15, SM-AI-I 1/45, SPO-AI-I 1/54     (british/american)

  348 American to 14 British, and the British hits are incidental rather than a
  convention. ISMS-F is the outlier. Consistency across the catalog beats
  matching a source document's house style in one cert - a candidate moving
  between Certidemy certs would notice a dialect switch long before they would
  notice we matched ISO.

  It is also the cheaper direction: 49 lesson files against 5,548 existing items.

  WHY AN ARRAY AND NOT A HASHTABLE
  --------------------------------
  PowerShell hashtable keys are CASE-INSENSITIVE, so 'Organisation' and
  'organisation' collide and the literal fails to parse. .NET String.Replace is
  case-SENSITIVE, which is what we want - so the pairs live in an ordered array
  and both cases are listed explicitly.

  ORDER MATTERS: longest first, so a longer form is replaced before a shorter
  one that is a prefix of it (unauthorised before authorise, reorganisation
  before organisation).

  WHAT IS DELIBERATELY NOT CONVERTED
  ----------------------------------
   * analysis, analyst, characteristic(s), specialist, installed, emphasis
     - identical in American English, or false matches on the stem.
   * bloom_level values (4_analyze) and concept_slugs - already American, and
     they are database keys. The guard below asserts none were touched.
   * Widget JSON keys and option ids - structural, never prose.

  ANALYSES was checked in context before being included. All three occurrences
  are verbs ("identifies risks, analyses them" in 02-07, "never re-analyses"
  twice in 03-07). Had any been a noun plural ("two analyses were performed")
  it would have had to stay, since that form is identical in American English.

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$content = "C:\Users\Juan\Documents\certidemy\certidemy-web\content\isms-f"
if (-not (Test-Path -LiteralPath $content)) { throw "NOT FOUND: $content" }

$MAP = @(
  # --- organisation family: 505 occurrences, the bulk of the work ---
  @('Reorganisation','Reorganization'), @('reorganisation','reorganization'),
  @('Reorganised','Reorganized'),       @('reorganised','reorganized'),
  @('Reorganising','Reorganizing'),     @('reorganising','reorganizing'),
  @('Organisational','Organizational'), @('organisational','organizational'),
  @('Organisations','Organizations'),   @('organisations','organizations'),
  @('Organisation','Organization'),     @('organisation','organization'),
  @('Organised','Organized'),           @('organised','organized'),
  @('Organise','Organize'),             @('organise','organize'),

  # --- recognise family ---
  @('Recognisable','Recognizable'),     @('recognisable','recognizable'),
  @('Recognising','Recognizing'),       @('recognising','recognizing'),
  @('Recognised','Recognized'),         @('recognised','recognized'),
  @('Recognises','Recognizes'),         @('recognises','recognizes'),
  @('Recognise','Recognize'),           @('recognise','recognize'),

  # --- authorise family: unauthorised first ---
  @('Unauthorised','Unauthorized'),     @('unauthorised','unauthorized'),
  @('Authorised','Authorized'),         @('authorised','authorized'),
  @('Authorise','Authorize'),           @('authorise','authorize'),

  # --- prioritise family: unprioritised first ---
  @('Unprioritised','Unprioritized'),   @('unprioritised','unprioritized'),
  @('Prioritisation','Prioritization'), @('prioritisation','prioritization'),
  @('Prioritised','Prioritized'),       @('prioritised','prioritized'),
  @('Prioritise','Prioritize'),         @('prioritise','prioritize'),

  # --- analyse family: NOT analysis / analyst. analyses IS included (verbs) ---
  @('Re-analyses','Re-analyzes'),       @('re-analyses','re-analyzes'),
  @('Analysing','Analyzing'),           @('analysing','analyzing'),
  @('Analysed','Analyzed'),             @('analysed','analyzed'),
  @('Analyses','Analyzes'),             @('analyses','analyzes'),
  @('Analyse','Analyze'),               @('analyse','analyze'),

  # --- characterise family: NOT characteristic(s) ---
  @('Characterisation','Characterization'), @('characterisation','characterization'),
  @('Characterised','Characterized'),   @('characterised','characterized'),
  @('Characterise','Characterize'),     @('characterise','characterize'),

  # --- summarise family ---
  @('Summarising','Summarizing'),       @('summarising','summarizing'),
  @('Summariser','Summarizer'),         @('summariser','summarizer'),
  @('Summarises','Summarizes'),         @('summarises','summarizes'),
  @('Summarise','Summarize'),           @('summarise','summarize'),

  # --- categorise family: miscategorised first ---
  @('Miscategorised','Miscategorized'), @('miscategorised','miscategorized'),
  @('Categorised','Categorized'),       @('categorised','categorized'),

  # --- -our / -re / -ce / -lled / -l ---
  @('Behavioural','Behavioral'),        @('behavioural','behavioral'),
  @('Behaviour','Behavior'),            @('behaviour','behavior'),
  @('Rigour','Rigor'),                  @('rigour','rigor'),
  @('Centre','Center'),                 @('centre','center'),
  @('Licence','License'),               @('licence','license'),
  @('Labelled','Labeled'),              @('labelled','labeled'),
  @('Fulfil','Fulfill'),                @('fulfil','fulfill'),

  # --- catalogue family ---
  @('Catalogues','Catalogs'),           @('catalogues','catalogs'),
  @('Catalogue','Catalog'),             @('catalogue','catalog')
)

$files = @(Get-ChildItem -Path "$content\*\*.md" | Sort-Object FullName)
Write-Host ("FILES: {0}" -f $files.Count) -ForegroundColor Cyan
if ($files.Count -ne 49) { Write-Host "  expected 49" -ForegroundColor Red; exit 1 }
Write-Host ("PAIRS: {0}" -f $MAP.Count) -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# PASS 1 - count, and capture the pre-state of things that must NOT change
# ---------------------------------------------------------------------------
$counts = New-Object 'int[]' $MAP.Count
$guardBefore = @{}
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f.FullName)
  for ($i = 0; $i -lt $MAP.Count; $i++) {
    $counts[$i] += ([regex]::Matches($t, [regex]::Escape($MAP[$i][0]))).Count
  }
  $guardBefore[$f.FullName] = @{
    bloom   = ([regex]::Matches($t, '"bloom_level":\s*"[1234]_\w+"')).Count
    analyze = ([regex]::Matches($t, '4_analyze')).Count
    slugs   = ([regex]::Matches($t, '(?m)^  - [a-z0-9-]+$')).Count
    ids     = ([regex]::Matches($t, '"id":\s*"[a-z0-9-]+"')).Count
  }
}

Write-Host "`nREPLACEMENTS" -ForegroundColor Cyan
$grand = 0
for ($i = 0; $i -lt $MAP.Count; $i++) {
  if ($counts[$i] -gt 0) {
    Write-Host ("  {0,-18} -> {1,-18} {2}" -f $MAP[$i][0], $MAP[$i][1], $counts[$i])
    $grand += $counts[$i]
  }
}
Write-Host ("  TOTAL: {0}" -f $grand) -ForegroundColor Cyan

if (-not $Apply) {
  Write-Host "`nDRY RUN - nothing written. Re-run with -Apply." -ForegroundColor Yellow
  exit 0
}

# ---------------------------------------------------------------------------
# PASS 2 - apply. String.Replace is case-sensitive, which is the point.
# ---------------------------------------------------------------------------
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f.FullName)
  foreach ($pair in $MAP) { $t = $t.Replace($pair[0], $pair[1]) }
  [System.IO.File]::WriteAllText($f.FullName, $t, $utf8NoBom)
}
Write-Host ("`nWROTE {0} files" -f $files.Count) -ForegroundColor Green

# ---------------------------------------------------------------------------
# PASS 3 - verify
# ---------------------------------------------------------------------------
Write-Host "`nGUARDS - structural content must be unchanged" -ForegroundColor Cyan
$bad = $false
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $b = $guardBefore[$f.FullName]
  $a = @{
    bloom   = ([regex]::Matches($t, '"bloom_level":\s*"[1234]_\w+"')).Count
    analyze = ([regex]::Matches($t, '4_analyze')).Count
    slugs   = ([regex]::Matches($t, '(?m)^  - [a-z0-9-]+$')).Count
    ids     = ([regex]::Matches($t, '"id":\s*"[a-z0-9-]+"')).Count
  }
  foreach ($k in $a.Keys) {
    if ($a[$k] -ne $b[$k]) {
      Write-Host ("  MISMATCH {0}: {1} was {2}, now {3}" -f $f.Name, $k, $b[$k], $a[$k]) -ForegroundColor Red
      $bad = $true
    }
  }
}
if (-not $bad) {
  Write-Host "  bloom levels, 4_analyze, concept slugs, option ids - all unchanged" -ForegroundColor Green
}

Write-Host "`nRESIDUAL - British forms remaining (expect none)" -ForegroundColor Cyan
$stems = @('organis','recognis','prioritis','authoris','analys','characteris','summaris',
           'categoris','behaviour','rigour','licence','centre','catalogue','labelled')
$allow = '^(analysis|analyst|analysts|characteristic|characteristics|specialist|specialists|installed|emphasis)$'
$left = @()
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f.FullName)
  foreach ($s in $stems) {
    foreach ($m in [regex]::Matches($t, "\w*$s\w*", 'IgnoreCase')) {
      if ($m.Value -notmatch $allow) { $left += $m.Value }
    }
  }
}
if ($left.Count -eq 0) {
  Write-Host "  clean - only American-identical forms remain" -ForegroundColor Green
} else {
  $left | Group-Object | Sort-Object Name | ForEach-Object {
    Write-Host ("  LEFT: {0,-24} x{1}" -f $_.Name, $_.Count) -ForegroundColor Red
  }
  $bad = $true
}

Write-Host "`nNEXT: re-run the module validators, push corrections with" -ForegroundColor Yellow
Write-Host "      update-lesson-content.mjs (NOT load-lessons-direct, which skips" -ForegroundColor Yellow
Write-Host "      existing rows), and amend STYLE-GUIDE-ISMS-F S6." -ForegroundColor Yellow
