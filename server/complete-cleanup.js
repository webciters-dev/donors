#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function completeCleanup() {
  try {
    console.log(" Completing database cleanup - removing remaining User accounts...\n");

    // Delete all STUDENT role users (applicants)
    console.log("️  Deleting all STUDENT role users (applicants)...");
    const deletedStudentUsers = await prisma.user.deleteMany({
      where: {
        role: "STUDENT"
      }
    });
    console.log(` Deleted ${deletedStudentUsers.count} student users\n`);

    // Verify cleanup
    console.log(" Verifying all applicants removed...");
    const remainingUsers = await prisma.user.findMany({});
    console.log(`\n Remaining Users: ${remainingUsers.length}`);
    
    remainingUsers.forEach(u => {
      console.log(`   - ${u.email} (Role: ${u.role})`);
    });

    console.log();

    // Specifically check for test+1@webciters.com
    const testUser = await prisma.user.findUnique({
      where: { email: "test+1@webciters.com" }
    });

    if (testUser) {
      console.log(` FOUND: test+1@webciters.com (Role: ${testUser.role})`);
    } else {
      console.log(` test+1@webciters.com: SUCCESSFULLY REMOVED`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" DATABASE CLEANUP COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nRemaining Users (Only Admins & SUPER_ADMIN):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    remainingUsers.forEach(u => {
      if (u.role === "SUPER_ADMIN") {
        console.log(` ${u.email} - ${u.role}`);
      } else {
        console.log(`   ${u.email} - ${u.role}`);
      }
    });

  } catch (error) {
    console.error(" Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeCleanup();
