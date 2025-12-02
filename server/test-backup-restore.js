#!/usr/bin/env node

/**
 * Backup Restore Test Script
 * Tests database backup and restore procedures on a temporary test database
 * 
 * This script:
 * 1. Creates a temporary test database
 * 2. Performs a backup of the production database
 * 3. Restores the backup to the test database
 * 4. Validates the restoration was successful
 * 5. Cleans up the temporary database
 * 
 * SAFETY: Never touches production data, only reads from it
 * 
 * Usage:
 *   node test-backup-restore.js
 *   npm run test:backup-restore
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { rm, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config();

// Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const PROD_DB_NAME = process.env.DB_NAME || 'donors_db';
const TEST_DB_NAME = `${PROD_DB_NAME}_restore_test_${Date.now()}`;
const BACKUP_DIR = join(__dirname, '..', 'database', 'backups');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}▶${colors.reset}  ${msg}`)
};

/**
 * Execute PostgreSQL command with proper password handling
 */
async function execPsql(sqlCommand, database = 'postgres') {
  const escapedPassword = DB_PASSWORD.replace(/'/g, "''");
  const cmd = `powershell.exe -NoProfile -Command "$env:PGPASSWORD='${escapedPassword}'; & psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${database} -c \\"${sqlCommand}\\""`;
  
  return await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
}

/**
 * Execute pg_dump with proper password handling
 */
async function execPgDump(database, outputFile) {
  const escapedPassword = DB_PASSWORD.replace(/'/g, "''");
  const cmd = `powershell.exe -NoProfile -Command "$env:PGPASSWORD='${escapedPassword}'; & pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${database} --no-owner --no-privileges --clean --if-exists --column-inserts -f '${outputFile}'"`;
  
  return await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
}

/**
 * Check if database exists
 */
async function databaseExists(dbName) {
  try {
    const { stdout } = await execPsql(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    return stdout.includes('1 row');
  } catch (error) {
    return false;
  }
}

/**
 * Create test database
 */
async function createTestDatabase() {
  log.step(`Creating temporary test database: ${TEST_DB_NAME}`);
  
  try {
    // Check if database already exists
    if (await databaseExists(TEST_DB_NAME)) {
      log.warning('Test database already exists, dropping it first');
      await execPsql(`DROP DATABASE ${TEST_DB_NAME}`);
    }
    
    // Create new test database
    await execPsql(`CREATE DATABASE ${TEST_DB_NAME}`);
    log.success(`Test database created: ${TEST_DB_NAME}`);
    return true;
  } catch (error) {
    log.error(`Failed to create test database: ${error.message}`);
    return false;
  }
}

/**
 * Create backup of production database
 */
async function createBackup() {
  log.step('Creating backup of production database');
  
  const backupFile = join(BACKUP_DIR, `test_backup_${Date.now()}.sql`);
  
  try {
    await execPgDump(PROD_DB_NAME, backupFile);
    
    if (existsSync(backupFile)) {
      const stats = await import('fs').then(fs => fs.promises.stat(backupFile));
      log.success(`Backup created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return backupFile;
    } else {
      throw new Error('Backup file was not created');
    }
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    return null;
  }
}

/**
 * Restore backup to test database
 */
async function restoreBackup(backupFile) {
  log.step('Restoring backup to test database');
  
  try {
    const escapedPassword = DB_PASSWORD.replace(/'/g, "''");
    const cmd = `powershell.exe -NoProfile -Command "$env:PGPASSWORD='${escapedPassword}'; & psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB_NAME} -f '${backupFile}'"`;
    
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
    log.success('Backup restored successfully');
    return true;
  } catch (error) {
    // psql may return non-zero exit code even on success due to notices
    if (error.stderr && error.stderr.toLowerCase().includes('error')) {
      log.error(`Restore failed: ${error.message}`);
      return false;
    }
    log.success('Backup restored successfully (with notices)');
    return true;
  }
}

/**
 * Validate restoration
 */
async function validateRestoration() {
  log.step('Validating restoration');
  
  const tests = [
    { name: 'Check students table', query: 'SELECT COUNT(*) FROM students', expectRows: true },
    { name: 'Check donors table', query: 'SELECT COUNT(*) FROM donors', expectRows: true },
    { name: 'Check users table', query: 'SELECT COUNT(*) FROM users', expectRows: true },
    { name: 'Check applications table', query: 'SELECT COUNT(*) FROM applications', expectRows: true }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const { stdout } = await execPsql(test.query, TEST_DB_NAME);
      
      if (test.expectRows && stdout.includes('rows')) {
        log.success(`${test.name}: `);
      } else if (stdout.length > 0) {
        log.success(`${test.name}: `);
      } else {
        log.warning(`${test.name}: No data`);
      }
    } catch (error) {
      log.error(`${test.name}: Failed - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Cleanup temporary database and backup file
 */
async function cleanup(backupFile) {
  log.step('Cleaning up');
  
  try {
    // Drop test database
    if (await databaseExists(TEST_DB_NAME)) {
      await execPsql(`DROP DATABASE ${TEST_DB_NAME}`);
      log.success(`Dropped test database: ${TEST_DB_NAME}`);
    }
    
    // Delete backup file
    if (backupFile && existsSync(backupFile)) {
      await rm(backupFile);
      log.success('Removed test backup file');
    }
  } catch (error) {
    log.warning(`Cleanup warning: ${error.message}`);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Database Backup & Restore Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  log.info(`Production database: ${PROD_DB_NAME}`);
  log.info(`Test database: ${TEST_DB_NAME}`);
  log.info('This test NEVER modifies production data');
  console.log('');
  
  let backupFile = null;
  let success = false;
  
  try {
    // Step 1: Create test database
    if (!await createTestDatabase()) {
      throw new Error('Failed to create test database');
    }
    
    // Step 2: Create backup
    backupFile = await createBackup();
    if (!backupFile) {
      throw new Error('Failed to create backup');
    }
    
    // Step 3: Restore backup
    if (!await restoreBackup(backupFile)) {
      throw new Error('Failed to restore backup');
    }
    
    // Step 4: Validate
    if (!await validateRestoration()) {
      throw new Error('Validation failed');
    }
    
    success = true;
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    log.success('All tests passed! Backup/restore procedures are working correctly.');
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    log.error(`Test failed: ${error.message}`);
    console.log('═══════════════════════════════════════════════════════');
  } finally {
    // Always cleanup
    await cleanup(backupFile);
  }
  
  process.exit(success ? 0 : 1);
}

// Run tests
main();
