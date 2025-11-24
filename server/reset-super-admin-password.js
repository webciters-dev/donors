// Temporary script to reset Super Admin password on localhost
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetSuperAdminPassword() {
  try {
    const newPassword = 'RoG*741#SuP';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email: 'superadmin@awakeconnect.com' },
      data: { passwordHash: hashedPassword }
    });

    console.log('✅ Super Admin password reset successfully!');
    console.log('Email:', updatedUser.email);
    console.log('Password: RoG*741#SuP');
    console.log('Role:', updatedUser.role);
  } catch (error) {
    console.error('❌ Failed to reset password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetSuperAdminPassword();
