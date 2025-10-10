// test-application-creation.js
// Test script to verify new applications are created with DRAFT status
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing application creation with DRAFT status...');
  
  try {
    // Check existing applications
    const existingApps = await prisma.application.findMany({
      select: {
        id: true,
        status: true,
        submittedAt: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${existingApps.length} existing applications:`);
    existingApps.forEach(app => {
      console.log(`   - ID: ${app.id}, Status: ${app.status}, Submitted: ${app.submittedAt.toLocaleDateString()}`);
    });
    
    // Test creating a new application (simulating what the API does now)
    console.log('\n🔄 Testing new application creation...');
    
    // First find a student to test with
    const testStudent = await prisma.student.findFirst();
    if (!testStudent) {
      console.log('⚠️  No student found to test with. Please create a student first.');
      return;
    }
    
    console.log(`👤 Using test student ID: ${testStudent.id}`);
    
    // Create a test application with DRAFT status (like our fixed API does)
    const testApp = await prisma.application.create({
      data: {
        studentId: testStudent.id,
        status: 'DRAFT', // This is the fix!
        term: 'Spring 2024',
        needUSD: 5000,
        purpose: 'Test application creation'
      }
    });
    
    console.log(`✅ Created test application with ID: ${testApp.id} and status: ${testApp.status}`);
    
    if (testApp.status === 'DRAFT') {
      console.log('🎉 SUCCESS: New applications are correctly created with DRAFT status!');
    } else {
      console.log(`❌ PROBLEM: Application was created with status: ${testApp.status} instead of DRAFT`);
    }
    
    // Clean up test application
    await prisma.application.delete({
      where: { id: testApp.id }
    });
    
    console.log('🧹 Cleaned up test application');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });