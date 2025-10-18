import prisma from './src/prismaClient.js';

async function safelyTestStudentPhase() {
  try {
    console.log('🔍 Testing StudentPhase system safely...');
    
    // Test 1: Check if we can read existing students (should work with or without migration)
    console.log('\n1️⃣ Testing existing student data access...');
    const existingStudents = await prisma.student.findMany({
      select: { 
        id: true, 
        name: true, 
        sponsored: true,
        // studentPhase: true // This will only work after migration
      },
      take: 3
    });
    console.log(`✅ Successfully read ${existingStudents.length} existing students`);
    
    // Test 2: Check current applications
    console.log('\n2️⃣ Testing applications data...');
    const applications = await prisma.application.findMany({
      select: { id: true, name: true, status: true },
      take: 3
    });
    console.log(`✅ Successfully read ${applications.length} applications`);
    
    // Test 3: Check sponsorships (critical for donor dashboard)
    console.log('\n3️⃣ Testing sponsorship data...');
    const sponsorships = await prisma.sponsorship.findMany({
      select: { id: true, amount: true },
      take: 3
    });
    console.log(`✅ Successfully read ${sponsorships.length} sponsorships`);
    
    console.log('\n✅ ALL EXISTING DATA ACCESSIBLE - SAFE TO PROCEED');
    
  } catch (error) {
    console.error('\n❌ ERROR ACCESSING EXISTING DATA:', error.message);
    console.log('\n🚨 DO NOT PROCEED WITH MIGRATION UNTIL FIXED');
  } finally {
    await prisma.$disconnect();
  }
}

safelyTestStudentPhase();