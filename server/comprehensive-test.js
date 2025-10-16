// Comprehensive system test
import fetch from 'node-fetch';

const API_BASE = "http://localhost:3001";

async function runSystemTests() {
  console.log("🧪 Running Comprehensive System Tests...\n");
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  const test = async (name, testFn) => {
    try {
      console.log(`Testing: ${name}`);
      const result = await testFn();
      if (result) {
        console.log(`✅ ${name}: PASS`);
        testsPassed++;
      } else {
        console.log(`❌ ${name}: FAIL`);
        testsFailed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      testsFailed++;
    }
    console.log(""); // spacing
  };

  // Test 1: Health Check
  await test("Backend Health Check", async () => {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  });

  // Test 2: Student Registration
  let studentToken = null;
  await test("Student Registration", async () => {
    const response = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Comprehensive Test Student",
        email: "comprehensive.test@example.com",
        password: "TestPass123",
        gender: "M",
        personalIntroduction: "Test profile for comprehensive testing",
        university: "", program: "", country: "Pakistan",
        city: "", province: "", gpa: 0,
        gradYear: new Date().getFullYear() + 1,
        needUSD: 0, field: ""
      })
    });
    return response.ok;
  });

  // Test 3: Student Login
  let studentId = null;
  await test("Student Login", async () => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "comprehensive.test@example.com",
        password: "TestPass123"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      studentToken = data.token;
      studentId = data.user.studentId; // Capture the actual studentId
      return true;
    }
    return false;
  });

  // Test 4: JWT Token Validation
  await test("JWT Token Validation", async () => {
    if (!studentToken) return false;
    
    const parts = studentToken.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.role === "STUDENT" && payload.exp > Date.now() / 1000;
  });

  // Test 5: Protected Route Access
  await test("Protected Route Access", async () => {
    if (!studentToken) return false;
    
    const response = await fetch(`${API_BASE}/api/profile`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    return response.ok;
  });

  // Test 6: Role-Based Access Control
  await test("Role-Based Access Control", async () => {
    if (!studentToken) return false;
    
    // Student should NOT have access to admin routes
    const response = await fetch(`${API_BASE}/api/users`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    return response.status === 403; // Forbidden is expected
  });

  // Test 7: Application Creation
  let applicationId = null;
  await test("Application Creation", async () => {
    if (!studentToken || !studentId) return false;
    
    const response = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}` 
      },
      body: JSON.stringify({
        studentId: studentId, // Use the actual studentId from login
        term: "Fall 2025",
        currency: "USD",
        universityFee: 20000,
        livingExpenses: 15000,
        totalExpense: 35000,
        scholarshipAmount: 10000,
        needUSD: 25000
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      applicationId = data.id;
      return true;
    }
    return false;
  });

  // Test 8: Data Retrieval
  await test("Application Data Retrieval", async () => {
    if (!studentToken) return false;
    
    const response = await fetch(`${API_BASE}/api/applications`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    return response.ok;
  });

  console.log("📊 Test Results Summary:");
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! System is functioning correctly.");
  } else {
    console.log(`\n⚠️  ${testsFailed} tests failed. See details above.`);
  }
}

runSystemTests().catch(console.error);