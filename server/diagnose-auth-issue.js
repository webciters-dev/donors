// Check the current state of authentication for the problematic sub-admin
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || '8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0';

async function diagnoseAuthIssue() {
  try {
    console.log('🔍 Diagnosing authentication issue...');
    
    // Check the specific sub-admin that's having issues
    const subAdmin = await prisma.user.findFirst({
      where: { 
        email: 'test+32@webciters.com',
        role: 'SUB_ADMIN' 
      }
    });
    
    if (!subAdmin) {
      console.log('❌ Sub-admin not found!');
      return;
    }
    
    console.log('✅ Sub-admin found:', {
      id: subAdmin.id,
      name: subAdmin.name, 
      email: subAdmin.email,
      role: subAdmin.role,
      createdAt: subAdmin.createdAt
    });
    
    // Create a proper JWT token with 'sub' (not 'userId')
    const correctToken = jwt.sign({
      sub: subAdmin.id,        // ← Using 'sub' as expected by middleware
      role: subAdmin.role,
      email: subAdmin.email
    }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('\n🔑 Correct JWT token format:');
    console.log('Token:', correctToken);
    
    // Decode and verify
    const decoded = jwt.verify(correctToken, JWT_SECRET);
    console.log('Decoded payload:', decoded);
    
    // Test this token with the API
    console.log('\n📡 Testing corrected token with API...');
    const response = await fetch('http://localhost:3001/api/field-reviews', {
      headers: {
        'Authorization': `Bearer ${correctToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success: Found ${data.reviews?.length || 0} reviews`);
    } else {
      const error = await response.text();
      console.log(`❌ Failed: ${error}`);
    }
    
    // Show what a bad token looks like
    console.log('\n🚫 What happens with wrong format (userId instead of sub):');
    const badToken = jwt.sign({
      userId: subAdmin.id,     // ← Wrong field name
      role: subAdmin.role,
      email: subAdmin.email
    }, JWT_SECRET, { expiresIn: '7d' });
    
    const badResponse = await fetch('http://localhost:3001/api/field-reviews', {
      headers: {
        'Authorization': `Bearer ${badToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Bad token API Response: ${badResponse.status} ${badResponse.statusText}`);
    
    if (!badResponse.ok) {
      const error = await badResponse.text();
      console.log(`❌ Error with bad token: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAuthIssue();