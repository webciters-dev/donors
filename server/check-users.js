import { PrismaClient } from '@prisma/client';

async function checkAllUsers() {
  const prisma = new PrismaClient();
  try {
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        name: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`=== TOTAL USERS: ${users.length} ===`);
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.name || u.email} (${u.role})`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Created: ${u.createdAt}`);
      console.log('');
    });

    // Specifically check for the expected test accounts
    const expectedEmails = [
      'test+1@webciters.com',
      'test+2@webciters.com', 
      'test+3@webciters.com',
      'test+4@webciters.com',
      'test+6@webciters.com'
    ];

    console.log('\n=== CHECKING EXPECTED TEST ACCOUNTS ===');
    for (const email of expectedEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      console.log(`${email}: ${user ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      if (user) {
        console.log(`   ID: ${user.id}, Role: ${user.role}, Created: ${user.createdAt}`);
      }
    }

    // Check for any webciters.com emails
    console.log('\n=== ALL WEBCITERS.COM EMAILS ===');
    const webciterUsers = users.filter(u => u.email.includes('webciters.com'));
    console.log(`Found ${webciterUsers.length} webciters.com accounts:`);
    webciterUsers.forEach(u => {
      console.log(`- ${u.email} (${u.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();