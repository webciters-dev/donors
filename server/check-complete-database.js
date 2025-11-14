// check-complete-database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('📊 COMPLETE DATABASE STATUS CHECK\n');

try {
  await prisma.$connect();
  
  // Get all counts
  const counts = {
    totalUsers: await prisma.user.count(),
    studentUsers: await prisma.user.count({ where: { role: 'STUDENT' } }),
    adminUsers: await prisma.user.count({ where: { role: 'ADMIN' } }),
    subAdminUsers: await prisma.user.count({ where: { role: 'SUB_ADMIN' } }),
    donorUsers: await prisma.user.count({ where: { role: 'DONOR' } }),
    students: await prisma.student.count(),
    applications: await prisma.application.count(),
    donors: await prisma.donor.count(),
    boardMembers: await prisma.boardMember.count(),
    universities: await prisma.university.count(),
    sponsorships: await prisma.sponsorship.count()
  };
  
  console.log('👥 USER ACCOUNTS:');
  console.log(`   Total Users: ${counts.totalUsers}`);
  console.log(`   ├── Admin Users: ${counts.adminUsers}`);
  console.log(`   ├── Case Workers (SUB_ADMIN): ${counts.subAdminUsers}`);
  console.log(`   ├── Student Users: ${counts.studentUsers}`);
  console.log(`   └── Donor Users: ${counts.donorUsers}`);
  
  console.log('\n📋 DATA RECORDS:');
  console.log(`   Student Profiles: ${counts.students}`);
  console.log(`   Applications: ${counts.applications}`);
  console.log(`   Donors: ${counts.donors}`);
  console.log(`   Board Members: ${counts.boardMembers}`);
  console.log(`   Sponsorships: ${counts.sponsorships}`);
  
  console.log('\n🏫 INFRASTRUCTURE:');
  console.log(`   Universities: ${counts.universities}`);
  
  // Show board members details
  if (counts.boardMembers > 0) {
    console.log('\n👔 BOARD MEMBERS DETAILS:');
    const boardMembers = await prisma.boardMember.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        email: true,
        createdAt: true
      }
    });
    
    boardMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name}`);
      console.log(`      Title: ${member.title || 'Not set'}`);
      console.log(`      Email: ${member.email || 'Not set'}`);
      console.log(`      Created: ${member.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
  console.log('✅ Complete database check completed');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}