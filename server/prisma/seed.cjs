// server/prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Clean slate in FK-safe order
  await prisma.message.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.application.deleteMany();
  await prisma.disbursement.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.student.deleteMany();

  // ---- Donors
  const d1 = await prisma.donor.create({
    data: {
      name: "Sarah Malik",
      email: "sarah@example.com",
      organization: "Malik Family Foundation",
      totalFunded: 6200,
    },
  });
  const d2 = await prisma.donor.create({
    data: {
      name: "Imran Siddiqui",
      email: "imran@example.com",
      organization: null,
      totalFunded: 2400,
    },
  });
  const d3 = await prisma.donor.create({
    data: {
      name: "PakTech Corp",
      email: "corp@paktech.com",
      organization: "Corporate",
      totalFunded: 9800,
    },
  });

  // ---- Students (remove needUSD field - legacy field removed)
  const s1 = await prisma.student.create({
    data: {
      name: "Ayesha Khan",
      email: "ayesha.khan@nust.edu.pk",
      gender: "F",
      university: "NUST",
      field: "Computer Science",
      program: "BS Computer Science",
      gpa: 3.7,
      gradYear: 2026,
      city: "Islamabad",
      province: "Islamabad Capital Territory",
    },
  });

  const s2 = await prisma.student.create({
    data: {
      name: "Bilal Ahmed",
      email: "bilal.ahmed@uet.edu.pk",
      gender: "M",
      university: "UET Lahore",
      field: "Mechanical Engineering",
      program: "BS Mechanical Engineering",
      gpa: 3.5,
      gradYear: 2025,
      city: "Lahore",
      province: "Punjab",
    },
  });

  const s3 = await prisma.student.create({
    data: {
      name: "Hira Fatima",
      email: "hira.fatima@duhs.edu.pk",
      gender: "F",
      university: "DUHS",
      field: "Medicine (MBBS)",
      program: "MBBS",
      gpa: 3.9,
      gradYear: 2027,
      city: "Karachi",
      province: "Sindh",
    },
  });

  const s4 = await prisma.student.create({
    data: {
      name: "Usman Tariq",
      email: "usman.tariq@fast.edu.pk",
      gender: "M",
      university: "FAST",
      field: "Electrical Engineering",
      program: "BS Electrical Engineering",
      gpa: 3.2,
      gradYear: 2026,
      city: "Peshawar",
      province: "Khyber Pakhtunkhwa",
    },
  });

  // ---- Sponsorships
  await prisma.sponsorship.create({
    data: { studentId: s1.id, donorId: d1.id, amount: 1200, date: new Date("2025-08-08") },
  });
  await prisma.sponsorship.create({
    data: { studentId: s1.id, donorId: d2.id, amount: 600, date: new Date("2025-08-09") },
  });
  await prisma.sponsorship.create({
    data: { studentId: s3.id, donorId: d1.id, amount: 1000, date: new Date("2025-08-04") },
  });
  await prisma.sponsorship.create({
    data: { studentId: s2.id, donorId: d3.id, amount: 1800, date: new Date("2025-08-02") },
  });
  await prisma.sponsorship.create({
    data: { studentId: s4.id, donorId: d3.id, amount: 900, date: new Date("2025-08-03") },
  });

  // ---- Applications
  const a1 = await prisma.application.create({
    data: { studentId: s1.id, term: "Fall 2025", amount: 2400, currency: "USD", status: "APPROVED" },
  });
  const a2 = await prisma.application.create({
    data: { studentId: s3.id, term: "Fall 2025", amount: 5000, currency: "USD", status: "PROCESSING" },
  });

  // ---- Messages (linking to one application)
  await prisma.message.createMany({
    data: [
      {
        studentId: s1.id,
        applicationId: a1.id,
        text: "Hello Admin, I would like to know the status of my application.",
        fromRole: "student",
      },
      {
        studentId: s1.id,
        applicationId: a1.id,
        text: "Your application is under review. Please wait for approval.",
        fromRole: "admin",
      },
    ],
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    if (e.meta) console.error("meta:", e.meta);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
