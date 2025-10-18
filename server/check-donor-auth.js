// Check donor authentication and data
import prisma from './src/prismaClient.js';

async function checkDonorAuth() {
  try {
    console.log('=== Checking Donor Authentication ===');
    
    // Find the donor user
    const user = await prisma.user.findUnique({
      where: { email: 'test+21@webciters.com' },
      include: {
        donor: true
      }
    });
    
    console.log('User record:', JSON.stringify(user, null, 2));
    
    if (user?.donorId) {
      // Check sponsorships for this donor
      const sponsorships = await prisma.sponsorship.findMany({
        where: { donorId: user.donorId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              university: true,
              program: true,
            }
          }
        }
      });
      
      console.log(`\nFound ${sponsorships.length} sponsorships for donor ${user.donorId}:`);
      sponsorships.forEach((s, i) => {
        console.log(`${i+1}. ${s.student?.name} - ${s.amount} USD - ${s.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking donor auth:', error);
  }
}

checkDonorAuth();