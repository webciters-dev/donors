import prisma from './src/prismaClient.js';

async function checkSponsorships() {
  try {
    console.log('📊 Checking Sponsorship Records...\n');
    
    const sponsorships = await prisma.sponsorship.findMany({
      include: {
        student: { select: { name: true, sponsored: true } },
        donor: { select: { name: true } }
      }
    });
    
    console.log(`Found ${sponsorships.length} sponsorship records:\n`);
    
    sponsorships.forEach((s, i) => {
      console.log(`${i + 1}. ${s.student.name} sponsored by ${s.donor.name}`);
      console.log(`   Amount: $${s.amount}`);
      console.log(`   Student.sponsored: ${s.student.sponsored}`);
      console.log(`   Status: ${s.status}`);
      console.log(`   Date: ${s.date}`);
      console.log('');
    });
    
    if (sponsorships.length === 0) {
      console.log('✅ No sponsorship records found - this matches the view-students output');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSponsorships();