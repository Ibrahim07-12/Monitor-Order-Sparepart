<#
PowerShell wrapper: backup spareparts to JSON and run migration to set missing `plant`.
Usage (PowerShell):
  Set-Location to project root (where package.json is), then:
  .\scripts\run_backup_and_migrate.ps1 -ServiceAccountPath "C:\path\to\serviceAccount.json"

If you don't pass -ServiceAccountPath, the script will try the environment variable or default to the Downloads filename you gave.

The script prints step-by-step logs and writes two files in the project root:
 - backup_output.txt  (full stdout/stderr of backup run)
 - migrate_output.txt (full stdout/stderr of migration run)

At the end it prints a short JSON summary you can copy/paste back here for me to check.
#>
param(
    [string]$ServiceAccountPath = "C:\Users\IBRAHIM\Downloads\lampu-plant-monitoring-firebase-adminsdk-fbsvc-4430d24e43.json"
)

function ExitWithError($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# Ensure we're at project root
if (!(Test-Path "package.json")) {
    ExitWithError "package.json not found in current directory. Run this script from the project root."
}

# Check node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    ExitWithError "Node.js not found in PATH. Install Node.js first: https://nodejs.org/"
}

# Ensure service account exists
if (-not (Test-Path $ServiceAccountPath)) {
    Write-Host "Service account not found at $ServiceAccountPath" -ForegroundColor Yellow
    Write-Host "You can cancel and provide the correct path, or press Enter to continue and rely on existing env var if set."
    $null = Read-Host
    if (-not (Test-Path $ServiceAccountPath)) {
        if (-not $env:GOOGLE_APPLICATION_CREDENTIALS) {
            ExitWithError "Service account not found and GOOGLE_APPLICATION_CREDENTIALS not set."
        }
    }
}

if (Test-Path $ServiceAccountPath) {
    Write-Host "Setting GOOGLE_APPLICATION_CREDENTIALS to: $ServiceAccountPath"
    $env:GOOGLE_APPLICATION_CREDENTIALS = $ServiceAccountPath
} else {
    Write-Host "Using existing GOOGLE_APPLICATION_CREDENTIALS env var: $($env:GOOGLE_APPLICATION_CREDENTIALS)"
}

# Ensure firebase-admin installed
if (-not (Test-Path ".\node_modules\firebase-admin")) {
    Write-Host "firebase-admin not found - running npm install firebase-admin (may take a moment)" -ForegroundColor Cyan
    npm install firebase-admin | Tee-Object npm_install_log.txt
    if ($LASTEXITCODE -ne 0) {
        ExitWithError "npm install failed; see npm_install_log.txt"
    }
}

# Run backup
Write-Host "Running backup script..." -ForegroundColor Green
node .\scripts\backup_spareparts.js *>&1 | Tee-Object -FilePath backup_output.txt
$backupLog = Get-Content backup_output.txt -Raw

# Try to extract backup filename and count
$backupFile = $null
$backupCount = $null
if ($backupLog -match "Wrote\s+(\d+)\s+documents\s+to\s+(\S+\.json)") {
    $backupCount = $matches[1]
    $backupFile = $matches[2]
} else {
    # fallback: find any backup_spareparts*.json in folder
    $found = Get-ChildItem -Filter "backup_spareparts*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($found) { $backupFile = $found.Name }
}

if ($backupFile) { Write-Host "Backup file: $backupFile (documents: $backupCount)" -ForegroundColor Green } else { Write-Host "Backup file not detected in output - check backup_output.txt" -ForegroundColor Yellow }

# Run migration
Write-Host "Running migration script..." -ForegroundColor Green
node .\scripts\migrate_add_plant.js *>&1 | Tee-Object -FilePath migrate_output.txt
$migrateLog = Get-Content migrate_output.txt -Raw

# Parse migration results
$migratedCount = $null
$migrationStatus = "unknown"
if ($migrateLog -match "Updating\s+(\d+)\s+documents") {
    $migratedCount = $matches[1]
    $migrationStatus = "updated"
} elseif ($migrateLog -match "No documents needed update") {
    $migratedCount = 0
    $migrationStatus = "no-op"
} elseif ($migrateLog -match "Migration completed") {
    $migrationStatus = "completed"
}

# Final summary
$summary = [pscustomobject]@{
    timestamp = (Get-Date).ToString("o")
    serviceAccount = if (Test-Path $ServiceAccountPath) { $ServiceAccountPath } else { $env:GOOGLE_APPLICATION_CREDENTIALS }
    backupFile = $backupFile
    backupCount = if ($backupCount) { [int]$backupCount } else { $null }
    migrationStatus = $migrationStatus
    migratedCount = if ($migratedCount -ne $null) { [int]$migratedCount } else { $null }
    backupLogFile = (Resolve-Path backup_output.txt).Path
    migrateLogFile = (Resolve-Path migrate_output.txt).Path
}

Write-Host "\n=== SUMMARY ===" -ForegroundColor Magenta
$summary | ConvertTo-Json -Depth 5

Write-Host "\nIf you want me to check results, copy the JSON summary above and paste it here, and also paste the first ~100 lines of migrate_output.txt or backup_output.txt if there are errors." -ForegroundColor Cyan

Write-Host "\nImportant: after running, consider rotating/revoking the service account key in Firebase Console to keep credentials safe." -ForegroundColor Yellow

exit 0
