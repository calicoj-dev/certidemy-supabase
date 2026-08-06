#requires -Version 5.1
<#
  patch-markdown-nested-inline.ps1

  Makes bold and italic re-tokenize their contents, so inline directives nested
  inside them render instead of printing literally.

  THE BUG
  -------
  The inline tokenizer's bold branch pushes a FLAT STRING:

      tokens.push({ kind: "bold", text: rest.slice(2, end) });

  and the renderer prints that string verbatim. Anything inside ** ** is
  therefore never tokenized. Live symptom on ISMS-F lesson 03-01:

      **[Identification]{glossary="risk-identification"}** - finding, ...

  renders the directive as raw text, while the same directive unbolded a
  paragraph earlier renders correctly as a glossary term.

  SCOPE. 70 English occurrences across four certs - isms-f 50, aihr-i 12,
  sd-ai-i 5, spo-i 3 - plus their es-419 / pt-BR translations, so ~210 content
  rows in total. Four separate authoring sessions produced the pattern
  independently and LESSON_AUTHORING_SPEC does not forbid it, which is the case
  for fixing the renderer rather than the content.

  THE FIX
  -------
  bold and italic carry `children: InlineToken[]` instead of `text: string`,
  produced by calling the tokenizer on the inner slice, and the render switch
  maps over children recursively.

  RECURSION IS BOUNDED. indexOf finds the FIRST closing delimiter, so the inner
  slice can never contain another ** (or *). Depth is effectively 2.

  This also fixes, for free: links, inline code, and citations nested in bold.

  DRY RUN BY DEFAULT. -Apply to write.
#>

param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$f = "C:\Users\Juan\Documents\certidemy\certidemy-web\components\lessons\markdown.tsx"
if (-not (Test-Path -LiteralPath $f)) { throw "NOT FOUND: $f" }

$t    = [System.IO.File]::ReadAllText($f)
$crlf = $t.Contains("`r`n")

$edits = @()

# --- 1. the token type union ------------------------------------------------
$edits += ,@(
  'A  token type union',
@'
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
'@,
@'
  | { kind: "bold"; children: InlineToken[] }
  | { kind: "italic"; children: InlineToken[] }
'@)

# --- 2. tokenizer: bold -----------------------------------------------------
$edits += ,@(
  'B  tokenizer bold',
  '        tokens.push({ kind: "bold", text: rest.slice(2, end) });',
  '        tokens.push({ kind: "bold", children: tokenizeInline(rest.slice(2, end)) });')

# --- 3. tokenizer: italic ---------------------------------------------------
$edits += ,@(
  'C  tokenizer italic',
  '        tokens.push({ kind: "italic", text: rest.slice(1, end) });',
  '        tokens.push({ kind: "italic", children: tokenizeInline(rest.slice(1, end)) });')

# --- 4. render: bold and italic --------------------------------------------
$edits += ,@(
  'D  render bold + italic',
@'
    case "bold":
      return <strong className="font-semibold text-[var(--color-ink)]">{token.text}</strong>;
    case "italic":
      return <em>{token.text}</em>;
'@,
@'
    case "bold":
      return (
        <strong className="font-semibold text-[var(--color-ink)]">
          {token.children.map((c, i) => (
            <InlineToken key={i} token={c} onCitation={onCitation} />
          ))}
        </strong>
      );
    case "italic":
      return (
        <em>
          {token.children.map((c, i) => (
            <InlineToken key={i} token={c} onCitation={onCitation} />
          ))}
        </em>
      );
'@)

Write-Host "ANCHOR CHECK" -ForegroundColor Cyan
$fail = $false
foreach ($e in $edits) {
  $find = $e[1]
  if ($crlf) { $find = $find -replace "(?<!`r)`n", "`r`n" }
  $n = 0; $i = 0
  while (($i = $t.IndexOf($find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $find.Length }
  if ($n -eq 1) { Write-Host ("  OK   {0}" -f $e[0]) -ForegroundColor Green }
  else { Write-Host ("  FAIL ({0})  {1}" -f $n, $e[0]) -ForegroundColor Red; $fail = $true }
}

Write-Host "`nOTHER CONSTRUCTION SITES (must be none)" -ForegroundColor Cyan
$other = @(Select-String -LiteralPath $f -Pattern 'kind:\s*"(bold|italic)"' |
           Where-Object { $_.Line -notmatch 'children:' -and $_.Line -notmatch '\| \{ kind' })
if ($other.Count -eq 0) { Write-Host "  none - bold/italic are constructed only in the two branches above" -ForegroundColor Green }
else { $other | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.LineNumber, $_.Line.Trim()) -ForegroundColor Yellow } }

if ($fail) { Write-Host "`nABORTED. Nothing written." -ForegroundColor Red; exit 1 }
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
  'kind: "bold"; children: InlineToken[]'
  'children: tokenizeInline(rest.slice(2, end))'
  'children: tokenizeInline(rest.slice(1, end))'
  'token.children.map'
) | ForEach-Object {
  $c = @(Select-String -LiteralPath $f -SimpleMatch -Pattern $_).Count
  Write-Host ("  {0,-3} {1}" -f $c, $_) -ForegroundColor $(if ($c -gt 0) { 'Green' } else { 'Red' })
}

Write-Host "`nRESIDUAL - token.text on bold/italic (expect none)" -ForegroundColor Cyan
$r = @(Select-String -LiteralPath $f -Pattern 'kind: "(bold|italic)"; text:')
if ($r.Count -eq 0) { Write-Host "  clean" -ForegroundColor Green } else { $r | ForEach-Object { Write-Host ("  {0}" -f $_.Line) -ForegroundColor Red } }

Write-Host "`nNEXT: npm run build, then check ISMS-F lesson 03-01 in the browser." -ForegroundColor Yellow
