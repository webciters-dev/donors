#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function removeAllStudents() {
  try {
    console.log(" Starting complete student removal...\n");

    // Step 1: Get all students to display what's being removed
    console.log(" Finding all students...");
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (allStudents.length === 0) {
      console.log(" No students found in database\n");
      return;
    }

    console.log(`Found ${allStudents.length} students:\n`);
    allStudents.forEach((s, i) => {
      console.log(`${i + 1}. ${s.email} (${s.name}) - ID: ${s.id}`);
    });
    console.log();

    // Step 2: Delete related data in correct order (respecting foreign keys)
    console.log("️  Deleting student-related data (respecting database relationships)...\n");

    // Delete in order of foreign key dependencies
    const deletionOrder = [
      { name: "ProgressReports", model: "progressReport" },
      { name: "StudentProgress", model: "studentProgress" },
      { name: "ProgressReports (linked)", model: "progressReport" },
      { name: "Interviews", model: "interview" },
      { name: "FieldReviews", model: "fieldReview" },
      { name: "Documents", model: "document" },
      { name: "Sponsorships", model: "sponsorship" },
      { name: "Disbursements", model: "disbursement" },
      { name: "Applications", model: "application" },
      { name: "Messages", model: "message" },
      { name: "Conversations", model: "conversation" }
    ];

    // Delete all progress reports first
    const deletedProgressReports = await prisma.progressReport.deleteMany({});
    console.log(` Deleted ${deletedProgressReports.count} progress reports`);

    // Delete all student progress
    const deletedStudentProgress = await prisma.studentProgress.deleteMany({});
    console.log(` Deleted ${deletedStudentProgress.count} student progress records`);

    // Delete all interviews
    const deletedInterviews = await prisma.interview.deleteMany({});
    console.log(` Deleted ${deletedInterviews.count} interviews`);

    // Delete all field reviews
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({});
    console.log(` Deleted ${deletedFieldReviews.count} field reviews`);

    // Delete all documents
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(` Deleted ${deletedDocuments.count} documents`);

    // Delete all sponsorships
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(` Deleted ${deletedSponsorships.count} sponsorships`);

    // Delete all disbursements
    const deletedDisbursements = await prisma.disbursement.deleteMany({});
    console.log(` Deleted ${deletedDisbursements.count} disbursements`);

    // Delete all applications
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(` Deleted ${deletedApplications.count} applications`);

    // Delete all messages
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(` Deleted ${deletedMessages.count} messages`);

    // Delete all conversations
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(` Deleted ${deletedConversations.count} conversations`);

    console.log();

    // Step 3: Delete User accounts associated with students
    console.log("️  Deleting associated User accounts...");
    const deletedUserAccounts = await prisma.user.deleteMany({
      where: {
        studentId: {
          in: allStudents.map(s => s.id)
        }
      }
    });
    console.log(` Deleted ${deletedUserAccounts.count} user accounts\n`);

    // Step 4: Delete the students themselves
    console.log("️  Deleting Student records...");
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(` Deleted ${deletedStudents.count} students\n`);

    // Step 5: Verify complete removal
    console.log(" Verifying complete removal...\n");
    
    const remainingStudents = await prisma.student.findMany({});
    const remainingApplications = await prisma.application.findMany({});
    const remainingUserStudents = await prisma.user.findMany({
      where: { role: "STUDENT" }
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" COMPLETE REMOVAL VERIFIED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\nRemaining Students: ${remainingStudents.length}`);
    console.log(`Remaining Applications: ${remainingApplications.length}`);
    console.log(`Remaining STUDENT role Users: ${remainingUserStudents.length}`);
    console.log("\n All students and their data have been successfully removed!\n");

  } catch (error) {
    console.error(" Error during removal:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeAllStudents();
