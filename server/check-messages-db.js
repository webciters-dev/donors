import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkMessagesInDatabase() {
  try {
    console.log('=== Checking Messages in Database ===');
    
    // Check old messages table
    const oldMessages = await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { name: true }
        }
      }
    });
    
    console.log('Old Messages System:');
    console.log(`Found ${oldMessages.length} messages`);
    oldMessages.forEach((msg, index) => {
      console.log(`${index + 1}. From: ${msg.student?.name || 'Unknown'} | Text: ${msg.text?.substring(0, 50)}... | Created: ${msg.createdAt}`);
    });
    
    // Check new conversations and messages
    const conversations = await prisma.conversation.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        student: {
          select: { name: true }
        },
        messages: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    console.log('\nNew Conversations System:');
    console.log(`Found ${conversations.length} conversations`);
    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. Student: ${conv.student?.name || 'Unknown'} | Messages: ${conv.messages?.length || 0}`);
      conv.messages?.forEach((msg, msgIndex) => {
        console.log(`  ${msgIndex + 1}. From: ${msg.sender?.name || 'Unknown'} (${msg.senderRole}) | Text: ${msg.text?.substring(0, 40)}...`);
      });
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database Error:', error);
    await prisma.$disconnect();
  }
}

checkMessagesInDatabase();