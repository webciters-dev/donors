// Verify the university mapping fixes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFixes() {
  console.log(' Verifying University Mapping Fixes');
  console.log('====================================');

  // Check for Mehran universities
  const mehranUnis = await prisma.university.findMany({
    where: {
      name: {
        contains: 'Mehran'
      }
    }
  });

  console.log('\n️ Mehran Universities:');
  mehranUnis.forEach((uni, index) => {
    console.log(`   ${index + 1}. ${uni.name} (ID: ${uni.id})`);
  });

  // Check for Space Technology institutes
  const spaceUnis = await prisma.university.findMany({
    where: {
      name: {
        contains: 'Institute of Space'
      }
    }
  });

  console.log('\n Space Technology Universities:');
  spaceUnis.forEach((uni, index) => {
    console.log(`   ${index + 1}. ${uni.name} (ID: ${uni.id})`);
  });

  // Check for UET universities
  const uetUnis = await prisma.university.findMany({
    where: {
      name: {
        contains: 'UET'
      }
    }
  });

  console.log('\n UET Universities:');
  uetUnis.forEach((uni, index) => {
    console.log(`   ${index + 1}. ${uni.name} (ID: ${uni.id})`);
  });

  // Check programs for each university
  console.log('\n Program counts for fixed universities:');
  
  for (const uni of [...mehranUnis, ...spaceUnis]) {
    const programCount = await prisma.universityProgram.count({
      where: { universityId: uni.id }
    });
    console.log(`   ${uni.name}: ${programCount} programs`);
  }

  await prisma.$disconnect();
}

verifyFixes().catch(console.error);