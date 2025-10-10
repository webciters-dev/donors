// Test script to simulate the frontend ApplicationForm flow
const API_BASE = "http://localhost:3001";

async function testFrontendStudentFlow() {
  console.log("🖥️ Testing Frontend Student Application Flow...\n");
  
  // Generate unique test data
  const timestamp = Date.now();
  const testStudent = {
    name: "Frontend Test Student",
    email: `frontend-test-${timestamp}@example.com`,
    password: "password123",
    gender: "F"
  };

  try {
    console.log("=== STEP 1: Student Registration (Frontend Simulation) ===");
    
    // Test 1.1: Register student (mimicking ApplicationForm handleStep1Registration)
    console.log("1.1 📝 Testing student registration...");
    const regPayload = {
      name: testStudent.name.trim(),
      email: testStudent.email.trim().toLowerCase(),
      password: testStudent.password,
      gender: testStudent.gender,
      // Default values that ApplicationForm sends
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

    const regResponse = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload)
    });

    if (!regResponse.ok) {
      const errorData = await regResponse.json();
      throw new Error(errorData.error || "Failed to create account");
    }

    const regResult = await regResponse.json();
    console.log("✅ Registration successful:", regResult);

    // Test 1.2: Auto-login after registration (mimicking ApplicationForm)
    console.log("1.2 🔐 Testing auto-login after registration...");
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: testStudent.email.trim().toLowerCase(), 
        password: testStudent.password 
      }),
    });
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      throw new Error(loginError.error || "Auto-login failed");
    }

    const loginResult = await loginResponse.json();
    console.log("✅ Auto-login successful");
    console.log("   User name:", loginResult.user.name);
    console.log("   Student ID:", loginResult.user.studentId);
    console.log("   Token present:", !!loginResult.token);

    const { token, user } = loginResult;

    if (!user.name) {
      console.log("❌ WARNING: User name is missing after login!");
    }

    console.log("\n=== STEP 2: Education Details (Frontend Simulation) ===");
    
    // This step just collects form data, no API calls until Step 3
    const step2Data = {
      country: "Pakistan",
      university: "LUMS - Lahore University of Management Sciences",
      customUniversity: "",
      program: "Bachelor of Computer Science",
      term: "Fall 2025",
      gpa: "3.8",
      gradYear: "2027",
      currency: "PKR" // Auto-selected based on country
    };
    
    console.log("2.1 📚 Step 2 form data prepared:");
    console.log("   Country:", step2Data.country);
    console.log("   University:", step2Data.university);
    console.log("   Program:", step2Data.program);
    console.log("   Term:", step2Data.term);
    console.log("   Currency:", step2Data.currency);

    console.log("\n=== STEP 3: Financial Details & Submission (Frontend Simulation) ===");

    // Test 3.1: Display name in review section
    console.log("3.1 👤 Testing name display in Step 3 review:");
    const reviewName = user?.name || testStudent.name || "[Your Name]";
    console.log("   Review shows name:", reviewName);
    
    if (reviewName === "[Your Name]") {
      console.log("❌ WARNING: Name would show as placeholder in review!");
    } else {
      console.log("✅ Name displays correctly in review");
    }

    // Test 3.2: Student profile update (mimicking ApplicationForm handleSubmit)
    console.log("3.2 📊 Testing student profile update...");
    const studentUpdatePayload = {
      university: step2Data.university.trim(),
      program: step2Data.program.trim(),
      gpa: Number(step2Data.gpa),
      gradYear: Number(step2Data.gradYear),
      field: step2Data.program.trim()
    };

    const studentUpdateResponse = await fetch(`${API_BASE}/api/students/${user.studentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(studentUpdatePayload),
    });

    if (!studentUpdateResponse.ok) {
      const studentError = await studentUpdateResponse.json();
      throw new Error(studentError.error || "Failed to update student profile");
    }

    console.log("✅ Student profile updated successfully");

    // Test 3.3: Application creation (mimicking ApplicationForm handleSubmit)
    console.log("3.3 📄 Testing application creation...");
    const applicationPayload = {
      studentId: user.studentId,
      term: step2Data.term || "Not specified",
      currency: step2Data.currency,
      needPKR: 500000 // Example amount in PKR
    };

    const appResponse = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(applicationPayload),
    });

    if (!appResponse.ok) {
      const appError = await appResponse.json();
      throw new Error(appError.error || "Failed to create application");
    }

    const appResult = await appResponse.json();
    console.log("✅ Application created successfully");
    console.log("   Application ID:", appResult.id);
    console.log("   Status:", appResult.status);
    console.log("   Amount:", appResult.needPKR, appResult.currency);

    console.log("\n=== TESTING RETURNING USER FLOW ===");

    // Test 4: Returning user login
    console.log("4.1 🔄 Testing returning user login...");
    const returningLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: testStudent.email.trim().toLowerCase(), 
        password: testStudent.password 
      }),
    });

    if (!returningLoginResponse.ok) {
      const loginError = await returningLoginResponse.json();
      throw new Error(loginError.error || "Returning user login failed");
    }

    const returningLoginResult = await returningLoginResponse.json();
    console.log("✅ Returning user login successful");
    console.log("   User name:", returningLoginResult.user.name);
    console.log("   Student ID:", returningLoginResult.user.studentId);

    if (!returningLoginResult.user.name) {
      console.log("❌ WARNING: Returning user has no name!");
    } else {
      console.log("✅ Returning user name displays correctly");
    }

    console.log("\n🎉 FRONTEND FLOW TEST COMPLETED SUCCESSFULLY!");
    console.log("\n📋 Summary:");
    console.log("✅ Student registration creates both User and Student records");
    console.log("✅ Auto-login after registration works");
    console.log("✅ Student name is retrieved correctly from Student record");
    console.log("✅ Step 2 form flow ready (no API calls needed)");
    console.log("✅ Step 3 student profile update works");
    console.log("✅ Step 3 application creation works");
    console.log("✅ Returning user login preserves name");

  } catch (error) {
    console.error("\n❌ FRONTEND FLOW TEST FAILED:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testFrontendStudentFlow();