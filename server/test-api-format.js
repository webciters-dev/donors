import prisma from './src/prismaClient.js';

async function testAPIResponse() {
  try {
    const donorId = 'cmguhnqq4000623npirjhbeb3';
    
    // Simulate the exact API logic
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

    const [count, sum] = await Promise.all([
      prisma.sponsorship.count({ where: { donorId } }),
      prisma.sponsorship.aggregate({
        _sum: { amount: true },
        where: { donorId },
      }),
    ]);

    const apiResponse = {
      donor,
      stats: {
        sponsorshipCount: count,
        totalFunded: Number(sum?._sum?.amount || 0),
      },
    };

    console.log('🔍 API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Test sponsorships endpoint
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

    const sponsorshipsResponse = { sponsorships };
    console.log('📚 Sponsorships Response:');
    console.log(JSON.stringify(sponsorshipsResponse, null, 2));
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
  }
}

testAPIResponse();