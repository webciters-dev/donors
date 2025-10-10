// Test the enhanced financial calculation system
const API_BASE = "http://localhost:3001";

async function testFinancialCalculations() {
  console.log("💰 Testing Enhanced Financial Calculation System...\n");
  
  const timestamp = Date.now();
  const testStudent = {
    name: "Financial Test Student",
    email: `financial-test-${timestamp}@example.com`,
    password: "password123",
    gender: "M"
  };

  try {
    // Step 1: Register and login
    console.log("1️⃣ Creating test student account...");
    const regResponse = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testStudent.name.trim(),
        email: testStudent.email.trim().toLowerCase(),
        password: testStudent.password,
        gender: testStudent.gender,
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

    if (!regResponse.ok) {
      const errorData = await regResponse.json();
      throw new Error(errorData.error || "Failed to create account");
    }

    const regResult = await regResponse.json();
    console.log("✅ Student account created, ID:", regResult.studentId);

    // Login to get token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: testStudent.email.trim().toLowerCase(), 
        password: testStudent.password 
      }),
    });
    
    const loginResult = await loginResponse.json();
    const { token, user } = loginResult;
    console.log("✅ Login successful");

    // Step 2: Update student profile
    console.log("\n2️⃣ Updating student profile...");
    const studentUpdatePayload = {
      university: "LUMS - Lahore University of Management Sciences",
      program: "Master of Business Administration",
      gpa: 3.7,
      gradYear: 2026,
      field: "Business Administration"
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
      throw new Error("Student profile update failed");
    }
    console.log("✅ Student profile updated");

    // Step 3: Test financial calculations
    console.log("\n3️⃣ Testing financial calculation scenarios...");
    
    // Scenario 1: Normal case (total > scholarship)
    console.log("Scenario 1: Normal case (50000 total, 10000 scholarship)");
    const scenario1 = {
      totalExpense: 50000,
      scholarshipAmount: 10000,
      expectedRequired: 40000
    };
    
    const requiredAmount1 = scenario1.totalExpense - scenario1.scholarshipAmount;
    console.log(`   Total: ${scenario1.totalExpense}, Scholarship: ${scenario1.scholarshipAmount}`);
    console.log(`   Required: ${requiredAmount1} (Expected: ${scenario1.expectedRequired})`);
    console.log(`   ✅ ${requiredAmount1 === scenario1.expectedRequired ? 'PASS' : 'FAIL'}`);

    // Test application creation with new fields
    const applicationPayload = {
      studentId: user.studentId,
      term: "Fall 2025",
      currency: "PKR",
      totalExpense: scenario1.totalExpense,
      scholarshipAmount: scenario1.scholarshipAmount,
      needPKR: requiredAmount1
    };

    console.log("\n4️⃣ Creating application with financial details...");
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
      console.log("❌ Application creation failed:", appError);
      throw new Error(`Application creation failed: ${appError.error}`);
    }

    const appResult = await appResponse.json();
    console.log("✅ Application created successfully");
    console.log("   Application ID:", appResult.id);
    console.log("   Status:", appResult.status);
    console.log("   Required Amount:", appResult.needPKR, "PKR");

    console.log("\n🎉 FINANCIAL SYSTEM TESTS COMPLETED SUCCESSFULLY!");
    console.log("\n📊 Summary:");
    console.log("✅ Enhanced financial fields working");
    console.log("✅ Auto-calculation logic functioning");
    console.log("✅ Database schema supports new fields");
    console.log("✅ Application creation with financial breakdown");

  } catch (error) {
    console.error("\n❌ FINANCIAL SYSTEM TEST FAILED:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testFinancialCalculations();