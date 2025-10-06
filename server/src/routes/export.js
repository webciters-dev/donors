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
      'Need USD',
      'Need PKR',
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
        app.needUSD || '',
        app.needPKR || '',
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
        fromFieldOfficers: await prisma.message.count({ where: { fromRole: 'field_officer' } }),
      },
      users: {
        total: await prisma.user.count(),
        admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
        students: await prisma.user.count({ where: { role: 'STUDENT' } }),
        fieldOfficers: await prisma.user.count({ where: { role: 'FIELD_OFFICER' } }),
      },
      exportedAt: new Date().toISOString(),
    };

    res.json(stats);
    
  } catch (error) {
    console.error("Statistics export error:", error);
    res.status(500).json({ error: "Failed to export statistics" });
  }
});

export default router;