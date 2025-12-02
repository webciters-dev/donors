// find-complete-database.js
import { PrismaClient } from '@prisma/client';

const databases = [
  { name: 'awake_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_db?schema=public' },
  { name: 'awake_local_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/awake_local_db?schema=public' },
  { name: 'donors_db', url: 'postgresql://postgres:RoG*741%23PoS@localhost:5432/donors_db?schema=public' }
];

console.log(' Searching for database with complete setup...\n');

for (const db of databases) {
  console.log(`️  Database: ${db.name}`);
  console.log('='.repeat(60));
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: db.url
      }
    }
  });

  try {
    await prisma.$connect();
    
    // Check user composition
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    console.log(' Users by Role:');
    let totalUsers = 0;
    usersByRole.forEach(group => {
      console.log(`   ${group.role}: ${group._count.role} users`);
      totalUsers += group._count.role;
    });
    console.log(`   TOTAL: ${totalUsers} users\n`);

    // Check if it has 1 admin and 4 case workers
    const adminCount = usersByRole.find(g => g.role === 'ADMIN')?._count.role || 0;
    const caseWorkerCount = usersByRole.find(g => g.role === 'SUB_ADMIN')?._count.role || 0;
    
    console.log(` Target Match Check:`);
    console.log(`   Admin: ${adminCount} (target: 1) ${adminCount === 1 ? '' : ''}`);
    console.log(`   Case Workers: ${caseWorkerCount} (target: 4) ${caseWorkerCount === 4 ? '' : ''}`);

    // Check for universities table
    try {
      const universityCount = await prisma.university.count();
      console.log(` Universities: ${universityCount} ${universityCount >= 26 ? '' : ''}`);
      
      if (universityCount > 0) {
        // Get Pakistani universities
        const pakistaniUniversities = await prisma.university.count({
          where: {
            country: 'Pakistan'
          }
        });
        console.log(` Pakistani Universities: ${pakistaniUniversities}`);
        
        // Show some sample universities
        const sampleUniversities = await prisma.university.findMany({
          where: { country: 'Pakistan' },
          select: { name: true },
          take: 5
        });
        console.log(` Sample Pakistani Universities:`);
        sampleUniversities.forEach((uni, index) => {
          console.log(`   ${index + 1}. ${uni.name}`);
        });
      }
    } catch (uniError) {
      console.log(` Universities: Table not found or accessible `);
    }

    // Check for board members
    try {
      const boardMemberCount = await prisma.boardMember.count();
      console.log(` Board Members: ${boardMemberCount} ${boardMemberCount > 0 ? '' : ''}`);
      
      if (boardMemberCount > 0) {
        const boardMembers = await prisma.boardMember.findMany({
          select: { name: true, title: true, isActive: true }
        });
        console.log(` Board Members:`);
        boardMembers.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.name} - ${member.title || 'Member'} ${member.isActive ? '(Active)' : '(Inactive)'}`);
        });
      }
    } catch (boardError) {
      console.log(` Board Members: Table not found or accessible `);
    }

    // Check other key data
    const studentCount = await prisma.student.count();
    const donorCount = await prisma.donor.count();
    const applicationCount = await prisma.application.count();
    
    console.log(`\n Additional Data:`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Donors: ${donorCount}`);
    console.log(`   Applications: ${applicationCount}`);

    // Overall match score
    let matchScore = 0;
    if (adminCount === 1) matchScore += 25;
    if (caseWorkerCount === 4) matchScore += 25;
    if (universityCount >= 26) matchScore += 25;
    if (boardMemberCount > 0) matchScore += 25;

    console.log(`\n MATCH SCORE: ${matchScore}/100 ${matchScore === 100 ? ' PERFECT MATCH!' : matchScore >= 75 ? ' Good Match' : ' Not the target database'}`);

    await prisma.$disconnect();
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.log(` Error accessing ${db.name}:`, error.message);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}