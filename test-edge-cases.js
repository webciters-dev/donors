// Comprehensive edge case testing for student application flow
const API_BASE = "http://localhost:3001";

async function runEdgeCaseTests() {
  console.log("🔍 Running Edge Case Tests for Student Application Flow...\n");
  
  const tests = [];
  
  try {
    // Test 1: Duplicate email registration
    console.log("Test 1: Duplicate email registration");
    const dupEmail = `duplicate-test-${Date.now()}@example.com`;
    
    // Register once
    const firstReg = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First Student",
        email: dupEmail,
        password: "password123",
        gender: "M",
        university: "",
        program: "",
        country: "Pakistan",
        city: "",
        province: "",
        gpa: 0,
        gradYear: new Date().getFullYear() + 1,
        needUSD: 0,
        field: ""
      })
    });
    
    const firstResult = await firstReg.json();
    console.log("First registration:", firstResult);
    
    // Try to register again with same email
    const secondReg = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second Student",
        email: dupEmail,
        password: "password456",
        gender: "F",
        university: "",
        program: "",
        country: "Pakistan",
        city: "",
        province: "",
        gpa: 0,
        gradYear: new Date().getFullYear() + 1,
        needUSD: 0,
        field: ""
      })
    });
    
    const secondResult = await secondReg.json();
    console.log("Second registration (should update):", secondResult);
    
    // Check if login works with original password
    const loginTest = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: dupEmail, password: "password123" })
    });
    
    if (loginTest.ok) {
      const loginResult = await loginTest.json();
      console.log("✅ Login with original password still works");
      console.log("   Student name after update:", loginResult.user.name);
      tests.push("✅ Duplicate email handling: Updates student data, preserves user login");
    } else {
      tests.push("❌ Duplicate email handling: Login failed after update");
    }
    
    // Test 2: Missing required fields
    console.log("\nTest 2: Missing required fields in registration");
    const missingFieldsReg = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Missing name
        email: `missing-fields-${Date.now()}@example.com`,
        password: "password123"
      })
    });
    
    if (!missingFieldsReg.ok) {
      const missingError = await missingFieldsReg.json();
      console.log("✅ Correctly rejected missing fields:", missingError.error);
      tests.push("✅ Validation: Rejects missing required fields");
    } else {
      console.log("❌ Should have rejected missing fields");
      tests.push("❌ Validation: Accepts missing required fields (BAD)");
    }
    
    // Test 3: Invalid studentId in application submission
    console.log("\nTest 3: Invalid studentId in application");
    const validEmail = `valid-student-${Date.now()}@example.com`;
    
    // Create valid student
    const validReg = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Valid Student",
        email: validEmail,
        password: "password123",
        gender: "M",
        university: "",
        program: "",
        country: "Pakistan",
        city: "",
        province: "",
        gpa: 0,
        gradYear: new Date().getFullYear() + 1,
        needUSD: 0,
        field: ""
      })
    });
    
    const validRegResult = await validReg.json();
    
    // Login to get token
    const validLogin = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: validEmail, password: "password123" })
    });
    
    const validLoginResult = await validLogin.json();
    const { token } = validLoginResult;
    
    // Try to create application with wrong studentId
    const invalidAppResponse = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId: "fake-student-id",
        term: "Fall 2025",
        currency: "PKR",
        needPKR: 100000
      })
    });
    
    if (!invalidAppResponse.ok) {
      const invalidAppError = await invalidAppResponse.json();
      console.log("✅ Correctly rejected invalid studentId:", invalidAppError.error);
      tests.push("✅ Security: Rejects invalid studentId in application");
    } else {
      console.log("❌ Should have rejected invalid studentId");
      tests.push("❌ Security: Accepts invalid studentId (BAD)");
    }
    
    // Test 4: ApplicationForm field validation scenarios
    console.log("\nTest 4: Field validation scenarios");
    
    // Test empty university field in student update
    const emptyUnivResponse = await fetch(`${API_BASE}/api/students/${validRegResult.studentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        university: "", // Empty university
        program: "Computer Science",
        gpa: 3.5,
        gradYear: 2027,
        field: "CS"
      })
    });
    
    if (emptyUnivResponse.ok) {
      console.log("✅ Accepts empty university (allows incremental updates)");
      tests.push("✅ Flexibility: Allows empty university in profile updates");
    } else {
      const emptyUnivError = await emptyUnivResponse.json();
      console.log("❌ Rejects empty university:", emptyUnivError.error);
      tests.push("❌ Flexibility: Rejects empty university (may be too strict)");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 EDGE CASE TEST RESULTS:");
    tests.forEach(test => console.log(test));
    
    // Overall assessment
    const passed = tests.filter(t => t.startsWith("✅")).length;
    const failed = tests.filter(t => t.startsWith("❌")).length;
    
    console.log(`\n🎯 Overall: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log("🎉 All edge case tests passed! Student application flow is robust.");
    } else {
      console.log("⚠️ Some edge cases need attention. Review failed tests above.");
    }
    
  } catch (error) {
    console.error("\n❌ Edge case testing failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the edge case tests
runEdgeCaseTests();