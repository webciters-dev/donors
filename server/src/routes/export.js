// server/src/routes/export.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/export/applications
 * Export all applications data as CSV
 * Admin only
 */
router.get("/applications", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    // Get all applications with complete student and review data
    const applications = await prisma.application.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            program: true,
            gpa: true,
            gradYear: true,
            city: true,
            province: true,
            gender: true,
            cnic: true,
            dateOfBirth: true,
            guardianName: true,
            guardianCnic: true,
            phone: true,
            address: true,
            currentInstitution: true,
            currentCity: true,
            currentCompletionYear: true,
            createdAt: true,
          }
        },
        fieldReviews: {
          include: {
            officer: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Get message counts for each student
    const messageCounts = await prisma.message.groupBy({
      by: ['studentId'],
      _count: {
        id: true,
      }
    });

    const messageCountMap = messageCounts.reduce((acc, item) => {
      acc[item.studentId] = item._count.id;
      return acc;
    }, {});

    // Prepare CSV headers
    const headers = [
      'Application ID',
      'Student ID',
      'Student Name',
      'Email',
      'University',
      'Program',
      'GPA',
      'Graduation Year',
      'City',
      'Province',
      'Gender',
      'CNIC',
      'Date of Birth',
      'Guardian Name',
      'Guardian CNIC',
      'Phone',
      'Address',
      'Current Institution',
      'Current City',
      'Current Completion Year',
      'Application Term',
      'Required Amount',
      'Currency',
      'Application Status',
      'Application Submitted',
      'Application Notes',
      'Field Reviews Count',
      'Latest Field Review Status',
      'Field Review Officer',
      'Field Review Notes',
      'Messages Count',
      'Student Created',
    ];

    // Prepare CSV rows
    const rows = applications.map(app => {
      const student = app.student;
      const latestReview = app.fieldReviews[0] || null;
      const messageCount = messageCountMap[student.id] || 0;

      return [
        app.id,
        student.id,
        student.name || '',
        student.email || '',
        student.university || '',
        student.program || '',
        student.gpa || '',
        student.gradYear || '',
        student.city || '',
        student.province || '',
        student.gender || '',
        student.cnic || '',
        student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '',
        student.guardianName || '',
        student.guardianCnic || '',
        student.phone || '',
        student.address || '',
        student.currentInstitution || '',
        student.currentCity || '',
        student.currentCompletionYear || '',
        app.term || '',
        app.amount || '',
        app.currency || '',
        app.status || '',
        app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '',
        app.notes || '',
        app.fieldReviews.length,
        latestReview?.status || '',
        latestReview?.officer?.name || '',
        latestReview?.notes || '',
        messageCount,
        student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(field => {
          // Handle CSV escaping
          const strField = String(field || '');
          if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
            return `"${strField.replace(/"/g, '""')}"`;
          }
          return strField;
        }).join(',')
      )
    ].join('\n');

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `awake-applications-export-${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export applications data" });
  }
});

/**
 * GET /api/export/statistics
 * Export system statistics as JSON
 * Admin only
 */
router.get("/statistics", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const stats = {
      applications: {
        total: await prisma.application.count(),
        pending: await prisma.application.count({ where: { status: 'PENDING' } }),
        approved: await prisma.application.count({ where: { status: 'APPROVED' } }),
        rejected: await prisma.application.count({ where: { status: 'REJECTED' } }),
      },
      students: {
        total: await prisma.student.count(),
        withApplications: await prisma.student.count({
          where: { applications: { some: {} } }
        }),
      },
      fieldReviews: {
        total: await prisma.fieldReview.count(),
        completed: await prisma.fieldReview.count({ where: { status: 'COMPLETED' } }),
        pending: await prisma.fieldReview.count({ where: { status: 'PENDING' } }),
      },
      messages: {
        total: await prisma.message.count(),
        fromStudents: await prisma.message.count({ where: { fromRole: 'student' } }),
        fromAdmins: await prisma.message.count({ where: { fromRole: 'admin' } }),
        fromCaseWorkers: await prisma.message.count({ where: { fromRole: 'sub_admin' } }), // Internal role remains sub_admin
      },
      users: {
        total: await prisma.user.count(),
        admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
        students: await prisma.user.count({ where: { role: 'STUDENT' } }),
        caseWorkers: await prisma.user.count({ where: { role: 'SUB_ADMIN' } }), // Internal role remains SUB_ADMIN
      },
      exportedAt: new Date().toISOString(),
    };

    res.json(stats);
    
  } catch (error) {
    console.error("Statistics export error:", error);
    res.status(500).json({ error: "Failed to export statistics" });
  }
});

/**
 * GET /api/export/donors
 * Export all donors data as CSV
 * Admin only
 */
router.get("/donors", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      include: {
        sponsorships: {
          include: {
            student: {
              select: { name: true, email: true, university: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform data for CSV export
    const csvData = donors.map(donor => ({
      "Donor ID": donor.id,
      "Name": donor.name,
      "Email": donor.email,
      "Organization": donor.organization || "",
      "Phone": donor.phone || "",
      "Address": donor.address || "",
      "Country": donor.country || "",
      "Currency Preference": donor.currencyPreference || "",
      "Tax ID": donor.taxId || "",
      "Total Funded (USD)": donor.totalFunded || 0,
      "Total Sponsorships": donor.sponsorships.length,
      "Active Sponsorships": donor.sponsorships.filter(s => s.status === "active").length,
      "Total Sponsored Amount": donor.sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0),
      "Registration Date": donor.createdAt?.toISOString().split('T')[0] || "",
      "Last Updated": donor.updatedAt?.toISOString().split('T')[0] || "",
      "Sponsored Students": donor.sponsorships.map(s => s.student?.name).filter(Boolean).join("; "),
      "Status": donor.sponsorships.length > 0 ? "Active Donor" : "Registered"
    }));

    // Define CSV headers explicitly (ensures headers exist even with no data)
    const headers = [
      "Donor ID", "Name", "Email", "Organization", "Phone", "Address", 
      "Country", "Currency Preference", "Tax ID", "Total Funded (USD)",
      "Total Sponsorships", "Active Sponsorships", "Total Sponsored Amount",
      "Registration Date", "Last Updated", "Sponsored Students", "Status"
    ];
    
    // Create CSV rows
    const rows = csvData.map(row => 
      headers.map(header => {
        const value = String(row[header] || '');
        // Handle CSV escaping
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
    );

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donors_export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error("Donor export error:", error);
    res.status(500).json({ error: "Failed to export donors data" });
  }
});

/**
 * GET /api/export/case-workers
 * Export all case worker data as CSV
 * Admin only
 */
router.get("/case-workers", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const caseWorkers = await prisma.user.findMany({
      where: { role: "SUB_ADMIN" }, // Internal role remains SUB_ADMIN
      include: {
        fieldReviews: {
          include: {
            student: { select: { name: true } },
            application: { select: { id: true } }
          }
        }
      }
    });

    const csvData = caseWorkers.map(officer => ({
      Name: officer.name || 'Not provided',
      Email: officer.email,
      'Join Date': format(new Date(officer.createdAt), 'yyyy-MM-dd'),
      'Total Assignments': officer.fieldReviews?.length || 0,
      'Completed Reviews': officer.fieldReviews?.filter(r => r.status === 'COMPLETED').length || 0,
      'Pending Reviews': officer.fieldReviews?.filter(r => r.status === 'PENDING').length || 0,
      'Current Applications': officer.fieldReviews
        ?.filter(r => r.status === 'PENDING')
        .map(r => `${r.student?.name} (${r.application?.id})`)
        .join('; ') || 'None'
    }));

    const csvString = csvData.length > 0 
      ? [
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => 
            Object.values(row).map(value => 
              typeof value === 'string' && value.includes(',') 
                ? `"${value.replace(/"/g, '""')}"` 
                : value
            ).join(',')
          )
        ].join('\n')
      : 'No case workers found';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="case-workers-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvString);

  } catch (error) {
    console.error("Case worker export error:", error);
    res.status(500).json({ error: "Failed to export case workers data" });
  }
});

