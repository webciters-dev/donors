// Test script to verify student application flow
const API_BASE = "http://localhost:3001";

async function testStudentFlow() {
  console.log("🧪 Testing Student Application Flow...\n");
  
  // Test data
  const testStudent = {
    name: "Test Student Flow",
    email: `test-flow-${Date.now()}@example.com`,
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
  };

  try {
    // Step 1: Test Student Registration
    console.log("1️⃣ Testing Student Registration...");
    const regResponse = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testStudent)
    });
    
    const regResult = await regResponse.json();
    console.log("Registration result:", regResult);
    
    if (!regResponse.ok) {
      throw new Error(`Registration failed: ${regResult.error}`);
    }
    
    const studentId = regResult.studentId;
    console.log("✅ Registration successful, studentId:", studentId);
    
    // Step 2: Test Login
    console.log("\n2️⃣ Testing Login...");
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudent.email,
        password: testStudent.password
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log("Login result:", loginResult);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    
    const { token, user } = loginResult;
    console.log("✅ Login successful");
    console.log("User object:", user);
    console.log("Token present:", !!token);
    console.log("User has studentId:", !!user.studentId);
    console.log("User has name:", !!user.name);
    
    // Step 3: Test Student Profile Update
    console.log("\n3️⃣ Testing Student Profile Update...");
    const updatePayload = {
      university: "LUMS - Lahore University of Management Sciences",
      program: "Bachelor of Computer Science",
      gpa: 3.8,
      gradYear: 2027,
      field: "Computer Science"
    };
    
    const updateResponse = await fetch(`${API_BASE}/api/students/${user.studentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updatePayload)
    });
    
    if (!updateResponse.ok) {
      const updateError = await updateResponse.json();
      console.log("❌ Update failed:", updateError);
      throw new Error(`Student update failed: ${updateError.error}`);
    }
    
    console.log("✅ Student profile updated successfully");
    
    // Step 4: Test Application Creation
    console.log("\n4️⃣ Testing Application Creation...");
    const appPayload = {
      studentId: user.studentId,
      term: "Fall 2025",
      currency: "PKR",
      needPKR: 500000
    };
    
    const appResponse = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(appPayload)
    });
    
    if (!appResponse.ok) {
      const appError = await appResponse.json();
      console.log("❌ Application creation failed:", appError);
      throw new Error(`Application creation failed: ${appError.error}`);
    }
    
    const appResult = await appResponse.json();
    console.log("✅ Application created successfully");
    console.log("Application result:", appResult);
    
    console.log("\n🎉 All tests passed! Student application flow is working correctly.");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testStudentFlow();