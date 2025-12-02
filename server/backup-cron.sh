#!/bin/bash

# Automated Database Backup Script for Linux/Mac
# Usage: Run this script via cron for automated daily backups
#
# Setup cron:
#   crontab -e
#   Add line: 0 2 * * * cd /path/to/server && ./backup-cron.sh >> logs/backup.log 2>&1
#
# This runs daily at 2:00 AM and logs output to logs/backup.log

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/database/backups"
LOG_DIR="$SCRIPT_DIR/logs"
MAX_BACKUPS=30  # Keep last 30 days

# Load environment variables from .env if it exists
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# Database configuration
DB_NAME="${DB_NAME:-donors_dev}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Log function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "${BLUE}═══════════════════════════════════════${NC}"
log "${BLUE}  Automated Database Backup${NC}"
log "${BLUE}═══════════════════════════════════════${NC}"
log ""

# Generate backup filename
BACKUP_FILENAME="${DB_NAME}_backup_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

log "${BLUE}️  Starting database backup: $DB_NAME${NC}"
log " Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
log " Target: $BACKUP_PATH"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    log "${RED} pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Set password environment variable if provided
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Execute backup
if pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --column-inserts \
    -f "$BACKUP_PATH" 2>&1 | grep -v "NOTICE"; then
    
    # Verify backup was created
    if [ -f "$BACKUP_PATH" ]; then
        FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        log "${GREEN} Backup completed successfully: $BACKUP_FILENAME${NC}"
        log "${BLUE} Backup size: $FILE_SIZE${NC}"
    else
        log "${RED} Backup file was not created${NC}"
        exit 1
    fi
else
    log "${RED} pg_dump failed${NC}"
    exit 1
fi

# Clean up old backups
log ""
log "${BLUE}️  Cleaning up old backups...${NC}"

# Find and count backup files
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*_backup_*.sql" -type f | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    log "   Deleting $DELETE_COUNT old backup(s)..."
    
    # Delete oldest backups
    find "$BACKUP_DIR" -name "*_backup_*.sql" -type f -printf '%T+ %p\n' | \
        sort | \
        head -n "$DELETE_COUNT" | \
        cut -d' ' -f2- | \
        while read -r file; do
            rm -f "$file"
            log "   Deleted: $(basename "$file")"
        done
    
    log "${GREEN} Cleanup complete. Kept $MAX_BACKUPS most recent backups.${NC}"
else
    log "${GREEN} No cleanup needed. Current backups: $BACKUP_COUNT/$MAX_BACKUPS${NC}"
fi

# Clean up old log files (keep last 30 days)
log ""
log "${BLUE}️  Cleaning up old log files...${NC}"
OLD_LOG_COUNT=$(find "$LOG_DIR" -name "backup_*.log" -type f -mtime +30 | wc -l)

if [ "$OLD_LOG_COUNT" -gt 0 ]; then
    find "$LOG_DIR" -name "backup_*.log" -type f -mtime +30 -delete
    log "   Deleted $OLD_LOG_COUNT old log file(s)"
fi

log ""
log "${GREEN} Backup process completed successfully!${NC}"
log ""
log "${BLUE}═══════════════════════════════════════${NC}"

exit 0
