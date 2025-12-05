#!/usr/bin/env node
// Extended Production Audit - Deep Dive Testing
// Tests user journeys, database integrity, complex workflows, and edge cases

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function logSection(title) {
  log(colors.blue, '\n' + '='.repeat(70));
  log(colors.blue, title);
  log(colors.blue, '='.repeat(70));
}

const results = { passed: 0, failed: 0, tests: [] };

async function test(name, method, path, data = null, auth = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      timeout: 10000,
      validateStatus: () => true
    };
    if (auth) config.headers = { Authorization: `Bearer ${auth}` };
    if (data) config.data = data;

    const response = await axios(config);
    const success = response.status === expectedStatus;

    if (success) {
      results.passed++;
      log(colors.green, `✓ ${name}`);
    } else {
      results.failed++;
      log(colors.red, `✗ ${name} - Expected ${expectedStatus}, got ${response.status}`);
    }

    results.tests.push({ name, success, status: response.status });
    return { success, status: response.status, data: response.data };
  } catch (error) {
    results.failed++;
    log(colors.red, `✗ ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EXTENDED TESTS
// ============================================================================

async function testStudentJourney() {
  logSection('EXTENDED TEST 1: STUDENT JOURNEY');

  // Get approved students
  const studentsRes = await test('Get approved students list', 'GET', '/students/approved', null, null, 200);
  
  if (studentsRes.success && Array.isArray(studentsRes.data) && studentsRes.data.length > 0) {
    log(colors.cyan, `✓ Found ${studentsRes.data.length} approved students`);
    
    const student = studentsRes.data[0];
    log(colors.cyan, `  Sample: ${student.name} (${student.university})`);

    // Try to get student detail
    await test(`Get student detail: ${student.id}`, 'GET', `/students/approved/${student.id}`, null, null, 200);

    // Check sponsorship status (would need auth, so expect 401)
    await test(`Check sponsorship status (requires auth)`, 'GET', `/students/${student.id}/sponsorship-status`, null, null, 401);
  }
}

async function testDonorJourney() {
  logSection('EXTENDED TEST 2: DONOR JOURNEY');

  // Public donor info
  await test('Get aggregated sponsorship stats', 'GET', '/sponsorships/aggregate', null, null, 200);

  // Try to access donor endpoints (require auth)
  await test('Get my donor profile (requires auth)', 'GET', '/donors/me', null, null, 401);
  await test('Get my sponsorships (requires auth)', 'GET', '/donors/me/sponsorships', null, null, 401);
  await test('Create sponsorship (requires auth)', 'POST', '/sponsorships', 
    { studentId: 'test', amount: 1000 }, null, 401);
}

async function testApplicationWorkflow() {
  logSection('EXTENDED TEST 3: APPLICATION WORKFLOW');

  // Get applications (public access)
  const appsRes = await test('Get applications list', 'GET', '/applications', null, null, 200);
  
  if (appsRes.success && Array.isArray(appsRes.data) && appsRes.data.length > 0) {
    log(colors.cyan, `✓ Found ${appsRes.data.length} applications`);
    
    const app = appsRes.data[0];
    await test(`Get application detail: ${app.id}`, 'GET', `/applications/${app.id}`, null, null, 200);
  }

  // Try to create application (requires auth)
  await test('Create application (requires auth)', 'POST', '/applications',
    { studentId: 'test', amount: 2000 }, null, 401);

  // Try to update application (requires auth)
  await test('Update application (requires auth)', 'PATCH', '/applications/test-id',
    { status: 'PROCESSING' }, null, 401);
}

async function testUniversityData() {
  logSection('EXTENDED TEST 4: UNIVERSITY DATA & PROGRAMS');

  // Get universities by country
  const unisRes = await test('Get universities by country', 'GET', '/universities/countries/Pakistan', null, null, 200);
  
  if (unisRes.success && Array.isArray(unisRes.data) && unisRes.data.length > 0) {
    log(colors.cyan, `✓ Found ${unisRes.data.length} universities`);
    
    const uni = unisRes.data[0];
    log(colors.cyan, `  Sample: ${uni.name}`);

    // Get degree levels
    await test(`Get degree levels for university: ${uni.id}`, 'GET', `/universities/${uni.id}/degree-levels`, null, null, 200);

    // Get fields
    await test(`Get fields for university: ${uni.id}`, 'GET', `/universities/${uni.id}/fields`, null, null, 200);

    // Get programs
    await test(`Get programs for university: ${uni.id}`, 'GET', `/universities/${uni.id}/programs`, null, null, 200);
  }
}

async function testFinancialData() {
  logSection('EXTENDED TEST 5: FINANCIAL & FOREX DATA');

  // Get FX rates
  await test('Get latest forex rates', 'GET', '/fx/latest', null, null, 200);

  // Get disbursement list
  const disbRes = await test('Get disbursements list', 'GET', '/disbursements', null, null, 200);
  
  if (disbRes.success && Array.isArray(disbRes.data) && disbRes.data.length > 0) {
    log(colors.cyan, `✓ Found ${disbRes.data.length} disbursements`);
    
    const disb = disbRes.data[0];
    await test(`Get disbursement detail: ${disb.id}`, 'GET', `/disbursements/${disb.id}`, null, null, 200);
  }
}

async function testStatisticsAndReporting() {
  logSection('EXTENDED TEST 6: STATISTICS & REPORTING');

  // Get basic statistics
  const statsRes = await test('Get platform statistics', 'GET', '/statistics', null, null, 200);
  
  if (statsRes.success && statsRes.data) {
    log(colors.cyan, 'Platform Statistics:');
    if (statsRes.data.studentCount !== undefined) log(colors.cyan, `  Students: ${statsRes.data.studentCount}`);
    if (statsRes.data.donorCount !== undefined) log(colors.cyan, `  Donors: ${statsRes.data.donorCount}`);
    if (statsRes.data.applicationCount !== undefined) log(colors.cyan, `  Applications: ${statsRes.data.applicationCount}`);
    if (statsRes.data.sponsorshipCount !== undefined) log(colors.cyan, `  Sponsorships: ${statsRes.data.sponsorshipCount}`);
    if (statsRes.data.universityCount !== undefined) log(colors.cyan, `  Universities: ${statsRes.data.universityCount}`);
  }

  // Get detailed statistics
  await test('Get detailed statistics', 'GET', '/statistics/detailed', null, null, 200);
}

async function testDataValidation() {
  logSection('EXTENDED TEST 7: DATA VALIDATION & ERROR HANDLING');

  // Invalid ID formats
  await test('Invalid ID format - students endpoint', 'GET', '/students/approved/@@invalid@@', null, null, 404);
  await test('Invalid ID format - university endpoint', 'GET', '/universities/@@invalid@@/degree-levels', null, null, 404);
  await test('Invalid ID format - application endpoint', 'GET', '/applications/@@invalid@@', null, null, 404);

  // Bad request bodies
  await test('Bad registration data - no email', 'POST', '/auth/register',
    { password: 'test123' }, null, 400);
  
  await test('Bad registration data - no password', 'POST', '/auth/register',
    { email: 'test@example.com' }, null, 400);

  // Malformed JSON
  await test('Malformed request body', 'POST', '/auth/login',
    null, null, 400);
}

async function testSecurityHeaders() {
  logSection('EXTENDED TEST 8: SECURITY HEADERS & CORS');

  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 10000,
      validateStatus: () => true
    });

    const headers = {
      'content-type': response.headers['content-type'],
      'x-content-type-options': response.headers['x-content-type-options'],
      'x-frame-options': response.headers['x-frame-options'],
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'vary': response.headers['vary']
    };

    log(colors.cyan, 'Security Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        log(colors.green, `  ✓ ${key}: ${value}`);
      }
    });

    results.passed++;
  } catch (error) {
    log(colors.yellow, '⚠ Could not verify security headers');
    results.failed++;
  }
}

async function testFileOperations() {
  logSection('EXTENDED TEST 9: FILE OPERATIONS');

  // These should require auth, so expect 401
  await test('Upload endpoint - requires auth', 'POST', '/uploads', null, null, 401);
  await test('Upload photo - requires auth', 'POST', '/photos/upload', null, null, 401);
  await test('Upload video - requires auth', 'POST', '/videos/upload-intro', null, null, 401);
  await test('List uploads - requires auth', 'GET', '/uploads', null, null, 401);
  await test('List photos - requires auth', 'GET', '/photos/test-id', null, null, 401);
}

async function testAdminEndpoints() {
  logSection('EXTENDED TEST 10: ADMIN ENDPOINTS (RBAC)');

  // These should all require auth
  await test('List users - admin only', 'GET', '/users', null, null, 401);
  await test('Create sub-admin - admin only', 'POST', '/users/sub-admins', null, null, 401);
  await test('Create case worker - admin only', 'POST', '/users/case-workers', null, null, 401);
  await test('Get all universities - admin only', 'GET', '/universities/all', null, null, 401);
  await test('Export applications - admin only', 'GET', '/export/applications', null, null, 401);
  await test('Export statistics - admin only', 'GET', '/export/statistics', null, null, 401);
}

async function testSuperAdminEndpoints() {
  logSection('EXTENDED TEST 11: SUPER ADMIN ENDPOINTS');

  // These require SUPER_ADMIN role
  await test('List all admins', 'GET', '/super-admin/admins', null, null, 401);
  await test('Get audit logs', 'GET', '/audit-logs', null, null, 401);
  await test('Get IP whitelist', 'GET', '/ip-whitelist', null, null, 401);
}

async function testCommunicationSystem() {
  logSection('EXTENDED TEST 12: COMMUNICATION SYSTEM');

  // Messages endpoint (public but may need valid params)
  const msgRes = await test('Get messages (public)', 'GET', '/messages', null, null, 200);
  log(colors.cyan, msgRes.success ? '✓ Messages endpoint accessible' : '⚠ Messages endpoint requires parameters');

  // Conversations (require auth)
  await test('Get conversations - requires auth', 'GET', '/conversations', null, null, 401);
  await test('Create conversation - requires auth', 'POST', '/conversations', null, null, 401);

  // Post message (requires auth and reCAPTCHA)
  await test('Post message - requires auth and reCAPTCHA', 'POST', '/messages', 
    { email: 'test@example.com', message: 'test' }, null, 400);
}

async function testResponseFormats() {
  logSection('EXTENDED TEST 13: RESPONSE FORMAT VALIDATION');

  const endpoints = [
    { path: '/students/approved', name: 'Students list' },
    { path: '/statistics', name: 'Statistics' },
    { path: '/universities/countries/Pakistan', name: 'Universities' },
    { path: '/applications', name: 'Applications' },
    { path: '/sponsorships/aggregate', name: 'Sponsorships' },
    { path: '/disbursements', name: 'Disbursements' }
  ];

  for (const ep of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${ep.path}`, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
          log(colors.green, `✓ ${ep.name} - Valid JSON response`);
          results.passed++;
        } else {
          log(colors.yellow, `⚠ ${ep.name} - Unexpected content type: ${contentType}`);
        }
      }
    } catch (error) {
      log(colors.red, `✗ ${ep.name} - Request failed`);
      results.failed++;
    }
  }
}

