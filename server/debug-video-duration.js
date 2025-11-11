import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVideoDurations() {
  try {
    console.log('Checking video records in database...\n');
    
    const studentsWithVideos = await prisma.student.findMany({
      where: {
        introVideoUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        introVideoUrl: true,
        introVideoDuration: true,
        introVideoUploadedAt: true,
        introVideoOriginalName: true
      }
    });

    if (studentsWithVideos.length === 0) {
      console.log('No students with videos found.');
      return;
    }

    console.log(`Found ${studentsWithVideos.length} student(s) with videos:\n`);
    
    studentsWithVideos.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (ID: ${student.id})`);
      console.log(`   Video URL: ${student.introVideoUrl}`);
      console.log(`   Duration: ${student.introVideoDuration} seconds`);
      console.log(`   Original Name: ${student.introVideoOriginalName}`);
      console.log(`   Uploaded At: ${student.introVideoUploadedAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error checking video durations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoDurations();