import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createMissingTestAccounts() {
  const prisma = new PrismaClient();
  
  const testAccounts = [
    'test+1@webciters.com',
    'test+2@webciters.com', 
    'test+3@webciters.com',
    'test+4@webciters.com'
  ];

  try {
    console.log('🔧 Creating missing test accounts...\n');

    for (const email of testAccounts) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email }
      });

      if (existing) {
        console.log(`✅ ${email} already exists`);
        continue;
      }

      // Create password hash (using "password123" as default)
      const passwordHash = await bcrypt.hash('password123', 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'STUDENT'
        }
      });

      // Create associated student record
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          name: email.split('@')[0], // Use "test+1" etc as name
          email: email
        }
      });

      console.log(`✅ Created ${email} with password "password123"`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Student ID: ${student.id}\n`);
    }

    console.log('🎉 All missing test accounts created successfully!');
    
    // Show final user count
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTestAccounts();