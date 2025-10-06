// Test notification system
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testNotification() {
  try {
    console.log('Testing notification creation...');
    
    const application = await prisma.application.findUnique({
      where: { id: 'cmgatgkr1000410rntxlbhebc' },
      include: { student: true }
    });
    
    if (!application) {
      console.log('Application not found');
      return;
    }
    
    console.log('Application found:', application.id, application.studentId);
    
    const notification = await prisma.message.create({
      data: {
        studentId: application.studentId,
        applicationId: application.id,
        text: 'Status Update: Test automatic notification system',
        fromRole: 'admin'
      }
    });
    
    console.log('Notification created:', notification);
    
  } catch (error) {
    console.error('Error creating notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotification();