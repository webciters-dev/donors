// Simple upload test from server directory
import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import fs from 'fs';

const API_BASE = "http://localhost:3001";

async function testUpload() {
  try {
    console.log(" Testing upload functionality...");
    
    // Create a simple test file
    const testContent = "This is a test file for debugging uploads.";
    fs.writeFileSync("debug-upload.txt", testContent);
    
    // Test 1: Check if server is responding
    console.log("\n1. Testing server health...");
    const healthRes = await fetch(`${API_BASE}/api/health`);
    console.log(`   Server health: ${healthRes.status}`);
    
    // Test 2: Try login first
    console.log("\n2. Getting authentication token...");  
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test+3@webciters.com",
        password: "Roger1234"
      })
    });
    
    if (!loginRes.ok) {
      console.log(`    Login failed: ${loginRes.status}`);
      const errorText = await loginRes.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log(`    Login success`);
    console.log(`   User: ${loginData.user?.email} (${loginData.user?.role})`);
    console.log(`   StudentId: ${loginData.user?.studentId}`);
    
    // Test 3: Try file upload
    console.log("\n3. Testing file upload...");
    const form = new FormData();
    const fileBuffer = fs.readFileSync('debug-upload.txt');
    const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
    form.set('file', fileBlob, 'debug-upload.txt');
    form.set('studentId', loginData.user.studentId);
    form.set('type', 'OTHER');
    
    const uploadRes = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${loginData.token}`
      },
      body: form
    });
    
    console.log(`   Upload response status: ${uploadRes.status}`);
    
    if (uploadRes.ok) {
      const result = await uploadRes.json();
      console.log(`    Upload SUCCESS`);
      console.log(`   Document ID: ${result.document?.id}`);
      console.log(`   File URL: ${result.document?.url}`);
    } else {
      const errorText = await uploadRes.text();
      console.log(`    Upload FAILED`);
      console.log(`   Error: ${errorText}`);
    }
    
    // Cleanup
    fs.unlinkSync("debug-upload.txt");
    
  } catch (error) {
    console.error(" Test error:", error.message);
  }
}

testUpload();