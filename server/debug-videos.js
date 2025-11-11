// Quick debug script to check video duration in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVideoDuration() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        introVideoUrl: true,
        introVideoDuration: true,
        introVideoUploadedAt: true
      },
      where: {
        introVideoUrl: {
          not: null
        }
      }
    });

    console.log('Students with videos:', students.length);
    
    students.forEach(student => {
      console.log(`\n--- ${student.name} (${student.email}) ---`);
      console.log('Video URL:', student.introVideoUrl);
      console.log('Duration:', student.introVideoDuration, 'seconds');
      console.log('Uploaded At:', student.introVideoUploadedAt);
    });

  } catch (error) {
    console.error('Error checking video data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoDuration();