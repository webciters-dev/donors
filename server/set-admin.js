import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setAdminPassword() {
  try {
    console.log('🔐 Setting admin password...');
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('👤 Found admin:', admin.email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    // Update admin password
    await prisma.user.update({
      where: { email: 'admin@awake.com' },
      data: { 
        passwordHash: hashedPassword,
        name: 'Admin User'
      }
    });
    
    console.log('✅ Admin password set to: Admin@123');
    console.log('✅ Admin name set to: Admin User');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

setAdminPassword();
