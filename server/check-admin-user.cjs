// Check if admin user exists in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin user...');
    
    const users = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('📊 Admin users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('🔧 Creating admin user...');
      
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@awake.com',
          passwordHash,
          role: 'ADMIN',
        }
      });
      
      console.log('✅ Admin user created:', newAdmin.email);
    } else {
      console.log('✅ Admin users found:');
      users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }
    
    // Also check the specific admin email
    const specificAdmin = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' }
    });
    
    if (specificAdmin) {
      console.log('✅ admin@awake.com exists in database');
    } else {
      console.log('❌ admin@awake.com NOT found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();