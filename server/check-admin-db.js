import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminInDatabase() {
  try {
    console.log('🔍 Checking admin credentials in database...\n');
    
    // Find the specific admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user with email "admin@awake.com" NOT FOUND');
      
      // Check all admin users
      const allAdminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });
      
      console.log(`\n📊 Found ${allAdminUsers.length} admin users in database:`);
      allAdminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. Email: ${admin.email} | Role: ${admin.role} | Created: ${admin.createdAt}`);
      });
      
      if (allAdminUsers.length === 0) {
        console.log('\n🚨 NO ADMIN USERS FOUND IN DATABASE!');
        console.log('   Creating admin user with credentials: admin@awake.com / Admin@123');
        
        const passwordHash = await bcrypt.hash('Admin@123', 10);
        const newAdmin = await prisma.user.create({
          data: {
            email: 'admin@awake.com',
            passwordHash: passwordHash,
            role: 'ADMIN'
          }
        });
        
        console.log('✅ Admin user created successfully!');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Role: ${newAdmin.role}`);
      }
      
      return;
    }
    
    console.log('✅ Admin user found in database:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log(`   Password Hash: ${adminUser.passwordHash.substring(0, 20)}...`);
    
    // Test the password
    console.log('\n🔐 Testing password "Admin@123"...');
    const isPasswordValid = await bcrypt.compare('Admin@123', adminUser.passwordHash);
    
    if (isPasswordValid) {
      console.log('✅ Password "Admin@123" is VALID!');
      console.log('\n🎉 ADMIN LOGIN CREDENTIALS ARE CORRECT:');
      console.log('   Email: admin@awake.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('❌ Password "Admin@123" is INVALID!');
      
      // Try some common variations
      const variations = [
        'admin123', 'Admin123', 'admin@123', 'ADMIN@123', 
        'admin', 'Admin', 'password', 'Password123'
      ];
      
      console.log('\n🔍 Testing common password variations...');
      let foundPassword = false;
      
      for (const variant of variations) {
        const isValid = await bcrypt.compare(variant, adminUser.passwordHash);
        if (isValid) {
          console.log(`✅ FOUND WORKING PASSWORD: "${variant}"`);
          foundPassword = true;
          break;
        }
      }
      
      if (!foundPassword) {
        console.log('❌ None of the common passwords work.');
        console.log('\n🔧 Updating admin password to "Admin@123"...');
        
        const newPasswordHash = await bcrypt.hash('Admin@123', 10);
        await prisma.user.update({
          where: { email: 'admin@awake.com' },
          data: { passwordHash: newPasswordHash }
        });
        
        console.log('✅ Admin password updated successfully!');
        console.log('\n🎉 ADMIN LOGIN CREDENTIALS:');
        console.log('   Email: admin@awake.com');
        console.log('   Password: Admin@123');
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminInDatabase();