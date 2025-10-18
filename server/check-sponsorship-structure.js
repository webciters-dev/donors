import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkSponsorshipStructure() {
  try {
    console.log('=== Checking Sponsorship Structure ===');
    
    // Get a sponsorship with all relationships
    const sponsorship = await prisma.sponsorship.findFirst({
      include: {
        student: {
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                submittedAt: true,
              }
            }
          }
        },
        donor: true
      }
    });
    
    if (sponsorship) {
      console.log('Sponsorship Structure:');
      console.log(JSON.stringify(sponsorship, null, 2));
    } else {
      console.log('No sponsorships found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database Error:', error);
    await prisma.$disconnect();
  }
}

checkSponsorshipStructure();