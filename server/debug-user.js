import prisma from './src/prismaClient.js';

async function checkUser() {
  try {
    console.log('🔍 Looking for user test+21@webciters.com...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'test+21@webciters.com' },
      include: { donor: true }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- DonorId:', user.donorId);
      console.log('- Has donor relation:', !!user.donor);
      
      if (user.donor) {
        console.log('🎯 Donor details:');
        console.log('- Donor ID:', user.donor.id);
        console.log('- Name:', user.donor.name);
        console.log('- Organization:', user.donor.organization);
        console.log('- Total Funded:', user.donor.totalFunded);
      } else {
        console.log('❌ No donor record found!');
        
        // Check if there's a donor with this email
        const donor = await prisma.donor.findFirst({
          where: { email: 'test+21@webciters.com' }
        });
        
        if (donor) {
          console.log('🔍 Found orphaned donor record:');
          console.log('- Donor ID:', donor.id);
          console.log('- Name:', donor.name);
          console.log('- Email:', donor.email);
          
          // Link the user to the donor
          console.log('🔧 Linking user to donor...');
          await prisma.user.update({
            where: { id: user.id },
            data: { donorId: donor.id }
          });
          console.log('✅ User linked to donor successfully!');
        }
      }
    } else {
      console.log('❌ User not found!');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUser();