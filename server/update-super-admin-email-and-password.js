// Update Super Admin email and password on localhost
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateSuperAdmin() {
  try {
    const newEmail = 'test+61@webciters.com';
    const newPassword = 'RoG*741#SuP';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email: 'superadmin@awakeconnect.com' },
      data: { 
        email: newEmail,
        passwordHash: hashedPassword 
      }
    });

    console.log('✅ Super Admin updated successfully!');
    console.log('Email:', updatedUser.email);
    console.log('Password: RoG*741#SuP');
    console.log('Role:', updatedUser.role);
  } catch (error) {
    console.error('❌ Failed to update Super Admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdmin();
