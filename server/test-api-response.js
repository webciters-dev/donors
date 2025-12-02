// Simulate what the API endpoint returns
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== API ENDPOINT RESPONSE TEST ===\n");

  // Case Worker 1's ID
  const caseWorkerId = "cmilm4eku0000kfmdfw8kfi7i";
  const role = "SUB_ADMIN";

  console.log(`Simulating: GET /api/field-reviews with role="${role}" and userId="${caseWorkerId}"\n`);

  // This is EXACTLY what the backend endpoint does
  const where = (role === "SUB_ADMIN" || role === "CASE_WORKER")
    ? { officerUserId: caseWorkerId }
    : {};

  console.log(`WHERE clause: ${JSON.stringify(where)}\n`);

  const reviews = await prisma.fieldReview.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              guardianName: true,
              guardianPhone1: true,
              guardianPhone2: true,
              guardian2Name: true,
              guardian2Cnic: true,
              cnic: true,
              fatherName: true,
              fatherCnic: true,
              fatherPhone: true,
              motherName: true,
              motherCnic: true,
              motherPhone: true,
              address: true,
              city: true,
              province: true,
              country: true,
              dateOfBirth: true,
              gender: true,
              degreeLevel: true,
              university: true,
              program: true,
              gpa: true,
              bankAccountNumber: true,
              bankName: true,
              bankBranch: true,
              easyPaisaNumber: true,
              jazzCashNumber: true,
              createdAt: true,
              updatedAt: true
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

  console.log("API Response (JSON):\n");
  console.log(JSON.stringify({ reviews }, null, 2));
  
  console.log("\n\nWhat the frontend will receive:");
  console.log(`- Field name: "reviews"`);
  console.log(`- Type: ${Array.isArray(reviews) ? "array" : "not array"}`);
  console.log(`- Length: ${reviews.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
