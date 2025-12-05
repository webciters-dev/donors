# Database & File Transfer Script to VPS
# Transfers database backup and file archive to production VPS

param(
    [string]$VpsUser = "sohail",
    [string]$VpsIp = "136.144.175.93",
    [string]$VpsPath = "/home/sohail/projects/donors"
)

Write-Host ""
Write-Host "=== DATABASE & FILE MIGRATION TO VPS - TRANSFER SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Define paths
$dbBackup = Get-ChildItem "C:\projects\donor\database_migration\donors_db_complete_*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$filesArchive = Get-ChildItem "C:\projects\donor\server\uploads_backup.tar.gz" -ErrorAction SilentlyContinue
$targetUser = "$VpsUser@$VpsIp"

# Validation
Write-Host "STEP 1: Validating backup files..." -ForegroundColor Cyan
Write-Host ""

if ($null -eq $dbBackup) {
    Write-Host "ERROR: Database backup file not found!" -ForegroundColor Red
    exit 1
}

if ($null -eq $filesArchive) {
    Write-Host "ERROR: Files archive not found!" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Database backup: $($dbBackup.Name)" -ForegroundColor Green
Write-Host "    Size: $([math]::Round($dbBackup.Length/1MB,2)) MB"
Write-Host "    Path: $($dbBackup.FullName)"
Write-Host ""

Write-Host "OK: Files archive: $($filesArchive.Name)" -ForegroundColor Green
Write-Host "    Size: $([math]::Round($filesArchive.Length/1MB,2)) MB"
Write-Host "    Path: $($filesArchive.FullName)"
Write-Host ""

# Test SSH connection
Write-Host "STEP 2: Testing SSH connection..." -ForegroundColor Cyan
try {
    $sshTest = ssh $targetUser "echo Connection successful" 2>&1
    if ($sshTest -contains "Connection successful") {
        Write-Host "OK: SSH connection successful" -ForegroundColor Green
        Write-Host "    Target: $targetUser" 
        Write-Host "    Remote path: $VpsPath"
        Write-Host ""
    }
    else {
        throw "SSH test failed"
    }
}
catch {
    Write-Host "ERROR: SSH connection failed!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. SSH key is configured for $targetUser"
    Write-Host "  2. VPS is reachable at $VpsIp"
    Write-Host "  3. Port 22 is open"
    exit 1
}

# Transfer database backup
Write-Host "STEP 3: Transferring database backup..." -ForegroundColor Cyan
try {
    Write-Host "Source: $($dbBackup.FullName)"
    Write-Host "Destination: $targetUser`:$VpsPath/"
    Write-Host ""
    
    scp $dbBackup.FullName "${targetUser}:${VpsPath}/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Database backup transferred successfully" -ForegroundColor Green
    }
    else {
        throw "SCP transfer failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host "ERROR: Transfer failed!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Transfer files archive
Write-Host "STEP 4: Transferring files archive..." -ForegroundColor Cyan
try {
    Write-Host "Source: $($filesArchive.FullName)"
    Write-Host "Destination: $targetUser`:$VpsPath/"
    Write-Host ""
    
    scp $filesArchive.FullName "${targetUser}:${VpsPath}/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Files archive transferred successfully" -ForegroundColor Green
    }
    else {
        throw "SCP transfer failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host "ERROR: Transfer failed!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verify files on VPS
Write-Host "STEP 5: Verifying files on VPS..." -ForegroundColor Cyan
try {
    $verification = ssh $targetUser "ls -lh ${VpsPath}/*.{sql,gz} 2>/dev/null"
    Write-Host $verification
    Write-Host "OK: Files verified on VPS" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Verification failed!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== TRANSFER COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS (Execute on VPS):" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Connect to VPS:"
Write-Host "   ssh $targetUser"
Write-Host ""
Write-Host "2. Run database restoration commands:"
Write-Host "   cd $VpsPath"
Write-Host "   mkdir -p database_backup"
Write-Host "   mv donors_db_complete_*.sql database_backup/"
Write-Host "   export PGPASSWORD='RoG*741#PoS'"
Write-Host "   pm2 kill"
Write-Host "   psql -U postgres -d donors_db < database_backup/donors_db_complete_*.sql"
Write-Host ""
Write-Host "3. Extract and restart:"
Write-Host "   tar -xzf uploads_backup.tar.gz"
Write-Host "   sudo chown -R sohail:sohail uploads/"
Write-Host "   chmod -R 755 uploads/"
Write-Host "   rm uploads_backup.tar.gz"
Write-Host "   pm2 start ecosystem.config.json"
Write-Host "   sleep 3"
Write-Host "   curl http://localhost:3001/api/health"
Write-Host ""
Write-Host "See EXECUTION_SUMMARY.md for detailed instructions."
Write-Host ""