/**
 * GET /api/export/sub-admins (Legacy endpoint - maintains compatibility)
 * Export all case worker data as CSV
 * Admin only
 */
router.get("/sub-admins", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const caseWorkers = await prisma.user.findMany({
      where: { role: "SUB_ADMIN" },
      include: {
        fieldReviews: {
          include: {
            application: {
              include: {
                student: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform data for CSV export
    const csvData = caseWorkers.map(officer => ({
      "Officer ID": officer.id,
      "Name": officer.name,
      "Email": officer.email,
      "Role": officer.role,
      "Total Reviews": officer.fieldReviews.length,
      "Pending Reviews": officer.fieldReviews.filter(r => r.status === "PENDING").length,
      "Approved Reviews": officer.fieldReviews.filter(r => r.status === "APPROVED").length,
      "Rejected Reviews": officer.fieldReviews.filter(r => r.status === "REJECTED").length,
      "Needs Info Reviews": officer.fieldReviews.filter(r => r.status === "NEEDS_INFO").length,
      "Last Review Date": officer.fieldReviews.length > 0 
        ? officer.fieldReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt.toISOString().split('T')[0]
        : "",
      "Account Created": officer.createdAt?.toISOString().split('T')[0] || "",
      "Last Updated": officer.updatedAt?.toISOString().split('T')[0] || "",
      "Reviewed Students": officer.fieldReviews.map(r => r.application?.student?.name).filter(Boolean).join("; "),
      "Status": officer.fieldReviews.length > 0 ? "Active Officer" : "Inactive"
    }));

    // Define CSV headers explicitly (ensures headers exist even with no data)
    const headers = [
      "Officer ID", "Name", "Email", "Role", "Total Reviews", "Pending Reviews", 
      "Approved Reviews", "Rejected Reviews", "Needs Info Reviews", "Last Review Date",
      "Account Created", "Last Updated", "Reviewed Students", "Status"
    ];
    
    // Create CSV rows
    const rows = csvData.map(row => 
      headers.map(header => {
        const value = String(row[header] || '');
        // Handle CSV escaping
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
    );

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="field_officers_export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error("Case worker export error:", error);
    res.status(500).json({ error: "Failed to export case workers data" });
  }
});

export default router;