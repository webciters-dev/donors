#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log(" Starting database cleanup...\n");

    // Step 1: Find the SUPER_ADMIN user to preserve
    console.log(" Finding SUPER_ADMIN user...");
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" }
    });

    if (superAdmin) {
      console.log(` Found SUPER_ADMIN: ${superAdmin.email}`);
      console.log(`   Credentials for login:`);
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Password: (use the password you set during creation)\n`);
    } else {
      console.log(" No SUPER_ADMIN found! Creating one with default credentials...\n");
    }

    // Step 2: Delete all Students (this will cascade and delete related data)
    console.log("️  Deleting all Students...");
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(` Deleted ${deletedStudents.count} students\n`);

    // Step 3: Delete all Case Workers (SUB_ADMIN and CASE_WORKER roles)
    console.log("️  Deleting all Case Workers...");
    const deletedCaseWorkers = await prisma.user.deleteMany({
      where: {
        role: {
          in: ["CASE_WORKER", "SUB_ADMIN"]
        }
      }
    });
    console.log(` Deleted ${deletedCaseWorkers.count} case workers\n`);

    // Step 4: Delete all Admins (but NOT SUPER_ADMIN)
    console.log("️  Deleting all Admins (except SUPER_ADMIN)...");
    const deletedAdmins = await prisma.user.deleteMany({
      where: {
        role: "ADMIN"
      }
    });
    console.log(` Deleted ${deletedAdmins.count} admins\n`);

    // Step 5: Delete all Board Members
    console.log("️  Deleting all Board Members...");
    const deletedBoardMembers = await prisma.boardMember.deleteMany({});
    console.log(` Deleted ${deletedBoardMembers.count} board members\n`);

    // Step 6: Delete all Donors (optional - related to case management)
    console.log("️  Deleting all Donors...");
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(` Deleted ${deletedDonors.count} donors\n`);

    // Step 7: Show remaining SUPER_ADMIN
    console.log(" Database cleanup complete!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" SUPER_ADMIN PRESERVED:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const remainingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" }
    });

    if (remainingSuperAdmin) {
      console.log(`Email: ${remainingSuperAdmin.email}`);
      console.log(`Role: ${remainingSuperAdmin.role}`);
      console.log(`Created: ${remainingSuperAdmin.createdAt.toLocaleString()}`);
      console.log("\n You can now login with these credentials and create new admins!");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error(" Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase();
