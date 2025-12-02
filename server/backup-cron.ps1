# Automated Database Backup Script for Windows
# Usage: Run this script via Windows Task Scheduler for automated daily backups
#
# Setup Task Scheduler:
#   1. Open Task Scheduler
#   2. Create Basic Task -> Name: "Database Backup"
#   3. Trigger: Daily at 2:00 AM
#   4. Action: Start a program
#      - Program: powershell.exe
#      - Arguments: -ExecutionPolicy Bypass -File "C:\projects\donor\server\backup-cron.ps1"
#      - Start in: C:\projects\donor\server
#   5. Finish and test with "Run" button

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$BACKUP_DIR = Join-Path $PROJECT_ROOT "database\backups"
$LOG_DIR = Join-Path $SCRIPT_DIR "logs"
$MAX_BACKUPS = 30  # Keep last 30 days

# Load environment variables from .env file
$ENV_FILE = Join-Path $SCRIPT_DIR ".env"
if (Test-Path $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Database configuration
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "donors_dev" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }

# Ensure directories exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "✅ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
}

# Setup logging
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LOG_FILE = Join-Path $LOG_DIR "backup_$timestamp.log"

function Write-Log {
    param([string]$Message)
    $logMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
}

Write-Log "═══════════════════════════════════════"
Write-Log "  Automated Database Backup"
Write-Log "═══════════════════════════════════════"
Write-Log ""

# Generate backup filename
$backupFilename = "${DB_NAME}_backup_$timestamp.sql"
$backupPath = Join-Path $BACKUP_DIR $backupFilename

Write-Log "🗄️  Starting database backup: $DB_NAME"
Write-Log "📅 Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "📁 Target: $backupPath"

try {
    # Check if pg_dump is available
    $pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
    if (-not $pgDumpPath) {
        throw "pg_dump not found. Please ensure PostgreSQL client tools are installed and in PATH."
    }
    
    # Set password environment variable if provided
    if ($env:DB_PASSWORD) {
        $env:PGPASSWORD = $env:DB_PASSWORD
    }
    
    # Execute pg_dump
    $pgDumpArgs = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $DB_NAME,
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        "--column-inserts",
        "-f", $backupPath
    )
    
    Write-Log "Executing pg_dump..."
    & pg_dump @pgDumpArgs 2>&1 | ForEach-Object {
        if ($_ -match 'NOTICE') {
            # Ignore notices
        } elseif ($_ -match 'WARNING|ERROR') {
            Write-Log "⚠️  $_"
        }
    }
    
    # Verify backup was created
    if (Test-Path $backupPath) {
        $fileSize = (Get-Item $backupPath).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Log "✅ Backup completed successfully: $backupFilename"
        Write-Log "📊 Backup size: $fileSizeMB MB"
    } else {
        throw "Backup file was not created"
    }
    
    # Clean up old backups
    Write-Log ""
    Write-Log "🗑️  Cleaning up old backups..."
    
    $backupFiles = Get-ChildItem -Path $BACKUP_DIR -Filter "*.sql" |
        Where-Object { $_.Name -match '_backup_\d{4}-\d{2}-\d{2}' } |
        Sort-Object LastWriteTime -Descending
    
    if ($backupFiles.Count -gt $MAX_BACKUPS) {
        $toDelete = $backupFiles | Select-Object -Skip $MAX_BACKUPS
        Write-Log "   Deleting $($toDelete.Count) old backup(s)..."
        
        foreach ($file in $toDelete) {
            Remove-Item $file.FullName -Force
            Write-Log "   Deleted: $($file.Name)"
        }
        
        Write-Log "✅ Cleanup complete. Kept $MAX_BACKUPS most recent backups."
    } else {
        Write-Log "✅ No cleanup needed. Current backups: $($backupFiles.Count)/$MAX_BACKUPS"
    }
    
    Write-Log ""
    Write-Log "✅ Backup process completed successfully!"
    Write-Log "📋 Log saved to: $LOG_FILE"
    
} catch {
    Write-Log "❌ Backup failed: $_"
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}

# Clean old log files (keep last 30 days)
Write-Log ""
Write-Log "🗑️  Cleaning up old log files..."
$oldLogs = Get-ChildItem -Path $LOG_DIR -Filter "backup_*.log" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }

if ($oldLogs.Count -gt 0) {
    $oldLogs | Remove-Item -Force
    Write-Log "   Deleted $($oldLogs.Count) old log file(s)"
}

Write-Log ""
Write-Log "═══════════════════════════════════════"
exit 0
