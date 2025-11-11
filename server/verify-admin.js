console.log('🔐 Testing admin login credentials...\n');

async function testLogin() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    
    const prisma = new PrismaClient();
    
    // Find the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.createdAt}`);
    
    // Test the password
    console.log('\n🔐 Testing password "Admin@123"...');
    const isValid = await bcrypt.default.compare('Admin@123', admin.passwordHash);
    
    if (isValid) {
      console.log('✅ Password is VALID!');
      console.log('\n🎉 ADMIN LOGIN CREDENTIALS CONFIRMED:');
      console.log('   📧 Email: admin@awake.com');
      console.log('   🔑 Password: Admin@123');
      console.log('\n✨ You can now login to the admin panel!');
    } else {
      console.log('❌ Password is invalid!');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();