#!/usr/bin/env node
/**
 * AWAKE Connect - Production Readiness Test Suite
 * Comprehensive endpoint testing and validation
 * December 6, 2025
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_TIMEOUT = 10000;

// Test results tracking
let testResults = {
  startTime: new Date().toISOString(),
  categories: {},
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function recordTest(category, testName, passed, details = '') {
  if (!testResults.categories[category]) {
    testResults.categories[category] = {
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  testResults.categories[category].tests.push({
    name: testName,
    passed,
    details
  });

  testResults.categories[category].total++;
  testResults.summary.total++;

  if (passed) {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
    log(colors.green, `  ✅ ${testName}`);
  } else {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    log(colors.red, `  ❌ ${testName}: ${details}`);
  }
}

async function testHealthCheck() {
  logSection('HEALTH CHECK TEST');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: TEST_TIMEOUT });
    recordTest('health', 'Health endpoint responds', response.status === 200 && response.data.ok);
  } catch (err) {
    recordTest('health', 'Health endpoint responds', false, err.message);
  }
}

async function testAuthentication() {
  logSection('AUTHENTICATION ENDPOINT TESTS');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authToken = null;

  // Test registration
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'STUDENT'
    }, { timeout: TEST_TIMEOUT });

    const passed = response.status === 200 && response.data.token;
    recordTest('auth', 'Registration endpoint works', passed);
    
    if (passed) {
      authToken = response.data.token;
    }
  } catch (err) {
    recordTest('auth', 'Registration endpoint works', false, err.response?.data?.error || err.message);
  }

  // Test login
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    }, { timeout: TEST_TIMEOUT });

    const passed = response.status === 200 && response.data.token;
    recordTest('auth', 'Login endpoint works', passed);
    
    if (passed) {
      authToken = response.data.token;
      
      // Verify token structure
      const tokenParts = authToken.split('.');
      recordTest('auth', 'JWT token has 3 parts', tokenParts.length === 3);
      
      // Verify token includes required data
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      recordTest('auth', 'Token includes user ID', !!payload.sub);
      recordTest('auth', 'Token includes role', payload.role === 'STUDENT');
      recordTest('auth', 'Token includes email', payload.email === testEmail);
    }
  } catch (err) {
    recordTest('auth', 'Login endpoint works', false, err.response?.data?.error || err.message);
  }

  // Test duplicate registration
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'STUDENT'
    }, { timeout: TEST_TIMEOUT });
    
    recordTest('auth', 'Duplicate registration rejected', false, 'Should have returned 409');
  } catch (err) {
    recordTest('auth', 'Duplicate registration rejected', err.response?.status === 409);
  }

  // Test invalid credentials
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'wrongpassword'
    }, { timeout: TEST_TIMEOUT });
    
    recordTest('auth', 'Invalid credentials rejected', false, 'Should have returned 401');
  } catch (err) {
    recordTest('auth', 'Invalid credentials rejected', err.response?.status === 401);
  }

  return authToken;
}

async function testAuthorization(authToken) {
  logSection('AUTHORIZATION TESTS');

  if (!authToken) {
    log(colors.yellow, '⚠️  Skipping authorization tests (no auth token)');
    return;
  }

  // Test protected endpoint without token
  try {
    const response = await axios.get(`${BASE_URL}/students`, { timeout: TEST_TIMEOUT });
    recordTest('authz', 'Protected endpoint blocks unauthenticated access', false, 'Should have returned 401');
  } catch (err) {
    recordTest('authz', 'Protected endpoint blocks unauthenticated access', err.response?.status === 401);
  }

  // Test protected endpoint with invalid token
  try {
    const response = await axios.get(`${BASE_URL}/students`, {
      headers: { Authorization: 'Bearer invalid_token' },
      timeout: TEST_TIMEOUT
    });
    recordTest('authz', 'Invalid token rejected', false, 'Should have returned 401');
  } catch (err) {
    recordTest('authz', 'Invalid token rejected', err.response?.status === 401);
  }

  // Test protected endpoint with valid token
  try {
    const response = await axios.get(`${BASE_URL}/student`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });
    
    const passed = response.status === 200 && response.data.id;
    recordTest('authz', 'Protected endpoint allows authenticated access', passed);
  } catch (err) {
    recordTest('authz', 'Protected endpoint allows authenticated access', false, err.message);
  }

  // Test role-based access (STUDENT trying to access ADMIN-only endpoint)
  try {
    const response = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });
    recordTest('authz', 'Role-based access control enforced', false, 'Should have returned 403');
  } catch (err) {
    recordTest('authz', 'Role-based access control enforced', err.response?.status === 403);
  }
}

async function testDatabaseOperations(authToken) {
  logSection('DATABASE OPERATIONS TESTS');

  if (!authToken) {
    log(colors.yellow, '⚠️  Skipping database tests (no auth token)');
    return;
  }

  // Test Create: Create student profile
  try {
    const response = await axios.put(`${BASE_URL}/student`, {
      name: 'Test Student',
      email: 'test@example.com',
      gender: 'Male',
      university: 'Test University',
      field: 'Computer Science',
      program: 'BS',
      gpa: 3.5,
      gradYear: 2025,
      country: 'Pakistan'
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });

    recordTest('db', 'Create operation works', response.status === 200);
  } catch (err) {
    recordTest('db', 'Create operation works', false, err.response?.data?.error || err.message);
  }

  // Test Read: Get student profile
  try {
    const response = await axios.get(`${BASE_URL}/student`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });

    const passed = response.status === 200 && response.data.id;
    recordTest('db', 'Read operation works', passed);
    recordTest('db', 'Data returned correctly', response.data.name === 'Test Student');
  } catch (err) {
    recordTest('db', 'Read operation works', false, err.message);
  }

  // Test Update: Modify student profile
  try {
    const response = await axios.put(`${BASE_URL}/student`, {
      name: 'Updated Student Name',
      gpa: 3.7
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });

    recordTest('db', 'Update operation works', response.status === 200);
    
    // Verify update was persisted
    const verifyResponse = await axios.get(`${BASE_URL}/student`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });
    
    recordTest('db', 'Update persisted to database', verifyResponse.data.name === 'Updated Student Name');
  } catch (err) {
    recordTest('db', 'Update operation works', false, err.message);
  }
}

async function testUserJourneys(authToken) {
  logSection('USER JOURNEY TESTS');

  if (!authToken) {
    log(colors.yellow, '⚠️  Skipping user journey tests (no auth token)');
    return;
  }

  // Student Journey: Register → Update Profile → Check Data
  try {
    // Get profile
    const getResponse = await axios.get(`${BASE_URL}/student`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: TEST_TIMEOUT
    });

    const hasProfileData = getResponse.data.id && getResponse.data.email;
    recordTest('journey', 'Student complete journey', hasProfileData);
  } catch (err) {
    recordTest('journey', 'Student complete journey', false, err.message);
  }

  // Test public endpoints (no auth required)
  try {
    const response = await axios.get(`${BASE_URL}/universities`, { timeout: TEST_TIMEOUT });
    recordTest('journey', 'Public endpoints accessible', response.status === 200);
  } catch (err) {
    recordTest('journey', 'Public endpoints accessible', false, err.message);
  }
}

async function testErrorHandling() {
  logSection('ERROR HANDLING TESTS');

  // Test 404 Not Found
  try {
    const response = await axios.get(`${BASE_URL}/nonexistent`, { timeout: TEST_TIMEOUT });
    recordTest('errors', '404 returned for non-existent routes', false, 'Should have returned 404');
  } catch (err) {
    recordTest('errors', '404 returned for non-existent routes', err.response?.status === 404);
  }

  // Test invalid method
  try {
    const response = await axios.get(`${BASE_URL}/auth/register`, { timeout: TEST_TIMEOUT });
    // POST endpoint called with GET, should fail
    recordTest('errors', 'Invalid HTTP method rejected', response.status === 404);
  } catch (err) {
    recordTest('errors', 'Invalid HTTP method rejected', err.response?.status === 404);
  }

  // Test missing required fields
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@example.com'
      // password missing
    }, { timeout: TEST_TIMEOUT });
    recordTest('errors', 'Missing required fields rejected', false, 'Should have returned 400');
  } catch (err) {
    recordTest('errors', 'Missing required fields rejected', err.response?.status === 400);
  }
}

async function testResponseFormats(authToken) {
  logSection('RESPONSE FORMAT TESTS');

  // Test successful response format
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, { timeout: TEST_TIMEOUT });
  } catch (err) {
    const errorData = err.response?.data;
    recordTest('format', 'Error responses include message', !!errorData?.error);
  }

  // Test paginated response format
  if (authToken) {
    try {
      const response = await axios.get(`${BASE_URL}/universities?limit=10&page=1`, {
        timeout: TEST_TIMEOUT
      });

      recordTest('format', 'Paginated responses return data', Array.isArray(response.data));
    } catch (err) {
      recordTest('format', 'Paginated responses return data', false, err.message);
    }
  }
}

async function runAllTests() {
  try {
    console.clear();
    logSection('AWAKE Connect - Production Readiness Audit Test Suite');
    log(colors.cyan, `Starting comprehensive tests at ${new Date().toISOString()}`);
    log(colors.cyan, `API Base URL: ${BASE_URL}\n`);

    // Run all test suites
    await testHealthCheck();
    const authToken = await testAuthentication();
    await testAuthorization(authToken);
    await testDatabaseOperations(authToken);
    await testUserJourneys(authToken);
    await testErrorHandling();
    await testResponseFormats(authToken);

    // Print results summary
    logSection('TEST RESULTS SUMMARY');
    
    for (const [category, results] of Object.entries(testResults.categories)) {
      const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
      log(colors.cyan, `${category.toUpperCase()}: ${results.passed}/${results.total} passed (${percentage}%)`);
    }

    console.log();
    const overallPercentage = testResults.summary.total > 0 
      ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) 
      : 0;
    
    if (overallPercentage === 100) {
      log(colors.green, `✅ OVERALL: ${testResults.summary.passed}/${testResults.summary.total} tests passed (${overallPercentage}%)`);
    } else if (overallPercentage >= 90) {
      log(colors.yellow, `⚠️  OVERALL: ${testResults.summary.passed}/${testResults.summary.total} tests passed (${overallPercentage}%)`);
    } else {
      log(colors.red, `❌ OVERALL: ${testResults.summary.passed}/${testResults.summary.total} tests passed (${overallPercentage}%)`);
    }

    testResults.endTime = new Date().toISOString();
    testResults.passed = testResults.summary.passed;
    testResults.failed = testResults.summary.failed;
    testResults.total = testResults.summary.total;
    testResults.successRate = overallPercentage;

    // Save results to file
    const reportPath = path.join(process.cwd(), 'server', 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    log(colors.cyan, `\nTest results saved to: ${reportPath}\n`);

    process.exit(overallPercentage === 100 ? 0 : 1);

  } catch (err) {
    log(colors.red, `Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run tests
runAllTests();
