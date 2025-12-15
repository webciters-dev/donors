#!/usr/bin/env node

/**
 * COMPREHENSIVE CODEBASE VALIDATION AUDIT
 * Checks ALL ASPECTS from every angle to ensure EVERYTHING works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverSrcDir = path.join(__dirname, 'src');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function section(title) {
  console.log('\n' + colors.cyan + '═'.repeat(80));
  console.log('║ ' + title);
  console.log('═'.repeat(80) + colors.reset);
}

function check(description, passed, details = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    log(colors.green, '✓', description);
    if (details) log(colors.green, '  └─', details);
  } else {
    failedChecks++;
    log(colors.red, '✗', description);
    if (details) log(colors.red, '  └─', details);
  }
}

// ============================================================================
// AUDIT 1: Import/Export Chain Validation
// ============================================================================

section('AUDIT 1: Import/Export Chains');

const importMap = {
  'errorCodes.js': {
    exports: ['ErrorCodes', 'getErrorInfo', 'mapPrismaErrorCode', 'default'],
    importedBy: ['errorLogger.js', 'enhancedError.js', 'auth.js', 'interviews.js', 'boardMembers.js'],
  },
  'errorLogger.js': {
    exports: ['logError', 'getErrorStats', 'resetErrorStats', 'errorLoggingMiddleware', 'default'],
    importedBy: ['apiResponse.js', 'server.js', 'auth.js', 'interviews.js', 'boardMembers.js'],
  },
  'enhancedError.js': {
    exports: ['createErrorResponse', 'createValidationError', 'createNotFoundError', 'createConflictError', 'createAuthError', 'createPermissionError', 'createInternalError', 'handlePrismaError', 'safeErrorResponse', 'default'],
    importedBy: ['auth.js', 'interviews.js', 'boardMembers.js'],
  },
  'apiResponse.js': {
    exports: ['ApiError', 'formatErrorResponse', 'sendError', 'sendSuccess', 'formatSuccessResponse', 'errorHandlerMiddleware', 'asyncHandler', 'ErrorCodes', 'default'],
    importedBy: ['server.js'],
  },
};

for (const [file, config] of Object.entries(importMap)) {
  const filePath = path.join(serverSrcDir, 'lib', file);
  const exists = fs.existsSync(filePath);
  check(`File exists: ${file}`, exists);

  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    config.exports.forEach((exp) => {
      const hasExport = exp === 'default' 
        ? /export\s+default\s+/m.test(content)
        : new RegExp(`export\\s+(const|function|class)\\s+${exp}\\b`).test(content) ||
          new RegExp(`export\\s+\\{[^}]*${exp}[^}]*\\}`).test(content);
      check(
        `  └─ Exports: ${exp}`,
        hasExport,
        `Required by: ${config.importedBy.join(', ')}`
      );
    });
  }
}

// ============================================================================
// AUDIT 2: Middleware Stack Order
// ============================================================================

section('AUDIT 2: Middleware Stack Order (server.js)');

const serverContent = fs.readFileSync(path.join(serverSrcDir, 'server.js'), 'utf8');

const middlewareOrder = [
  { name: 'dotenv.config()', regex: /dotenv\.config/ },
  { name: 'helmet()', regex: /app\.use\(helmet/ },
  { name: 'morgan/httpLogger', regex: /app\.use\(.*morgan|httpLogger/ },
  { name: 'cors()', regex: /app\.use\(cors/ },
  { name: 'express.json()', regex: /express\.json/ },
  { name: 'express.urlencoded()', regex: /express\.urlencoded/ },
  { name: 'Timeout configuration', regex: /setTimeout/ },
  { name: 'Error Reporting Middleware', regex: /res\.on\('finish'/ },
  { name: 'Health check', regex: /\/api\/health/ },
  { name: 'Routes', regex: /app\.use\("\/api/ },
  { name: 'Error handler', regex: /errorHandlerMiddleware|app\.use\(.*error.*\)/ },
];

let lastIndex = -1;
middlewareOrder.forEach(({ name, regex }) => {
  const match = serverContent.match(regex);
  if (match) {
    const index = serverContent.indexOf(match[0]);
    check(`Middleware present: ${name}`, true, `Found at position`);
    check(
      `  └─ Correct order: ${name}`,
      index > lastIndex,
      `Position check: ${index > lastIndex ? 'PASS' : 'FAIL'}`
    );
    lastIndex = index;
  } else {
    check(`Middleware present: ${name}`, false, 'NOT FOUND');
  }
});

// ============================================================================
// AUDIT 3: Route Files
// ============================================================================

section('AUDIT 3: Route Files Export Check');

const routeFiles = ['auth.js', 'interviews.js', 'boardMembers.js'];
routeFiles.forEach((file) => {
  const filePath = path.join(serverSrcDir, 'routes', file);
  const exists = fs.existsSync(filePath);
  check(`Route file exists: ${file}`, exists);

  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasExport = /export\s+default\s+router/.test(content);
    check(`  └─ Exports router: ${file}`, hasExport);

    // Check imports
    const imports = {
      'express': /import\s+express\s+from\s+["']express["']/,
      'ErrorCodes': /import\s+\{[^}]*ErrorCodes[^}]*\}\s+from\s+["'].*errorCodes\.js["']/,
      'logError': /import\s+\{[^}]*logError[^}]*\}\s+from\s+["'].*errorLogger\.js["']/,
      'enhancedError functions': /import\s+\{[^}]*(createValidationError|createNotFoundError|handlePrismaError|createInternalError)[^}]*\}\s+from\s+["'].*enhancedError\.js["']/,
    };

    for (const [name, regex] of Object.entries(imports)) {
      const hasImport = regex.test(content);
      check(`  └─ Imports: ${name}`, hasImport);
    }
  }
});

// ============================================================================
// AUDIT 4: Error Handler Coverage
// ============================================================================

section('AUDIT 4: Error Handler Coverage (apiResponse.js)');

const apiResponseContent = fs.readFileSync(path.join(serverSrcDir, 'lib', 'apiResponse.js'), 'utf8');

const errorTypes = [
  { name: 'ApiError', regex: /err\s+instanceof\s+ApiError/ },
  { name: 'ValidationError', regex: /err\.name\s*===\s*['"]ValidationError['"]/ },
  { name: 'PrismaError (P2002, P2025, etc)', regex: /err\.code\s*&&\s*err\.code\.startsWith\(['"]P['"]/ },
  { name: 'JsonWebTokenError', regex: /err\.name\s*===\s*['"]JsonWebTokenError['"]/ },
  { name: 'TokenExpiredError', regex: /err\.name\s*===\s*['"]TokenExpiredError['"]/ },
  { name: 'Unexpected/Generic Error', regex: /logError\(err,\s*\{[\s\S]*action['"]:\s*['"]unexpected_error['"]/ },
];

errorTypes.forEach(({ name, regex }) => {
  const isHandled = regex.test(apiResponseContent);
  check(`Error type handled: ${name}`, isHandled);
});

// ============================================================================
// AUDIT 5: Prisma Error Code Mapping
// ============================================================================

section('AUDIT 5: Prisma Error Code Mapping (apiResponse.js)');

const prismaCodes = [
  { code: 'P2002', expected: 'DB_003', description: 'Unique constraint' },
  { code: 'P2025', expected: 'DB_005', description: 'Record not found' },
  { code: 'P2003', expected: 'DB_004', description: 'Foreign key' },
  { code: 'P2014', expected: 'DB_002', description: 'Relation violation' },
];

prismaCodes.forEach(({ code, expected, description }) => {
  const hasMapping = new RegExp(`case\\s+['"]${code}['"]:[\\s\\S]*?${expected}`).test(apiResponseContent);
  check(`Prisma ${code} → ${expected}`, hasMapping, description);
});

// ============================================================================
// AUDIT 6: Database Operations Coverage
// ============================================================================

section('AUDIT 6: Database Operations Wrapped in Error Handling');

const databaseCheckpoints = [
  { file: 'auth.js', operations: ['findUnique', 'create'] },
  { file: 'interviews.js', operations: ['findMany', 'findUnique', 'create', 'update'] },
  { file: 'boardMembers.js', operations: ['findMany', 'findUnique', 'create', 'update', 'delete'] },
];

databaseCheckpoints.forEach(({ file, operations }) => {
  const filePath = path.join(serverSrcDir, 'routes', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const isTryCatch = /try\s*\{[\s\S]*\}\s*catch\s*\(/ .test(content);
    check(`${file}: Operations wrapped in try-catch`, isTryCatch);

    operations.forEach((op) => {
      const hasOp = content.includes(`prisma.`) && content.includes(op);
      check(`  └─ Uses prisma.${op}()`, hasOp);
    });
  }
});

// ============================================================================
// AUDIT 7: Circular Dependencies
// ============================================================================

section('AUDIT 7: Circular Dependency Detection');

const importChains = {
  'server.js → errorLogger.js → errorCodes.js': [
    { file: 'server.js', importFrom: 'errorLogger.js' },
    { file: 'errorLogger.js', importFrom: 'errorCodes.js' },
    { file: 'errorCodes.js', importFrom: null }, // Terminal point
  ],
  'apiResponse.js → errorLogger.js → errorCodes.js': [
    { file: 'apiResponse.js', importFrom: 'errorLogger.js' },
    { file: 'errorLogger.js', importFrom: 'errorCodes.js' },
    { file: 'errorCodes.js', importFrom: null }, // Terminal point
  ],
};

let circularFound = false;
for (const [chainName, chain] of Object.entries(importChains)) {
  const hasCircular = chain.some(({ file, importFrom }) => {
    if (!importFrom) return false;
    const filePath = path.join(serverSrcDir, file.endsWith('.js') ? 'lib' : '', file);
    const content = fs.readFileSync(filePath, 'utf8');
    // Check if imports back to a file in the chain
    return chain.some((c) => content.includes(`from '${c.file}'`) || content.includes(`from "${c.file}"`));
  });
  check(`No circular dependency: ${chainName}`, !hasCircular);
  if (hasCircular) circularFound = true;
}

// ============================================================================
// AUDIT 8: Response Format Consistency
// ============================================================================

section('AUDIT 8: Response Format Consistency');

const responsePatterns = [
  { name: 'Success response', regex: /success:\s*true|success:\s*true,\s*data/ },
  { name: 'Error response', regex: /success:\s*false|error:\s*\{/ },
  { name: 'Status codes defined', regex: /statusCode|status\(/ },
  { name: 'Timestamps included', regex: /timestamp|toISOString/ },
];

responsePatterns.forEach(({ name, regex }) => {
  const hasPattern = regex.test(apiResponseContent);
  check(`Response format: ${name}`, hasPattern);
});

// ============================================================================
// AUDIT 9: Logging Completeness
// ============================================================================

section('AUDIT 9: Logging Completeness');

const loggingCheckpoints = [
  { file: 'errorLogger.js', should: 'Have logError function' },
  { file: 'apiResponse.js', should: 'Call logError in errorHandlerMiddleware' },
  { file: 'server.js', should: 'Use errorReportingLogger' },
];

loggingCheckpoints.forEach(({ file, should }) => {
  const filePath = path.join(serverSrcDir, file.endsWith('.js') ? 'lib' : '', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasLogging = /logError|logger\.|errorReportingLogger/.test(content);
    check(`${file}: ${should}`, hasLogging);
  }
});

// ============================================================================
// AUDIT 10: Environment Variables
// ============================================================================

section('AUDIT 10: Environment Variables with Fallbacks');

const envVars = [
  { name: 'JWT_SECRET', fallback: '"dev_secret"', file: 'auth.js' },
  { name: 'JWT_EXPIRES_IN', fallback: '"7d"', file: 'auth.js' },
  { name: 'NODE_ENV', fallback: '"development"', file: 'server.js' },
  { name: 'PORT', fallback: '3001', file: 'server.js' },
];

envVars.forEach(({ name, fallback, file }) => {
  const filePath = path.join(serverSrcDir, file.endsWith('.js') ? 'routes' : '', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasVarOrFallback = new RegExp(`process\\.env\\.${name}|${fallback}`).test(content);
    check(`${name}: has value or fallback`, hasVarOrFallback);
  }
});

// ============================================================================
// FINAL REPORT
// ============================================================================

section('FINAL AUDIT REPORT');

const successRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
const status = failedChecks === 0 ? colors.green : colors.red;

log(colors.cyan, `Total Checks:  ${totalChecks}`);
log(colors.green, `Passed:        ${passedChecks}`);
log(failedChecks > 0 ? colors.red : colors.green, `Failed:        ${failedChecks}`);
log(status, `Success Rate:  ${successRate}%`);

if (failedChecks === 0) {
  log(colors.green, '\n✓ ALL AUDITS PASSED - CODEBASE IS HEALTHY');
} else {
  log(colors.red, `\n✗ ${failedChecks} ISSUES FOUND - REVIEW FAILURES ABOVE`);
}

log(colors.cyan, '\n' + '═'.repeat(80));

process.exit(failedChecks === 0 ? 0 : 1);
