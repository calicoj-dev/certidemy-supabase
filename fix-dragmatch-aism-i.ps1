# =============================================================================
# fix-dragmatch-aism-i.ps1
#
# Rewrites the 9 AISM-I drag-match widgets that verify-cert.mjs flagged as
# many-to-few (4 items -> 2 or 3 targets = coin-flip sorting, not assessment)
# into STRICT 1:1 (4 items -> 4 distinct targets, each used exactly once).
#
# The other 9 drag-match widgets in the cert are already 1:1 and are NOT touched.
#
# Every replacement keeps the widget's original teaching point and splits the
# collapsed binary into its real sub-distinctions, so the item gets HARDER and
# more informative rather than merely longer.
#
# SAFETY
#   - Dry run by default. Pass -Live to actually write.
#   - Matches each widget by its unique id="..."; refuses to write unless
#     EXACTLY ONE match is found in the file.
#   - Reads/writes with explicit UTF-8 (no BOM) via .NET, so existing
#     multibyte characters elsewhere in the file are preserved byte-for-byte.
#     (PowerShell's console rendering of em-dashes as 'a-tilde-euro' is a
#     DISPLAY artifact only - verify-cert confirmed 0 mojibake in the DB.)
#   - All new content is ASCII-only.
#
# USAGE
#   cd C:\Users\Juan\Documents\certidemy\supabase
#   powershell -ExecutionPolicy Bypass -File .\fix-dragmatch-aism-i.ps1
#   powershell -ExecutionPolicy Bypass -File .\fix-dragmatch-aism-i.ps1 -Live
# =============================================================================

param(
  [switch]$Live,
  [string]$Root = "C:\Users\Juan\Documents\certidemy\certidemy-web\content\aism-i"
)

$ErrorActionPreference = "Stop"

$patches = @()

# --- 1 -----------------------------------------------------------------------
$patches += @{
  File = "01-foundations-of-service-management\01-06-outputs-outcomes-cost-risk.md"
  Id   = "output-or-outcome"
  Block = @'
::interactive widget="drag-match" id="output-or-outcome" concept_slugs="output-vs-outcome,ai-output-volume-trap,cost-and-risk,value-equation"
{
  "items": [
    { "id": "a", "text": "The AI support assistant handled 1,000 conversations this week" },
    { "id": "b", "text": "Customers who used the assistant resolved their issue without needing a human" },
    { "id": "c", "text": "Using the managed database means no longer buying servers or patching them" },
    { "id": "d", "text": "The monthly fee, plus a hard dependency on that one provider" }
  ],
  "targets": [
    { "id": "output", "text": "Output (a deliverable the service produced)" },
    { "id": "outcome", "text": "Outcome (the result the consumer needed)" },
    { "id": "removes", "text": "Cost or risk the service REMOVES (value delivered)" },
    { "id": "imposes", "text": "Cost or risk the service IMPOSES (value taken away)" }
  ],
  "correct": { "a": "output", "b": "outcome", "c": "removes", "d": "imposes" },
  "explanation": "A conversation count is an output, and a classic AI output-volume trap; whether the issue was resolved is the outcome. The other half of the value equation is cost and risk: the managed database removes purchase and patching burden, while the fee and provider dependency are imposed. Value is what remains once you weigh all four."
}
::
'@
}

# --- 2 -----------------------------------------------------------------------
$patches += @{
  File = "02-value-system-and-governance\02-07-governance-vs-management.md"
  Id   = "governance-or-management"
  Block = @'
::interactive widget="drag-match" id="governance-or-management" concept_slugs="governance-vs-management,governing-body,delegated-authority"
{
  "items": [
    { "id": "a", "text": "Setting the organization's objectives, policies, and risk boundaries for the year" },
    { "id": "b", "text": "Judging whether those objectives were met, and answering for the result" },
    { "id": "c", "text": "Planning the week's work and assigning it across the team" },
    { "id": "d", "text": "Running daily operations under authority that was granted from above" }
  ],
  "targets": [
    { "id": "direct", "text": "Governance: setting direction" },
    { "id": "accountable", "text": "Governance: holding accountable" },
    { "id": "organize", "text": "Management: planning and organizing the work" },
    { "id": "operate", "text": "Management: operating under delegated authority" }
  ],
  "correct": { "a": "direct", "b": "accountable", "c": "organize", "d": "operate" },
  "explanation": "Governance has two halves: it sets the direction AND holds the organization accountable for reaching it. Management also has two: it plans and organizes the work, and it runs it day to day under authority the governing body delegated. Authority flows down; accountability stays anchored at the top."
}
::
'@
}

