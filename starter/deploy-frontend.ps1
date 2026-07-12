# Builds the Next.js static export and deploys it into backend-php/public.
# Usage:  powershell -File deploy-frontend.ps1        (from the repo root)
# Works from any folder that contains frontend/ and backend-php/ side by side.

$root = $PSScriptRoot
$frontend = Join-Path $root 'frontend'
$public = Join-Path $root 'backend-php\public'

# --- 1. Build (retry: Windows Defender/OneDrive can hold .next briefly) ---
Set-Location $frontend
$ok = $false
foreach ($i in 1..4) {
    if (Test-Path .next) { try { Remove-Item -Recurse -Force .next -ErrorAction Stop } catch { Start-Sleep -Seconds 2 } }
    npm run build
    if ($LASTEXITCODE -eq 0 -and (Test-Path out\index.html)) { $ok = $true; break }
    Write-Host "=== build retry $i ==="
}
if (-not $ok) { Write-Error 'BUILD FAILED'; exit 1 }

# --- 2. Deploy: replace hashed assets, overlay the rest -------------------
if (Test-Path "$public\_next") { Remove-Item -Recurse -Force "$public\_next" }
Copy-Item "$frontend\out\*" $public -Recurse -Force

# --- 3. Flatten Next segment-cache payloads -------------------------------
# The browser requests /route/__next.route.__PAGE__.txt (dot-joined) but the
# exporter writes route/__next.route/__PAGE__.txt (nested). Static copies
# avoid a PHP round-trip per prefetch; routes/web.php has a fallback shim too.
$made = 0
Get-ChildItem $public -Recurse -Directory -Filter '__next.*' | ForEach-Object {
    $d = $_
    Get-ChildItem $d.FullName -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($d.FullName.Length + 1).Replace('\', '.')
        Copy-Item $_.FullName (Join-Path $d.Parent.FullName ($d.Name + '.' + $rel)) -Force
        $made++
    }
}
Write-Host "DEPLOYED — $made segment payloads flattened"
