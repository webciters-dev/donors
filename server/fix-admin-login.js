// Check and fix admin login credentials
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminLogin() {
  console.log('🔧 FIXING ADMIN LOGIN CREDENTIALS');
  console.log('=================================\n');

  try {
    // 1. Check current admin account
    console.log('1️⃣ Checking current admin account...');
    
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log(`   ✅ Found admin: ${existingAdmin.email}`);
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   🔑 Current password hash exists: ${!!existingAdmin.passwordHash}`);
    } else {
      console.log('   ❌ No admin account found!');
    }

    // 2. Test password verification
    console.log('\n2️⃣ Testing password verification...');
    
    if (existingAdmin) {
      const isPasswordValid = await bcrypt.compare('admin123', existingAdmin.passwordHash);
      console.log(`   🔐 Password 'admin123' works: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
      
      if (!isPasswordValid) {
        console.log('   🔧 Updating password hash...');
        
        const newPasswordHash = await bcrypt.hash('admin123', 10);
        
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { passwordHash: newPasswordHash }
        });
        
        console.log('   ✅ Password updated successfully');
        
        // Verify the update
        const updatedAdmin = await prisma.user.findUnique({
          where: { id: existingAdmin.id }
        });
        
        const isNewPasswordValid = await bcrypt.compare('admin123', updatedAdmin.passwordHash);
        console.log(`   🔐 New password verification: ${isNewPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
      }
    } else {
      // Create admin if doesn't exist
      console.log('\n   🔧 Creating new admin account...');
      
      const newAdmin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@awake.com',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'ADMIN'
        }
      });
      
      console.log(`   ✅ Created new admin: ${newAdmin.email}`);
    }

    // 3. Final verification
    console.log('\n3️⃣ Final admin login verification...');
    
    const finalAdmin = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });

    if (finalAdmin) {
      const passwordCheck = await bcrypt.compare('admin123', finalAdmin.passwordHash);
      console.log(`   👑 Admin Account: ${finalAdmin.email}`);
      console.log(`   🔐 Password Check: ${passwordCheck ? '✅ WORKING' : '❌ FAILED'}`);
      console.log(`   🆔 Role: ${finalAdmin.role}`);
      console.log(`   📅 Created: ${finalAdmin.createdAt.toISOString()}`);
      
      return passwordCheck;
    }

    return false;

  } catch (error) {
    console.error('❌ Error fixing admin login:', error);
    return false;
  }
}

// Run the fix
fixAdminLogin().then((success) => {
  if (success) {
    console.log('\n🎉 ADMIN LOGIN CREDENTIALS FIXED!');
    console.log('📧 Email: admin@awake.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login URL: http://localhost:8081/#/login');
  } else {
    console.log('\n❌ Failed to fix admin login credentials');
  }
  
  prisma.$disconnect();
});