import prisma from './src/prismaClient.js';

async function testDonorAPI() {
  try {
    const donorId = 'cmguhnqq4000623npirjhbeb3';
    
    console.log('🔍 Testing /api/donors/me logic...');
    
    // Test donor profile fetch
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        totalFunded: true,
        createdAt: true,
        updatedAt: true,
        country: true,
        address: true,
        currencyPreference: true,
        taxId: true,
      },
    });

    console.log('✅ Donor profile:', JSON.stringify(donor, null, 2));

    // Test aggregates
    const [count, sum] = await Promise.all([
      prisma.sponsorship.count({ where: { donorId } }),
      prisma.sponsorship.aggregate({
        _sum: { amount: true },
        where: { donorId },
      }),
    ]);

    console.log('📊 Stats:');
    console.log('- Sponsorship count:', count);
    console.log('- Total funded (aggregated):', Number(sum?._sum?.amount || 0));
    
    // Test sponsorships fetch
    console.log('🔍 Testing sponsorships...');
    const sponsorships = await prisma.sponsorship.findMany({
      where: { donorId },
      orderBy: { date: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            program: true,
            city: true,
            province: true,
            gpa: true,
            needUSD: true,
            sponsored: true,
          },
        },
      },
    });

    console.log('🎓 Sponsorships found:', sponsorships.length);
    sponsorships.forEach((sp, i) => {
      console.log(`${i + 1}. ${sp.student?.name || 'Unknown'} - $${sp.amount}`);
    });
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDonorAPI();