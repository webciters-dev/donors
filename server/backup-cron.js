#!/usr/bin/env node

/**
 * Automated Database Backup Script
 * Runs daily backups of the PostgreSQL database with timestamped archives
 * 
 * Usage:
 *   node backup-cron.js            # Single backup
 *   npm run backup                 # Via package.json script
 *   
 * Setup cron (Linux/Mac):
 *   0 2 * * * cd /path/to/server && node backup-cron.js >> logs/backup.log 2>&1
 * 
 * Setup Task Scheduler (Windows):
 *   Use backup-cron.ps1 script with Windows Task Scheduler
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env
config();

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BACKUP_DIR = join(__dirname, '..', 'database', 'backups');
const MAX_BACKUPS = 30; // Keep last 30 days of backups
const DB_NAME = process.env.DB_NAME || 'donors_dev';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(` Created backup directory: ${BACKUP_DIR}`);
}

/**
 * Generate timestamp for backup filename
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0]; // Format: 2024-01-15_14-30-00
}

/**
 * Execute database backup using pg_dump
 */
async function performBackup() {
  const timestamp = getTimestamp();
  const filename = `${DB_NAME}_backup_${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);
  
  console.log(`\n️  Starting database backup: ${DB_NAME}`);
  console.log(` Timestamp: ${new Date().toLocaleString()}`);
  console.log(` Target: ${filepath}`);
  
  try {
    // Build pg_dump command - use PowerShell's single quotes to prevent interpretation
    const pgPassword = process.env.DB_PASSWORD || '';
    // Single quotes in PowerShell prevent variable expansion and special char interpretation
    // Escape single quotes by doubling them
    const escapedPassword = pgPassword.replace(/'/g, "''");
    
    const pgDumpCmd = `powershell.exe -NoProfile -Command "$env:PGPASSWORD='${escapedPassword}'; & pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-privileges --clean --if-exists --column-inserts -f '${filepath}'"`;
    
    // Execute backup
    const { stdout, stderr } = await execAsync(pgDumpCmd, { 
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large databases
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('️  Warnings:', stderr);
    }
    
    console.log(` Backup completed successfully: ${filename}`);
    
    // Verify file was created
    if (existsSync(filepath)) {
      const { size } = await import('fs').then(fs => fs.promises.stat(filepath));
      console.log(` Backup size: ${(size / 1024 / 1024).toFixed(2)} MB`);
      return filepath;
    } else {
      throw new Error('Backup file was not created');
    }
    
  } catch (error) {
    console.error(' Backup failed:', error.message);
    throw error;
  }
}

/**
 * Clean up old backups (keep only last MAX_BACKUPS)
 */
async function cleanOldBackups() {
  try {
    const { readdir, unlink, stat } = await import('fs').then(fs => fs.promises);
    const files = await readdir(BACKUP_DIR);
    
    // Filter backup files and get their stats
    const backupFiles = [];
    for (const file of files) {
      if (file.endsWith('.sql') && file.includes('_backup_')) {
        const filepath = join(BACKUP_DIR, file);
        const stats = await stat(filepath);
        backupFiles.push({ name: file, path: filepath, mtime: stats.mtime });
      }
    }
    
    // Sort by modification time (newest first)
    backupFiles.sort((a, b) => b.mtime - a.mtime);
    
    // Delete old backups
    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      console.log(`\n️  Cleaning up ${toDelete.length} old backup(s)...`);
      
      for (const file of toDelete) {
        await unlink(file.path);
        console.log(`   Deleted: ${file.name}`);
      }
      
      console.log(` Cleanup complete. Kept ${MAX_BACKUPS} most recent backups.`);
    } else {
      console.log(`\n No cleanup needed. Current backups: ${backupFiles.length}/${MAX_BACKUPS}`);
    }
    
  } catch (error) {
    console.error('️  Cleanup failed:', error.message);
    // Don't throw - cleanup failure shouldn't fail the backup
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Automated Database Backup');
  console.log('═══════════════════════════════════════');
  
  try {
    // Perform backup
    await performBackup();
    
    // Clean old backups
    await cleanOldBackups();
    
    console.log('\n Backup process completed successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n Backup process failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main();

export { performBackup, cleanOldBackups };
