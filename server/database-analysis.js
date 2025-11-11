import { PrismaClient } from '@prisma/client';

async function fullDatabaseAnalysis() {
  const prisma = new PrismaClient();
  try {
    console.log('🗄️  COMPLETE DATABASE ANALYSIS');
    console.log('================================\n');

    // 1. Check all tables for record counts
    const users = await prisma.user.count();
    const students = await prisma.student.count();  
    const donors = await prisma.donor.count();
    const applications = await prisma.application.count();
    
    console.log('📊 TABLE RECORD COUNTS:');
    console.log(`Users: ${users}`);
    console.log(`Students: ${students}`);
    console.log(`Donors: ${donors}`);
    console.log(`Applications: ${applications}\n`);

    // 2. All users with details
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('👥 ALL USERS IN DATABASE:');
    console.log('==========================');
    if (allUsers.length === 0) {
      console.log('❌ No users found in database\n');
    } else {
      allUsers.forEach((user, i) => {
        console.log(`${i+1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'Not set'}`);
        console.log('');
      });
    }

    // 3. Check for pattern matches
    console.log('🔍 SEARCHING FOR PATTERNS:');
    console.log('===========================');
    const testUsers = allUsers.filter(u => u.email.includes('test+'));
    console.log(`Users with "test+" pattern: ${testUsers.length}`);
    testUsers.forEach(u => console.log(`  - ${u.email}`));
    
    const webciterUsers = allUsers.filter(u => u.email.includes('webciters.com'));
    console.log(`\nUsers with "webciters.com": ${webciterUsers.length}`);
    webciterUsers.forEach(u => console.log(`  - ${u.email}`));

    // 4. Check recent activity
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = allUsers.filter(u => u.createdAt >= yesterday);
    console.log(`\nUsers created in last 24 hours: ${recentUsers.length}`);
    recentUsers.forEach(u => console.log(`  - ${u.email} (${u.createdAt})`));

    // 5. Database connection info
    console.log('\n🔧 DATABASE CONNECTION INFO:');
    console.log('==============================');
    console.log('Connected to:', process.env.DATABASE_URL ? 'Environment variable DB' : 'Default/Local DB');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullDatabaseAnalysis();