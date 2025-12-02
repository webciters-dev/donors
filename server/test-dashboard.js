// Check what the dashboard query returns
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== DASHBOARD QUERY TEST ===\n");

  // Case Worker 1's ID
  const caseWorkerId = "cmilm4eku0000kfmdfw8kfi7i";

  console.log(`Testing dashboard query for Case Worker ID: ${caseWorkerId}\n`);

  // This is EXACTLY what the backend does
  const reviews = await prisma.fieldReview.findMany({
    where: { officerUserId: caseWorkerId },
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              program: true,
              gpa: true
            }
          }
        }
      },
      officer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  console.log(` Found ${reviews.length} review(s)\n`);
  
  reviews.forEach((review, idx) => {
    console.log(`Review #${idx + 1}:`);
    console.log(`  ID: ${review.id}`);
    console.log(`  Application ID: ${review.applicationId}`);
    console.log(`  Student: ${review.application.student.name} (${review.application.student.email})`);
    console.log(`  University: ${review.application.student.universityName}`);
    console.log(`  Status: ${review.status}`);
    console.log(`  Task Type: ${review.taskType || "Complete Verification"}`);
    console.log(`  Officer: ${review.officer.name}`);
    console.log();
  });

  if (reviews.length === 0) {
    console.log(" NO REVIEWS FOUND - This would cause empty dashboard!");
  } else {
    console.log(" DASHBOARD SHOULD SHOW THESE ASSIGNMENTS");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
