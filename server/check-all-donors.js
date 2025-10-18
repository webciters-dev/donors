import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkAllDonors() {
  try {
    console.log('=== Updated Donor Check ===');
    
    // Get all donors including the new one
    const allDonors = await prisma.donor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            sponsorships: true
          }
        }
      }
    });
    
    console.log(`Found ${allDonors.length} donors in database:`);
    allDonors.forEach((donor, index) => {
      console.log(`${index + 1}. ${donor.name} (${donor.email}) - Sponsorships: ${donor._count.sponsorships}`);
    });
    
    console.log('\nFull donor details:');
    console.log(JSON.stringify(allDonors, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database Error:', error);
    await prisma.$disconnect();
  }
}

checkAllDonors();