# --- 3 -----------------------------------------------------------------------
$patches += @{
  File = "03-lifecycle-and-practices\03-03-management-practices.md"
  Id   = "general-or-service-practice"
  Block = @'
::interactive widget="drag-match" id="general-or-service-practice" concept_slugs="general-vs-service-practices,practice-types,management-practice"
{
  "items": [
    { "id": "a", "text": "Restoring normal service as quickly as possible after an unplanned disruption" },
    { "id": "b", "text": "Assessing and authorizing service changes so they proceed at acceptable risk" },
    { "id": "c", "text": "Identifying, assessing, and treating risk across the whole organization" },
    { "id": "d", "text": "Coordinating the third parties the organization depends on to deliver" }
  ],
  "targets": [
    { "id": "incident", "text": "Incident management (service practice)" },
    { "id": "change", "text": "Change enablement (service practice)" },
    { "id": "risk", "text": "Risk management (general practice)" },
    { "id": "supplier", "text": "Supplier management (general practice)" }
  ],
  "correct": { "a": "incident", "b": "change", "c": "risk", "d": "supplier" },
  "explanation": "Each description names one practice. Incident management and change enablement exist specifically to run services. Risk management and supplier management are broad organizational capabilities that any organization needs, service provider or not. Knowing which kind a gap falls into tells you where the fix belongs."
}
::
'@
}

# --- 4 -----------------------------------------------------------------------
$patches += @{
  File = "03-lifecycle-and-practices\03-08-service-request-and-desk.md"
  Id   = "request-or-incident"
  Block = @'
::interactive widget="drag-match" id="request-or-incident" concept_slugs="request-vs-incident,service-request-management,service-desk"
{
  "items": [
    { "id": "a", "text": "\"Please give me access to the finance shared drive.\"" },
    { "id": "b", "text": "\"The finance shared drive is down - I can't open anything.\"" },
    { "id": "c", "text": "The single point of contact where both of those arrive and get triaged" },
    { "id": "d", "text": "The known, repeatable path a standard request follows to fulfillment" }
  ],
  "targets": [
    { "id": "request", "text": "Service request (planned demand)" },
    { "id": "incident", "text": "Incident (unplanned disruption)" },
    { "id": "desk", "text": "The service desk (point of engagement)" },
    { "id": "fulfillment", "text": "Request fulfillment procedure" }
  ],
  "correct": { "a": "request", "b": "incident", "c": "desk", "d": "fulfillment" },
  "explanation": "Asking for access is planned demand the service is designed to provide - a request. The drive being down is an unplanned disruption - an incident. Both arrive at the service desk, the single point of engagement that triages them. Requests then follow a predefined fulfillment path; incidents follow restoration. Same desk, opposite work."
}
::
'@
}

# --- 5 -----------------------------------------------------------------------
$patches += @{
  File = "04-ai-augmented-operations\04-04-predictive-proactive.md"
  Id   = "leading-or-lagging"
  Block = @'
::interactive widget="drag-match" id="leading-or-lagging" concept_slugs="leading-indicators,proactive-vs-reactive,failure-prediction,predictive-service-management"
{
  "items": [
    { "id": "a", "text": "Disk usage has climbed 2% per day for a week and will hit 100% on Friday" },
    { "id": "b", "text": "The number of outages the service had last quarter" },
    { "id": "c", "text": "Expanding the disk on Wednesday because the trend says Friday fails" },
    { "id": "d", "text": "Restoring the service on Friday afternoon after it went down" }
  ],
  "targets": [
    { "id": "leading", "text": "Leading indicator (moves before the failure)" },
    { "id": "lagging", "text": "Lagging indicator (records what already happened)" },
    { "id": "proactive", "text": "Proactive action (prevents the failure)" },
    { "id": "reactive", "text": "Reactive action (responds after it)" }
  ],
  "correct": { "a": "leading", "b": "lagging", "c": "proactive", "d": "reactive" },
  "explanation": "A steady disk trend moves before the failure - a leading indicator, which is what makes prediction possible. An outage count only records failures already suffered. Acting on the leading indicator on Wednesday is proactive; restoring after Friday's outage is reactive. Prediction is only useful if a proactive action follows it."
}
::
'@
}

