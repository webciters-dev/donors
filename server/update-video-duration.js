import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateVideoDuration() {
  try {
    console.log('Updating video duration for existing video...\n');
    
    // Update the existing video record with an estimated duration
    // Since it's a WhatsApp video, let's estimate around 30 seconds
    const updatedStudent = await prisma.student.update({
      where: {
        id: 'cmhoj6liz0000118klf1ha6ni' // The ID from our previous check
      },
      data: {
        introVideoDuration: 30 // Set to 30 seconds as a test
      }
    });

    console.log('Updated student video duration:');
    console.log('- Student ID:', updatedStudent.id);
    console.log('- Name:', updatedStudent.name);
    console.log('- Video Duration:', updatedStudent.introVideoDuration, 'seconds');
    
  } catch (error) {
    console.error('Error updating video duration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVideoDuration();