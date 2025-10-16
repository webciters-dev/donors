// Simple file upload test
import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { Blob } from 'buffer';
import { fileFromPath } from 'formdata-node/file-from-path';
import fs from 'fs';

const API_BASE = "http://localhost:3001";

async function testFileUpload() {
  try {
    console.log("Testing file upload...");
    
    // Create a simple test file
    const testContent = "This is a test file for upload functionality testing.";
    const testFilePath = "test-upload-simple.txt";
    fs.writeFileSync(testFilePath, testContent);
    
    // Login to get token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "comprehensive.test@example.com",
        password: "TestPass123"
      })
    });
    
    if (!loginResponse.ok) {
      console.log("❌ Login failed for file upload test");
      return;
    }
    
    const loginData = await loginResponse.json();
    const { token } = loginData;
    const studentId = loginData.user.studentId; // Get the actual studentId for this user
    
    // Create FormData with file
    const form = new FormData();
    const file = await fileFromPath(testFilePath, "test-upload-simple.txt", { type: "text/plain" });
    form.set('file', file);
    form.set('studentId', studentId); // Use the actual studentId from login
    form.set('docType', 'OTHER');
    form.set('description', 'Test file upload');
    
    // Upload file
    const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: form
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log("✅ File upload: SUCCESS");
      console.log("   Response:", JSON.stringify(result, null, 2));
    } else {
      const error = await uploadResponse.text();
      console.log("❌ File upload: FAILED");
      console.log("   Status:", uploadResponse.status);
      console.log("   Error:", error);
    }
    
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
  } catch (error) {
    console.error("❌ File upload test error:", error.message);
  }
}

testFileUpload();