# --- 6 -----------------------------------------------------------------------
$patches += @{
  File = "04-ai-augmented-operations\04-07-virtual-agents.md"
  Id   = "resolve-or-hand-off"
  Block = @'
::interactive widget="drag-match" id="resolve-or-hand-off" concept_slugs="virtual-agent-limits,deflection-rate,virtual-agent,conversational-ai-service-desk"
{
  "items": [
    { "id": "a", "text": "\"What are your support hours?\" - common, unambiguous, no action taken" },
    { "id": "b", "text": "\"Reset my password\" - routine, well-defined, safely reversible" },
    { "id": "c", "text": "\"Cancel my enterprise contract and waive the penalty\" - large and hard to undo" },
    { "id": "d", "text": "A rambling complaint the agent has low confidence it understood correctly" }
  ],
  "targets": [
    { "id": "informational", "text": "Resolve: common informational answer" },
    { "id": "transactional", "text": "Resolve: routine, well-defined action" },
    { "id": "stakes", "text": "Hand off: stakes too high / hard to reverse" },
    { "id": "confidence", "text": "Hand off: confidence too low / request ambiguous" }
  ],
  "correct": { "a": "informational", "b": "transactional", "c": "stakes", "d": "confidence" },
  "explanation": "There are two distinct reasons to resolve and two distinct reasons to hand off. A virtual agent safely handles common informational questions and routine, reversible actions. It must hand off when the stakes are high or an action is hard to undo, and separately when its own confidence is low or the request is ambiguous. Chasing deflection rate past either boundary is the trap."
}
::
'@
}

# --- 7 -----------------------------------------------------------------------
$patches += @{
  File = "04-ai-augmented-operations\04-13-human-in-on-the-loop.md"
  Id   = "in-loop-or-on-loop"
  Block = @'
::interactive widget="drag-match" id="in-loop-or-on-loop" concept_slugs="human-in-the-loop,human-on-the-loop,oversight-in-service-actions"
{
  "items": [
    { "id": "a", "text": "An agent proposes deleting a production table and waits for a human to approve" },
    { "id": "b", "text": "An agent must get human approval before issuing any refund above a threshold" },
    { "id": "c", "text": "An agent auto-triages thousands of alerts while a human watches the overall pattern" },
    { "id": "d", "text": "An agent scales servers up and down on its own, with an engineer able to override" }
  ],
  "targets": [
    { "id": "irreversible", "text": "Human-in-the-loop: the action cannot be undone" },
    { "id": "threshold", "text": "Human-in-the-loop: above a value threshold" },
    { "id": "volume", "text": "Human-on-the-loop: volume too high to gate each one" },
    { "id": "reversible", "text": "Human-on-the-loop: routine and reversible" }
  ],
  "correct": { "a": "irreversible", "b": "threshold", "c": "volume", "d": "reversible" },
  "explanation": "In-the-loop is warranted for two different reasons: the action is irreversible, or it crosses a value threshold. On-the-loop fits for two others: the volume is too high for per-action approval, or the action is routine and reversible so an override is enough. Naming WHICH reason applies is what turns oversight from a slogan into a design decision."
}
::
'@
}

# --- 8 -----------------------------------------------------------------------
$patches += @{
  File = "05-governing-ai-in-service\05-04-transparency-disclosure.md"
  Id   = "disclosure-done-right"
  Block = @'
::interactive widget="drag-match" id="disclosure-done-right" concept_slugs="virtual-agent-disclosure,transparency-to-users,ai-interaction-disclosure"
{
  "items": [
    { "id": "a", "text": "A chat opens: \"Hi, I'm an automated assistant, and I can connect you to a person.\"" },
    { "id": "b", "text": "The assistant notes it can be wrong and shows how to reach a human agent" },
    { "id": "c", "text": "A bot uses a human name and deflects when a user asks whether it is a person" },
    { "id": "d", "text": "A service silently routes users to AI with no indication AI is involved at all" }
  ],
  "targets": [
    { "id": "identity", "text": "Sound: discloses that it IS AI" },
    { "id": "limits", "text": "Sound: discloses its LIMITS and the route to a human" },
    { "id": "evasive", "text": "Failure: actively conceals AI identity when asked" },
    { "id": "absent", "text": "Failure: no disclosure offered at all" }
  ],
  "correct": { "a": "identity", "b": "limits", "c": "evasive", "d": "absent" },
  "explanation": "Sound practice has two parts: disclosing that the user is dealing with AI, and disclosing what it cannot reliably do plus how to reach a person. Failure also has two shapes: actively denying it when asked, which is worse, and simply never disclosing. Both strip users of the context they need to calibrate trust."
}
::
'@
}

