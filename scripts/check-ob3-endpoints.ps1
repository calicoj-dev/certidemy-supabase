# check-ob3-endpoints.ps1
#
# Fetches the four Open Badges 3.0 identifier URLs AS A STRANGER: no session,
# no cookies, no Supabase key. That is what an external verifier, a wallet or an
# HR system is, and it is the only test that means anything here -- the badge
# panel passed its first check in a logged-in browser while /issuer was 401 to
# everyone else on earth.
#
# All four must return 200 with content-type application/vc+ld+json.
#
#   /issuer                  the issuer Profile + public key
#   /achievements/<CODE>     the Achievement definition
#   /credentials/<CODE>      the signed credential
#   /status/<N>              the Bitstring revocation list
#
# A 401 means the Supabase gateway refused before the function ran (verify_jwt).
# A 404 means the Next.js proxy route is missing or was locale-prefixed by
# middleware. A 200 of text/html means something served the app shell instead of
# the document.
#
# USAGE
#     .\check-ob3-endpoints.ps1
#     .\check-ob3-endpoints.ps1 -Code SM-AI-I-ZZMV-JPC8 -Cert SM-AI-I

param(
  [string]$Base = "https://certidemy.com",
  [string]$Code = "SM-AI-I-ZZMV-JPC8",
  [string]$Cert = "SM-AI-I",
  [int]$List    = 1
)

$targets = @(
  @{ name = "issuer";      url = "$Base/issuer" },
  @{ name = "achievement"; url = "$Base/achievements/$Cert" },
  @{ name = "credential";  url = "$Base/credentials/$Code" },
  @{ name = "status";      url = "$Base/status/$List" }
)

Write-Host ""
Write-Host "Anonymous fetch -- no session, no key." -ForegroundColor Cyan
Write-Host ""

$allOk = $true

foreach ($t in $targets) {
  $label = $t.name.PadRight(12)
  try {
    # -UseBasicParsing avoids the IE engine; -SessionVariable with no prior
    # session guarantees no cookies are carried from anywhere.
    $hdr = @{ Accept = "application/vc+ld+json" }
    $r = Invoke-WebRequest -Uri $t.url -UseBasicParsing -SessionVariable fresh -Headers $hdr -ErrorAction Stop

    $ct = $r.Headers["content-type"]
    $len = $r.RawContentLength
    if ($ct -like "*vc+ld+json*") {
      Write-Host "  PASS  $label $($r.StatusCode)  $ct  ${len}B" -ForegroundColor Green
    } else {
      Write-Host "  WARN  $label $($r.StatusCode)  $ct  ${len}B  <- not JSON-LD" -ForegroundColor Yellow
      $allOk = $false
    }
  }
  catch {
    $status = $null
    if ($_.Exception.Response) { $status = $_.Exception.Response.StatusCode.value__ }
    if ($status) {
      Write-Host "  FAIL  $label $status  $($t.url)" -ForegroundColor Red
    } else {
      Write-Host "  FAIL  $label $($_.Exception.Message)" -ForegroundColor Red
    }
    $allOk = $false
  }
}

Write-Host ""
if ($allOk) {
  Write-Host "All four identifier URLs resolve anonymously." -ForegroundColor Green
  Write-Host "The badge is ingestible by something that is not us." -ForegroundColor Green
  exit 0
} else {
  Write-Host "One or more identifier URLs are NOT publicly resolvable." -ForegroundColor Red
  Write-Host "401 = gateway verify_jwt.  404 = missing route or locale prefix." -ForegroundColor Red
  exit 1
}