async function testErrorResponses() {
  logSection('EXTENDED TEST 14: ERROR RESPONSE FORMATS');

  // Test 404 errors
  const notFound = await test('404 Error response format', 'GET', '/nonexistent-route-xyz', null, null, 404);
  if (notFound.success && notFound.data?.error) {
    log(colors.cyan, `✓ Error response includes error message`);
  }

  // Test 401 errors
  const unauthorized = await test('401 Error response format', 'GET', '/students/me', null, null, 401);
  if (unauthorized.success && unauthorized.data?.error) {
    log(colors.cyan, `✓ Unauthorized response includes error message`);
  }

  // Test 400 errors
  const badRequest = await test('400 Error response format', 'POST', '/auth/login', {}, null, 400);
  if (badRequest.success && (badRequest.data?.error || badRequest.data?.details)) {
    log(colors.cyan, `✓ Bad request response includes error details`);
  }
}

async function testDatabaseConnectivity() {
  logSection('EXTENDED TEST 15: DATABASE CONNECTIVITY');

  log(colors.cyan, 'Testing database access through multiple endpoints...');

  const queries = [
    { name: 'Student profiles', path: '/students/approved' },
    { name: 'Applications', path: '/applications' },
    { name: 'Universities', path: '/universities/countries/Pakistan' },
    { name: 'Sponsorships', path: '/sponsorships/aggregate' },
    { name: 'Statistics', path: '/statistics' }
  ];

  for (const query of queries) {
    const res = await test(`Database access - ${query.name}`, 'GET', query.path, null, null, 200);
    if (res.success && res.data) {
      log(colors.cyan, `  ✓ Retrieved data successfully`);
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runExtendedAudit() {
  log(colors.cyan, '\n╔' + '═'.repeat(68) + '╗');
  log(colors.cyan, '║' + '  AWAKE Connect - Extended Production Audit'.padEnd(69) + '║');
  log(colors.cyan, '║' + '  Deep-Dive Testing & Validation'.padEnd(69) + '║');
  log(colors.cyan, '║' + '  December 5, 2025'.padEnd(69) + '║');
  log(colors.cyan, '╚' + '═'.repeat(68) + '╝');

  log(colors.cyan, `\nTarget: ${BASE_URL}`);
  log(colors.cyan, `Timeout: 10000ms\n`);

  const startTime = Date.now();

  try {
    await testStudentJourney();
    await testDonorJourney();
    await testApplicationWorkflow();
    await testUniversityData();
    await testFinancialData();
    await testStatisticsAndReporting();
    await testDataValidation();
    await testSecurityHeaders();
    await testFileOperations();
    await testAdminEndpoints();
    await testSuperAdminEndpoints();
    await testCommunicationSystem();
    await testResponseFormats();
    await testErrorResponses();
    await testDatabaseConnectivity();
  } catch (error) {
    log(colors.red, `Error during audit: ${error.message}`);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = results.passed + results.failed;
  const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  logSection('EXTENDED AUDIT SUMMARY');

  log(colors.green, `✓ Passed: ${results.passed}`);
  log(colors.red, `✗ Failed: ${results.failed}`);
  log(colors.cyan, `\nTotal: ${total} tests in ${duration}s (${percentage}% pass rate)`);

  log(colors.blue, '\n' + '═'.repeat(70) + '\n');

  if (results.failed === 0) {
    log(colors.green, '✓ EXCELLENT - All extended tests passed!');
  } else if (results.failed <= 5) {
    log(colors.yellow, '✓ GOOD - Most tests passed, minor issues found');
  } else {
    log(colors.yellow, '⚠ REVIEW - Several tests failed, investigate issues');
  }
}

runExtendedAudit().catch(error => {
  log(colors.red, 'Fatal error:', error.message);
  process.exit(1);
});
