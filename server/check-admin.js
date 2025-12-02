const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log(' Searching for admin user...');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });
    
    if (!adminUser) {
      console.log(' Admin user not found with email: admin@awake.com');
      
      // Check if there are any admin users
      const allAdmins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });
      
      console.log(' Found', allAdmins.length, 'admin users:');
      allAdmins.forEach(admin => {
        console.log('  - Email:', admin.email, '| Role:', admin.role, '| ID:', admin.id);
      });
      
      return;
    }
    
    console.log(' Admin user found:');
    console.log('  - Email:', adminUser.email);
    console.log('  - Role:', adminUser.role);
    console.log('  - ID:', adminUser.id);
    console.log('  - Created:', adminUser.createdAt);
    
    // Test password
    const testPassword = 'Admin@123';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.passwordHash);
    
    console.log(' Password check for "Admin@123":', isPasswordValid ? ' VALID' : ' INVALID');
    
    if (!isPasswordValid) {
      console.log(' Let me check what the actual password hash is...');
      console.log('  - Stored hash:', adminUser.passwordHash.substring(0, 20) + '...');
      
      // Test some common variations
      const variations = ['admin123', 'Admin123', 'admin@123', 'ADMIN@123', 'admin', 'Admin', 'password', 'Password'];
      console.log(' Testing common password variations...');
      
      for (const variant of variations) {
        const isValid = await bcrypt.compare(variant, adminUser.passwordHash);
        console.log(`  - "${variant}":`, isValid ? ' VALID' : ' invalid');
        if (isValid) {
          console.log(' FOUND WORKING PASSWORD:', variant);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();