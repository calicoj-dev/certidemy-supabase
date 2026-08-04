#requires -Version 5.1
<#
  apply-doc-patches-2026-08-04.ps1

  Applies three documentation patches:
    A - CLAIMS-POLICY.md   : pin the ISO/IEC 17024 claim to the 2026 edition (4 edits)
    B - CERT-SCHEMA-GUIDE.md: retire the repeating-digit UUID convention (S7)
    C - CERT-SCHEMA-GUIDE.md: correct S2 from live schema, plus S0a / S6 / S8

  DRY RUN BY DEFAULT. Nothing is written unless -Apply is passed.

  Design notes:
   * This file is PURE ASCII on purpose. PowerShell 5.1 decodes a .ps1 without a
     BOM as ANSI, which mangles literal em-dashes / section-signs / n-tilde.
     Every non-ASCII character in an anchor or replacement is built with [char].
   * Line endings are detected per file and anchors are converted to match, so a
     CRLF file and an LF file both work and neither is rewritten wholesale.
   * Reads use [System.IO.File]::ReadAllText - never Get-Content | Select-String,
     which silently drops blank lines.
   * Writes are BOM-free UTF8 via [System.IO.File]::WriteAllText.
   * EVERY anchor must match EXACTLY ONCE or the script refuses to write anything.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Juan\Documents\certidemy\supabase'

# --- non-ASCII characters, built safely for PS 5.1 -------------------------
$EM  = [char]0x2014   # em dash
$SEC = [char]0x00A7   # section sign
$NT  = [char]0x00F1   # n with tilde
$UA  = [char]0x00FA   # u with acute

# --- locate the two documents ---------------------------------------------
function Find-Doc([string]$name) {
  $hits = @(Get-ChildItem -LiteralPath $repo -Filter $name -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch '\\node_modules\\' })
  if ($hits.Count -eq 0) { throw "NOT FOUND: $name under $repo" }
  if ($hits.Count -gt 1) {
    Write-Host "AMBIGUOUS: $name found in $($hits.Count) places:" -ForegroundColor Red
    $hits | ForEach-Object { Write-Host "   $($_.FullName)" }
    throw "Resolve the duplicate before patching."
  }
  return $hits[0].FullName
}

$claims = Find-Doc 'CLAIMS-POLICY.md'
$guide  = Find-Doc 'CERT-SCHEMA-GUIDE.md'
Write-Host "CLAIMS-POLICY.md   -> $claims"
Write-Host "CERT-SCHEMA-GUIDE  -> $guide"
Write-Host ""

# --- edit engine -----------------------------------------------------------
$script:edits = @()
function Add-Edit($file, $id, $find, $replace, [switch]$Regex) {
  $script:edits += [PSCustomObject]@{
    File = $file; Id = $id; Find = $find; Replace = $replace; IsRegex = [bool]$Regex
  }
}

# ==========================================================================
# PATCH A - CLAIMS-POLICY.md
# ==========================================================================

# A1 - S3 Class A table row
Add-Edit $claims 'A1' `
  "| Designed to the ISO/IEC 17024 framework for bodies certifying persons | **This exact formulation only** $EM see $($SEC)5 |" `
  "| Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons | **This exact formulation only** $EM see $($SEC)5. Edition pinned deliberately; see $($SEC)4 note |"

# A2 - S4 approved texts, three languages + edition note
$a2find = @(
  "| **en** | Designed to the ISO/IEC 17024 framework for bodies certifying persons. |"
  "| **es** | Dise$($NT)ada conforme al marco ISO/IEC 17024 para organismos que certifican personas. |"
  "| **pt** | Projetada conforme a estrutura ISO/IEC 17024 para organismos que certificam pessoas. |"
) -join "`n"
$a2repl = @(
  "| **en** | Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons. |"
  "| **es** | Dise$($NT)ada conforme al marco ISO/IEC 17024:2026 para organismos que certifican personas. |"
  "| **pt** | Projetada conforme a estrutura ISO/IEC 17024:2026 para organismos que certificam pessoas. |"
  ""
  "**Edition note.** ISO/IEC 17024:2026 replaced the 2012 edition in March 2026."
  "The edition is named because two are in circulation and the referent would"
  "otherwise be ambiguous. The claim is unchanged in kind: *designed to*, never"
  "*accredited to*. Re-check on the next revision."
) -join "`n"
Add-Edit $claims 'A2' $a2find $a2repl

