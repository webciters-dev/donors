// Reset admin password
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    const newPassword = 'Admin@123';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@awake.com' },
      data: { passwordHash }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email: admin@awake.com');
    console.log('🔑 Password: Admin@123');
    
    // Test the password
    const testLogin = await bcrypt.compare('Admin@123', passwordHash);
    console.log('🧪 Password test:', testLogin ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();