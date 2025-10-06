// test-subadmin-debug.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugSubAdminLogin() {
  try {
    console.log('🔍 Debugging Sub-Admin Login Issues...\n');
    
    // 1. Check all users in database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        name: true,
        isActive: true
      }
    });
    
    console.log('📊 All Users in Database:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}, Name: ${user.name || 'N/A'}`);
    });
    
    // 2. Check field officers specifically
    const fieldOfficers = await prisma.user.findMany({
      where: { role: 'FIELD_OFFICER' },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('\n🎯 Field Officers:');
    if (fieldOfficers.length === 0) {
      console.log('  No field officers found!');
    } else {
      fieldOfficers.forEach(fo => {
        console.log(`  - Email: ${fo.email}, Name: ${fo.name}, Active: ${fo.isActive}`);
        console.log(`    Password Hash: ${fo.password ? 'EXISTS' : 'MISSING'}`);
        console.log(`    Created: ${fo.createdAt}`);
      });
    }
    
    // 3. If we have field officers, test login simulation
    if (fieldOfficers.length > 0) {
      const testFO = fieldOfficers[0];
      console.log(`\n🧪 Testing login simulation for: ${testFO.email}`);
      
      // Test with a known password (this won't work but shows the process)
      const testPassword = 'TestPass123!';
      try {
        const isValid = await bcrypt.compare(testPassword, testFO.password);
        console.log(`  Password '${testPassword}' matches: ${isValid}`);
      } catch (error) {
        console.log(`  Error comparing password: ${error.message}`);
      }
    }
    
    // 4. Check for any constraints or issues
    const userCount = await prisma.user.count();
    console.log(`\n📈 Total users in system: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error debugging sub-admin login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSubAdminLogin();