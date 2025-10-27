import prisma from './src/prismaClient.js';

async function testDB() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connected successfully:', result);
    
    // Test if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@awake.com' },
      select: { id: true, email: true, role: true, name: true }
    });
    
    console.log('👤 Admin user:', adminUser);
    
    // Test basic counts
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.donor.count(),
      prisma.application.count(),
      prisma.sponsorship.count()
    ]);
    
    console.log('📊 Record counts:');
    console.log('- Users:', counts[0]);
    console.log('- Students:', counts[1]);
    console.log('- Donors:', counts[2]);
    console.log('- Applications:', counts[3]);
    console.log('- Sponsorships:', counts[4]);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();