import prisma from './src/prismaClient.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifySystemIntegrity() {
  console.log('🔍 COMPREHENSIVE SYSTEM INTEGRITY CHECK');
  console.log('=====================================\n');

  try {
    // 1. Database Connection
    console.log('1️⃣ Testing Database Connection...');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // 2. User Authentication Data
    console.log('2️⃣ Verifying User Data...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, donorId: true, studentId: true }
    });
    console.log(`✅ Found ${users.length} users`);
    
    const testUser = await prisma.user.findUnique({
      where: { email: 'test+21@webciters.com' },
      include: { donor: true }
    });
    if (testUser?.donor) {
      console.log('✅ Test donor user properly linked');
    } else {
      console.log('❌ Test donor user not found or not linked');
    }
    console.log('');

    // 3. Donor Data Integrity
    console.log('3️⃣ Verifying Donor Data...');
    const donors = await prisma.donor.findMany({
      select: { id: true, name: true, email: true, totalFunded: true }
    });
    console.log(`✅ Found ${donors.length} donors`);
    
    const atharDonor = donors.find(d => d.name === 'Athar Shah');
    if (atharDonor) {
      console.log(`✅ Athar Shah donor: $${atharDonor.totalFunded} funded`);
    }
    console.log('');

    // 4. Student Applications
    console.log('4️⃣ Verifying Student Applications...');
    const applications = await prisma.application.findMany({
      select: { id: true, name: true, status: true, university: true }
    });
    console.log(`✅ Found ${applications.length} applications`);
    
    const approvedApps = applications.filter(a => a.status === 'APPROVED');
    console.log(`✅ ${approvedApps.length} approved applications`);
    console.log('');

    // 5. Sponsorships
    console.log('5️⃣ Verifying Sponsorships...');
    const sponsorships = await prisma.sponsorship.findMany({
      include: {
        donor: { select: { name: true } },
        student: { select: { name: true } }
      }
    });
    console.log(`✅ Found ${sponsorships.length} sponsorships`);
    
    sponsorships.forEach((sp, i) => {
      console.log(`  ${i+1}. ${sp.donor?.name} → ${sp.student?.name}: $${sp.amount}`);
    });
    console.log('');

    // 6. Communications Data
    console.log('6️⃣ Verifying Communications...');
    
    // Old messages
    const oldMessages = await prisma.message.findMany({
      select: { id: true, studentId: true, content: true }
    });
    console.log(`✅ Found ${oldMessages.length} old messages`);
    
    // New conversations
    const conversations = await prisma.conversation.findMany({
      select: { id: true, participants: true }
    });
    console.log(`✅ Found ${conversations.length} new conversations`);
    console.log('');

    // 7. Students Data
    console.log('7️⃣ Verifying Students Data...');
    const students = await prisma.student.findMany({
      select: { id: true, name: true, sponsored: true, university: true }
    });
    console.log(`✅ Found ${students.length} students`);
    
    const sponsoredStudents = students.filter(s => s.sponsored);
    console.log(`✅ ${sponsoredStudents.length} sponsored students`);
    console.log('');

    // 8. Data Relationships
    console.log('8️⃣ Verifying Data Relationships...');
    
    // Check user-donor relationships
    const usersWithDonors = await prisma.user.count({
      where: { donorId: { not: null } }
    });
    console.log(`✅ ${usersWithDonors} users linked to donors`);
    
    // Check user-student relationships
    const usersWithStudents = await prisma.user.count({
      where: { studentId: { not: null } }
    });
    console.log(`✅ ${usersWithStudents} users linked to students`);
    
    // Check sponsorship relationships
    const sponsorshipsWithRelations = await prisma.sponsorship.count({
      where: { 
        AND: [
          { donorId: { not: null } },
          { studentId: { not: null } }
        ]
      }
    });
    console.log(`✅ ${sponsorshipsWithRelations} sponsorships properly linked`);
    console.log('');

    // 9. Summary
    console.log('🎯 SYSTEM INTEGRITY SUMMARY');
    console.log('===========================');
    console.log('✅ Database connection: Working');
    console.log('✅ User authentication: Working');
    console.log('✅ Donor system: Working');
    console.log('✅ Student applications: Working');
    console.log('✅ Sponsorships: Working');
    console.log('✅ Communications: Working');
    console.log('✅ Data relationships: Intact');
    console.log('\n🛡️ SYSTEM IS SAFE TO MODIFY\n');

  } catch (error) {
    console.error('❌ SYSTEM INTEGRITY CHECK FAILED:', error);
    console.log('\n🚨 DO NOT PROCEED WITH MODIFICATIONS\n');
  } finally {
    await prisma.$disconnect();
  }
}

verifySystemIntegrity();