# A3 - S5 forbidden formulations substitute
Add-Edit $claims 'A3' `
  "| Accredited to ISO/IEC 17024 $([char]0x00B7) Acreditada seg$($UA)n ISO 17024 $([char]0x00B7) Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024 framework ($($SEC)4) |" `
  "| Accredited to ISO/IEC 17024 $([char]0x00B7) Acreditada seg$($UA)n ISO 17024 $([char]0x00B7) Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024:2026 framework ($($SEC)4) |"

# A4 - new Class C entry (clause 6.5 conformance is unearned)
$a4find = "- Salary, hiring or labour-market outcomes"
$a4repl = @(
  "- Salary, hiring or labour-market outcomes"
  "- Conforms to / complies with ISO/IEC 17024:2026 clause 6.5, or any claim that"
  "  our use of AI in the certification process has been assessed. Clause 6.5"
  "  governs AI use in the certification process; conformance is assessed by an"
  "  accreditation body, not asserted. *Designed to* remains available. A claim"
  "  about our AI governance in certification is separately unearned until the"
  "  documented AI-in-certification policy and candidate-facing disclosure both"
  "  exist."
) -join "`n"
Add-Edit $claims 'A4' $a4find $a4repl

# ==========================================================================
# PATCH B - CERT-SCHEMA-GUIDE.md S7 (UUID convention)
# ==========================================================================
$b1repl = @'
## 7. UUID convention - RETIRED, generate instead

**The repeating-digit convention is retired as of cert #8 (`ISMS-F`).** It ran out
of readable slots and it was never load-bearing: the UUID is an opaque internal
identifier and nothing in the platform reads meaning from it.

**New certs:** generate a UUID at authoring time, hardcode it into the seed
migration as a literal, and record it in the migration header comment. The
migration stays idempotent (`on conflict (id) do update`) exactly as before - the
id is fixed in the file, it is simply no longer patterned.

```sql
-- at authoring time, once:
select gen_random_uuid();
-- paste the result into the migration as a literal. Do NOT call
-- gen_random_uuid() inside the migration itself: the migration must be
-- idempotent and a fresh uuid on re-run would duplicate the cert.
```

**Module ids** no longer mirror a cert digit. Generate five and hardcode them the
same way, keeping `order_index` 1..N aligned to the domains. The module id pattern
was cosmetic; `order_index` is what carries the domain alignment.

**Existing certs keep their repeating digits.** They are opaque identifiers;
renaming would touch every migration, script and content folder for no gain.

| Cert | UUID |
|---|---|
| SM-AI-I | `11111111-...` |
| GAIPC stub | `22222222-...` (CertiProf-era; not ours) |
| SPO-AI-I | `33333333-...` |
| SD-AI-I | `44444444-...` |
| AIGRM-I | `55555555-...` |
| AISM-I | `66666666-...` |
| AIHR-I | `77777777-...` |
| **ISMS-F and later** | **generated - read the migration header** |

**The old trap is closed.** HANDOFF v2.1's rule - *never infer a new
certification's UUID from how many certs exist* - no longer has anything to infer
from. The free-slot query in migration 105 is vestigial for new certs.

'@
Add-Edit $guide 'B1' '(?s)^## 7\. UUID convention \(repeating-digit\).*?(?=^## 8\.)' $b1repl -Regex

# ==========================================================================
# PATCH C - CERT-SCHEMA-GUIDE.md S2 / S0a / S6 / S8
# ==========================================================================
$c1repl = @'
## 2. `certifications` - the cert row

**Verified against `information_schema` on 4 August 2026** and confirmed by
`171_seed_isms_f.sql` running clean. Re-verify per S0a before the next build.

```
certifications (
  id                     uuid        NOT NULL  default uuid_generate_v4()
  code                   text        NOT NULL  -- OUR code, e.g. 'ISMS-F' (never a third party's)
  name                   text        NOT NULL
  provider               text        NOT NULL  default 'Certidemy'
  description            text        NULL      -- dollar-quoted prose
  price_usd              numeric     NOT NULL  default 0
  exam_link              text        NULL
  exam_duration_minutes  integer     NULL
  passing_score_pct      numeric     NULL      default 70.00   -- SET EXPLICITLY, see below
  num_questions          integer     NULL
  difficulty_level       smallint    NULL      -- 1 for I-tier
  created_at             timestamptz NOT NULL  default now()
  updated_at             timestamptz NOT NULL  default now()
  category_slug          text        NULL      -- FK -> cert_categories.slug; REQUIRED for catalog
  tier                   smallint    NOT NULL  default 1
  sort_order             smallint    NOT NULL  default 0       -- position WITHIN the family
  status                 text        NOT NULL  default 'draft' -- lifecycle, see S3
  exam_blueprint         jsonb       NULL
  max_exam_attempts      integer     NOT NULL  default 6
  attempt_window_months  integer     NOT NULL  default 12
  validity_days          integer     NOT NULL  default 365
)
```

**`is_published` no longer exists.** 069 introduced `status`; 069-part-2 dropped
the boolean. `status` is the sole source of truth. Any migration or script still
writing `is_published` fails on paste - which is how this section was found stale.

**`passing_score_pct` defaults to 70.00, not 80.00.** Every I-tier cert is 80.
Omitting the column silently seeds a cert that passes at 70, with no error and
nothing downstream to catch it. **Always write it.**

**`sort_order` is position within the family**, distinct from
`cert_categories.sort_order`, which orders the families themselves. First cert in
a new family = 1.

**`tier` and `difficulty_level` are distinct.** Both are 1 for an I-tier cert.

**`validity_days` is 365 platform-wide** and matches the scheme decision that
credential validity tracks the content re-review cadence. Write it explicitly so a
future change to the column default cannot silently move a locked scheme term.

Safe to omit at scaffold (defaults are correct): `price_usd`, `exam_link`,
`exam_blueprint`, `max_exam_attempts`, `attempt_window_months`, `created_at`,
`updated_at`.

Upsert by fixed `id` with `on conflict (id) do update set ... updated_at = now()`.

**Reference implementation: migration 171** (`ISMS-F`). It is the current best
template for a cert row - 084 predates the `is_published` drop.

'@
Add-Edit $guide 'C1' '(?s)^## 2\. `certifications`.*?(?=^## 3\.)' $c1repl -Regex

# C0 - standing verification instruction, inserted before S1
$c0repl = @'
## 0a. Verify before you write - every time

**This guide is a reference, not an oracle. Confirm it against the live schema at
the start of every cert build, before writing a line of SQL.** It has been stale
twice: `certifications.is_published` (dropped by 069-part-2, documented as
present) and the repeating-digit UUID convention (exhausted, documented as
current). Both were copied into a migration that failed on paste.

```sql
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('certifications','domains','concepts','tasks','modules')
order by table_name, ordinal_position;
```

A gap in `ordinal_position` means a dropped column - that is the signature of a
guide section that has gone stale.

Also confirm the family slot before founding a family, because `sort_order` is
claimed by existing rows:

```sql
select slug, label, sort_order from public.cert_categories order by sort_order;
```

---

## 1. `cert_categories`
'@
Add-Edit $guide 'C0' '(?m)^## 1\. `cert_categories`.*$' $c0repl -Regex

# C2 - S6 modules id bullet
$c2find = @'
- **id** deterministic: `aNNNNNNN-0000-0000-0000-00000000000K` where `NNNNNNN`
  mirrors the cert's repeating digit and `K` is the module number
'@
$c2repl = @'
- **id** - generate five UUIDs at authoring time and hardcode them as literals so
  `on conflict (id) do update` still works. The old pattern below is RETIRED with
  the repeating-digit convention (S7); it was cosmetic, and `order_index` is what
  carries domain alignment. Never call `gen_random_uuid()` inside the migration -
  a fresh uuid on re-run breaks idempotency and duplicates the modules.
  *(Retired pattern, for reading old migrations only:* `aNNNNNNN-0000-0000-0000-00000000000K`
  where `NNNNNNN` mirrors the cert's repeating digit and `K` is the module number
'@
Add-Edit $guide 'C2' $c2find $c2repl

# C3 - S8 paste-safety, append proof step
$c3find = '## 8. Paste-safety (large scaffold migrations)'
$c3repl = @'
## 8. Paste-safety (large scaffold migrations)

**Prove it rather than trust it.** A generated migration is checked for non-ASCII
BEFORE it is pasted, not after it corrupts a row:

```powershell
Select-String -LiteralPath <migration.sql> -Pattern '[^\x00-\x7F]'   # expect no output
```

Migrations generated by parsing a locked JTA inherit whatever the JTA contains -
em-dashes, curly quotes and ellipses are normal in a markdown document and fatal
in a large SQL paste. Sanitize at generation time, then prove it.
'@
Add-Edit $guide 'C3' $c3find $c3repl

# ==========================================================================
# PASS 1 - match every anchor before writing anything
# ==========================================================================
$files = $script:edits | Select-Object -ExpandProperty File -Unique
$state = @{}
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f)
  $state[$f] = @{ Text = $t; Crlf = $t.Contains("`r`n") }
}

