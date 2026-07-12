# Builds update packages for hahuplay.com (cPanel shared hosting).
#
#   powershell -ExecutionPolicy Bypass -File deploy-hahuplay.ps1            # frontend + backend zips
#   powershell -ExecutionPolicy Bypass -File deploy-hahuplay.ps1 -SkipBuild # re-zip without rebuilding
#
# Output (in deploy-package\):
#   update-public_html.zip  -> extract inside public_html   (site + Laravel public files)
#   update-app.zip          -> extract in the HOME folder   (backend code; safe overwrite)
#
# Update zips NEVER contain .env, storage/, or the one-time installer, so
# extracting them over the live server cannot clobber secrets, receipts,
# or the database config.

param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dest = Join-Path $root 'deploy-package'
New-Item -ItemType Directory -Force $dest | Out-Null

# ---------- 1. Production frontend build ----------------------------------
if (-not $SkipBuild) {
    Push-Location "$root\frontend"
    if (Test-Path .env.local) { Rename-Item .env.local .env.local.bak }
    $env:NEXT_PUBLIC_SITE_URL = 'https://hahuplay.com'
    $env:NEXT_PUBLIC_API_URL = ''
    try {
        $ok = $false
        foreach ($i in 1..4) {
            if (Test-Path .next) { try { Remove-Item -Recurse -Force .next -ErrorAction Stop } catch { Start-Sleep 2 } }
            npm run build
            if ($LASTEXITCODE -eq 0 -and (Test-Path out\index.html)) { $ok = $true; break }
            Write-Host "=== build retry $i ==="
        }
    } finally {
        if (Test-Path .env.local.bak) { Rename-Item .env.local.bak .env.local }
    }
    Pop-Location
    if (-not $ok) { throw 'Frontend build failed after 4 attempts.' }

    # Refresh the local single-origin deployment too (php artisan serve).
    $pub = "$root\backend-php\public"
    if (Test-Path "$pub\_next") { Remove-Item -Recurse -Force "$pub\_next" }
    Copy-Item "$root\frontend\out\*" $pub -Recurse -Force
}

# ---------- 2. Stage public_html (server variant) --------------------------
$stage = Join-Path $env:TEMP ("hahuplay-deploy-" + [guid]::NewGuid().ToString('n').Substring(0, 8))
New-Item -ItemType Directory -Force "$stage\public_html" | Out-Null
Copy-Item "$root\backend-php\public\*" "$stage\public_html" -Recurse -Force

# Flatten Next.js RSC prefetch payloads (dir/file naming mismatch on static hosts).
Get-ChildItem "$stage\public_html" -Recurse -Directory -Filter '__next.*' | ForEach-Object {
    $d = $_
    Get-ChildItem $d.FullName -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($d.FullName.Length + 1).Replace('\', '.')
        Copy-Item $_.FullName (Join-Path $d.Parent.FullName ($d.Name + '.' + $rel)) -Force
    }
}

# The server's index.php boots Laravel from the sibling ~/app directory.
@'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// The Laravel application lives OUTSIDE the web root, in ~/app.
// Only this public_html folder is reachable from the internet.

if (file_exists($maintenance = __DIR__.'/../app/storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../app/vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__.'/../app/bootstrap/app.php';

$app->handleRequest(Request::capture());
'@ | Set-Content "$stage\public_html\index.php" -Encoding utf8

# ---------- 3. Stage app (backend code only — no secrets/state) ------------
$b = "$root\backend-php"
robocopy $b "$stage\app" /E `
    /XD "$b\public" "$b\node_modules" "$b\.git" "$b\tests" "$b\storage" "$b\bootstrap\cache" `
    /XF database.sqlite .env *.log /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with $LASTEXITCODE" }

# ---------- 4. Zip ----------------------------------------------------------
foreach ($z in @('update-public_html.zip', 'update-app.zip')) {
    if (Test-Path "$dest\$z") { Remove-Item "$dest\$z" -Force }
}
tar.exe -a -cf "$dest\update-public_html.zip" -C "$stage\public_html" .
tar.exe -a -cf "$dest\update-app.zip" -C $stage app
Remove-Item -Recurse -Force $stage

Write-Host ''
Get-ChildItem $dest\update-*.zip | ForEach-Object {
    Write-Host ("  {0}  {1:n1} MB" -f $_.Name, ($_.Length / 1MB))
}
Write-Host ''
Write-Host 'Frontend-only change : upload + extract update-public_html.zip inside public_html'
Write-Host 'Backend change       : also upload + extract update-app.zip in the HOME folder'
Write-Host 'New migration        : ask Claude for a one-time migrate file before going live'