# --- 9 -----------------------------------------------------------------------
$patches += @{
  File = "05-governing-ai-in-service\05-07-what-to-monitor.md"
  Id   = "choose-the-signals"
  Block = @'
::interactive widget="drag-match" id="choose-the-signals" concept_slugs="what-to-monitor,drift-and-degradation-signals,harm-detection-signals,ai-service-monitoring"
{
  "items": [
    { "id": "a", "text": "The incoming data has moved away from what the model was built for" },
    { "id": "b", "text": "Sampled answer-accuracy trending down; the human-override rate rising" },
    { "id": "c", "text": "A spike in customer disputes, and a cluster of similarly-harmed users" },
    { "id": "d", "text": "Server CPU and uptime percentage" }
  ],
  "targets": [
    { "id": "drift", "text": "Drift signal (the input world moved)" },
    { "id": "degradation", "text": "Degradation signal (output quality is falling)" },
    { "id": "harm", "text": "Harm signal (users are being hurt)" },
    { "id": "availability", "text": "Availability signal (necessary, not sufficient)" }
  ],
  "correct": { "a": "drift", "b": "degradation", "c": "harm", "d": "availability" },
  "explanation": "Drift and degradation are not the same signal: drift is the input world moving away from what the model was built for, degradation is the output quality you can actually measure falling. Disputes and clusters of harmed users are harm signals. CPU and uptime are availability - necessary, but the least likely of the four to reveal an AI service's real failure. A governed AI service watches all four."
}
::
'@
}

# =============================================================================

Write-Host ""
Write-Host "Drag-match 1:1 repair - AISM-I" -ForegroundColor Cyan
Write-Host ("Mode: {0}" -f $(if ($Live) { "LIVE (will write)" } else { "DRY RUN (no writes)" })) -ForegroundColor $(if ($Live) { "Yellow" } else { "Green" })
Write-Host ("Root: {0}" -f $Root)
Write-Host ("Patches: {0}" -f $patches.Count)
Write-Host ("-" * 78)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$okCount = 0
$failCount = 0

foreach ($p in $patches) {
  $path = Join-Path $Root $p.File
  $name = Split-Path $path -Leaf

  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host ("  MISS  {0} - file not found" -f $name) -ForegroundColor Red
    $failCount++
    continue
  }

  $text = [System.IO.File]::ReadAllText($path)

  # Match the whole widget block: from its opening tag to the lone :: closer.
  $idEsc = [regex]::Escape($p.Id)
  $pattern = '(?s)::interactive widget="drag-match" id="' + $idEsc + '".*?\r?\n::\r?\n'
  $rx = [regex]::new($pattern)
  $matches = $rx.Matches($text)

  if ($matches.Count -ne 1) {
    Write-Host ("  SKIP  {0} - expected exactly 1 block id='{1}', found {2}" -f $name, $p.Id, $matches.Count) -ForegroundColor Red
    $failCount++
    continue
  }

  $old = $matches[0].Value
  $new = $p.Block
  if ($new -notmatch "\r?\n$") { $new = $new + "`r`n" }

  # Report the shape change
  $oldTargets = ([regex]::Matches($old, '"targets"\s*:\s*\[(?<t>.*?)\]', 'Singleline'))
  $oldTargetCount = 0
  if ($oldTargets.Count -eq 1) {
    $oldTargetCount = ([regex]::Matches($oldTargets[0].Groups['t'].Value, '\{\s*"id"')).Count
  }
  $newTargets = ([regex]::Matches($new, '"targets"\s*:\s*\[(?<t>.*?)\]', 'Singleline'))
  $newTargetCount = 0
  if ($newTargets.Count -eq 1) {
    $newTargetCount = ([regex]::Matches($newTargets[0].Groups['t'].Value, '\{\s*"id"')).Count
  }

  Write-Host ("  OK    {0}" -f $name) -ForegroundColor Green
  Write-Host ("          id='{0}'  targets {1} -> {2}  (4 items, strict 1:1)" -f $p.Id, $oldTargetCount, $newTargetCount)

  if ($Live) {
    $updated = $text.Remove($matches[0].Index, $matches[0].Length).Insert($matches[0].Index, $new)
    [System.IO.File]::WriteAllText($path, $updated, $utf8NoBom)
    Write-Host ("          written") -ForegroundColor Yellow
  }
  $okCount++
}

Write-Host ("-" * 78)
Write-Host ("{0} patched, {1} failed" -f $okCount, $failCount) -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
if (-not $Live) {
  Write-Host ""
  Write-Host "DRY RUN - nothing was written. Re-run with -Live to apply." -ForegroundColor Green
}
Write-Host ""