$fail = $false
Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
foreach ($e in $script:edits) {
  $t    = $state[$e.File].Text
  $crlf = $state[$e.File].Crlf
  $find = if ($crlf -and -not $e.IsRegex) { $e.Find -replace "(?<!`r)`n", "`r`n" } else { $e.Find }

  if ($e.IsRegex) {
    $n = ([regex]::Matches($t, $find, 'Multiline')).Count
  } else {
    $n = 0; $i = 0
    while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  }

  $name = [System.IO.Path]::GetFileName($e.File)
  if ($n -eq 1) {
    Write-Host ("  {0,-3} {1,-24} OK   (1 match)" -f $e.Id, $name) -ForegroundColor Green
  } else {
    Write-Host ("  {0,-3} {1,-24} FAIL ({2} matches - need exactly 1)" -f $e.Id, $name, $n) -ForegroundColor Red
    $fail = $true
  }
}

if ($fail) {
  Write-Host "`nABORTED. No file written. Fix the failing anchor(s) first." -ForegroundColor Red
  exit 1
}

if (-not $Apply) {
  Write-Host "`nDRY RUN - all anchors matched. Re-run with -Apply to write." -ForegroundColor Yellow
  exit 0
}

# ==========================================================================
# PASS 2 - apply
# ==========================================================================
foreach ($e in $script:edits) {
  $crlf = $state[$e.File].Crlf
  $find = if ($crlf -and -not $e.IsRegex) { $e.Find    -replace "(?<!`r)`n", "`r`n" } else { $e.Find }
  $repl = if ($crlf)                      { $e.Replace -replace "(?<!`r)`n", "`r`n" } else { $e.Replace }

  if ($e.IsRegex) {
    $state[$e.File].Text = [regex]::Replace($state[$e.File].Text, $find, { $repl }, 'Multiline')
  } else {
    $state[$e.File].Text = $state[$e.File].Text.Replace($find, $repl)
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($f in $files) {
  [System.IO.File]::WriteAllText($f, $state[$f].Text, $utf8NoBom)
  Write-Host "WROTE $f" -ForegroundColor Green
}

# ==========================================================================
# PASS 3 - verify by token, never by scrollback
# ==========================================================================
Write-Host "`nTOKEN VERIFY (each must be > 0)" -ForegroundColor Cyan
$tokens = @(
  @{ F = $claims; T = '17024:2026 framework for bodies certifying persons' }
  @{ F = $claims; T = 'Edition note' }
  @{ F = $claims; T = 'clause 6.5' }
  @{ F = $guide;  T = 'RETIRED, generate instead' }
  @{ F = $guide;  T = 'is_published` no longer exists' }
  @{ F = $guide;  T = 'passing_score_pct` defaults to 70.00' }
  @{ F = $guide;  T = '0a. Verify before you write' }
  @{ F = $guide;  T = 'Prove it rather than trust it' }
)
foreach ($x in $tokens) {
  $c = @(Select-String -LiteralPath $x.F -Pattern ([regex]::Escape($x.T))).Count
  $col = if ($c -gt 0) { 'Green' } else { 'Red' }
  Write-Host ("  {0,-3} {1}" -f $c, $x.T) -ForegroundColor $col
}

Write-Host "`nSWEEP - every remaining bare 17024 (expect only :2026 forms and prose)" -ForegroundColor Cyan
Select-String -LiteralPath $claims, $guide -Pattern '17024' |
  Select-Object LineNumber, @{n='File';e={[System.IO.Path]::GetFileName($_.Path)}}, Line |
  Format-Table -AutoSize -Wrap
