import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, onlyRoles } from '../middleware/auth.js';
import { requireBasicRecaptcha } from '../middleware/recaptcha.js';
import { 
  sendInterviewScheduledStudentEmail, 
  sendInterviewScheduledBoardMemberEmail 
} from '../lib/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/interviews - Get all interviews (Admin only)
router.get('/', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const interviews = await prisma.interview.findMany({
      include: {
        student: { select: { name: true, email: true } },
        application: { select: { id: true, status: true } },
        panelMembers: {
          include: {
            boardMember: { select: { name: true, title: true } }
          }
        },
        decisions: {
          include: {
            boardMember: { select: { name: true } }
          }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json({ success: true, data: interviews });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch interviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/interviews/:id - Get specific interview (Admin only)
router.get('/:id', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.findUnique({
      where: { id: id },
      include: {
        student: { select: { name: true, email: true, phone: true } },
        application: { select: { id: true, status: true, submittedAt: true } },
        panelMembers: {
          include: {
            boardMember: { select: { name: true, email: true, title: true } }
          }
        },
        decisions: {
          include: {
            boardMember: { select: { name: true, title: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/interviews - Schedule new interview (Admin only)
router.post('/', requireAuth, onlyRoles('ADMIN'), requireBasicRecaptcha, async (req, res) => {
  try {
    const { 
      studentId, 
      applicationId, 
      scheduledAt, 
      meetingLink, 
      notes,
      boardMemberIds = [] 
    } = req.body;

    // Validation
    if (!studentId || !applicationId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Application ID, and scheduled date/time are required'
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify application exists and belongs to student
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });
    if (!application || application.studentId !== studentId) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or does not belong to this student'
      });
    }

    // Check if interview already exists for this application
    const existingInterview = await prisma.interview.findFirst({
      where: { applicationId: applicationId }
    });
    if (existingInterview) {
      return res.status(409).json({
        success: false,
        message: 'Interview already scheduled for this application'
      });
    }

    // Verify board members exist if provided
    if (boardMemberIds.length > 0) {
      const boardMembers = await prisma.boardMember.findMany({
        where: { 
          id: { in: boardMemberIds },
          isActive: true 
        }
      });
      if (boardMembers.length !== boardMemberIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more board members not found or inactive'
        });
      }
    }

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        studentId,
        applicationId,
        scheduledAt: new Date(scheduledAt),
        meetingLink: meetingLink || null,
        notes: notes || null,
        status: 'SCHEDULED'
      },
      include: {
        student: { select: { name: true, email: true } },
        application: { select: { id: true, status: true } }
      }
    });

    // Add board members to panel if provided
    if (boardMemberIds.length > 0) {
      const panelMemberData = boardMemberIds.map(boardMemberId => ({
        interviewId: interview.id,
        boardMemberId: boardMemberId
      }));

      await prisma.interviewPanelMember.createMany({
        data: panelMemberData
      });
    }

    // Update application status to INTERVIEW_SCHEDULED
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' }
    });

    // Fetch the complete interview data to return
    const completeInterview = await prisma.interview.findUnique({
      where: { id: interview.id },
      include: {
        student: { select: { name: true, email: true } },
        application: { select: { id: true, status: true } },
        panelMembers: {
          include: {
            boardMember: { 
              select: { id: true, name: true, email: true, title: true } 
            }
          }
        }
      }
    });

    // Send email notifications
    try {
      // 1. Send email to student
      if (completeInterview.student.email) {
        console.log('📧 Sending interview notification email to student:', completeInterview.student.name);
        await sendInterviewScheduledStudentEmail({
          email: completeInterview.student.email,
          name: completeInterview.student.name,
          interviewId: completeInterview.id,
          scheduledAt: completeInterview.scheduledAt,
          meetingLink: completeInterview.meetingLink,
          boardMembers: completeInterview.panelMembers.map(pm => pm.boardMember),
          notes: completeInterview.notes,
          applicationId: completeInterview.applicationId
        });
        console.log('✅ Student notification email sent successfully');
      }

      // 2. Send emails to board members
      if (completeInterview.panelMembers && completeInterview.panelMembers.length > 0) {
        console.log('📧 Sending interview assignment emails to', completeInterview.panelMembers.length, 'board members');
        
        for (const panelMember of completeInterview.panelMembers) {
          if (panelMember.boardMember.email) {
            await sendInterviewScheduledBoardMemberEmail({
              email: panelMember.boardMember.email,
              name: panelMember.boardMember.name,
              title: panelMember.boardMember.title,
              studentName: completeInterview.student.name,
              interviewId: completeInterview.id,
              scheduledAt: completeInterview.scheduledAt,
              meetingLink: completeInterview.meetingLink,
              notes: completeInterview.notes,
              applicationId: completeInterview.applicationId,
              isChairperson: panelMember.isChairperson
            });
            console.log(`✅ Board member notification sent to: ${panelMember.boardMember.name}`);
          }
        }
        
        console.log('✅ All board member notification emails sent successfully');
      }
      
    } catch (emailError) {
      console.error('⚠️ Email notification failed (interview still created):', emailError);
      // Don't fail the interview creation if emails fail
    }

    res.status(201).json({ 
      success: true, 
      message: 'Interview scheduled successfully and notifications sent',
      data: completeInterview 
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to schedule interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/interviews/:id - Update interview (Admin only)
router.put('/:id', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt, meetingLink, notes, status, boardMemberIds } = req.body;

    // Check if interview exists
    const existingInterview = await prisma.interview.findUnique({
      where: { id: id }
    });

    if (!existingInterview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }

    // Prepare update data
    const updateData = {};
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) updateData.status = status;

    // Update interview
    const updatedInterview = await prisma.interview.update({
      where: { id: id },
      data: updateData
    });

    // Update panel members if provided
    if (boardMemberIds !== undefined) {
      // Remove existing panel members
      await prisma.interviewPanelMember.deleteMany({
        where: { interviewId: id }
      });

      // Add new panel members if provided
      if (boardMemberIds.length > 0) {
        // Verify board members exist and are active
        const boardMembers = await prisma.boardMember.findMany({
          where: { 
            id: { in: boardMemberIds },
            isActive: true 
          }
        });
        if (boardMembers.length !== boardMemberIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more board members not found or inactive'
          });
        }

        const panelMemberData = boardMemberIds.map(boardMemberId => ({
          interviewId: id,
          boardMemberId: boardMemberId
        }));

        await prisma.interviewPanelMember.createMany({
          data: panelMemberData
        });
      }
    }

    // Fetch updated interview with relations
    const completeInterview = await prisma.interview.findUnique({
      where: { id: id },
      include: {
        student: { select: { name: true, email: true } },
        application: { select: { id: true, status: true } },
        panelMembers: {
          include: {
            boardMember: { select: { name: true, title: true } }
          }
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Interview updated successfully',
      data: completeInterview 
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/interviews/:id/decision - Record board member decision (Admin only)
router.post('/:id/decision', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id: interviewId } = req.params;
    const { boardMemberId, decision, comments } = req.body;

    // Validation
    if (!boardMemberId || !decision) {
      return res.status(400).json({
        success: false,
        message: 'Board member ID and decision are required'
      });
    }

    if (!['APPROVE', 'REJECT', 'ABSTAIN'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be APPROVE, REJECT, or ABSTAIN'
      });
    }

    // Verify interview exists
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify board member is part of this interview panel
    const panelMember = await prisma.interviewPanelMember.findFirst({
      where: {
        interviewId: interviewId,
        boardMemberId: boardMemberId
      }
    });
    if (!panelMember) {
      return res.status(403).json({
        success: false,
        message: 'Board member is not part of this interview panel'
      });
    }

    // Check if decision already exists (upsert behavior)
    const existingDecision = await prisma.interviewDecision.findFirst({
      where: {
        interviewId: interviewId,
        boardMemberId: boardMemberId
      }
    });

    let interviewDecision;
    if (existingDecision) {
      // Update existing decision
      interviewDecision = await prisma.interviewDecision.update({
        where: { id: existingDecision.id },
        data: {
          decision,
          comments: comments || null
        },
        include: {
          boardMember: { select: { name: true, title: true } }
        }
      });
    } else {
      // Create new decision
      interviewDecision = await prisma.interviewDecision.create({
        data: {
          interviewId,
          boardMemberId,
          decision,
          comments: comments || null
        },
        include: {
          boardMember: { select: { name: true, title: true } }
        }
      });
    }

    // Check if all panel members have made decisions
    const allDecisions = await prisma.interviewDecision.findMany({
      where: { interviewId: interviewId }
    });

    const panelSize = await prisma.interviewPanelMember.count({
      where: { interviewId: interviewId }
    });

    if (allDecisions.length === panelSize) {
      // All decisions are in - determine overall outcome
      const approvals = allDecisions.filter(d => d.decision === 'APPROVE').length;
      const rejections = allDecisions.filter(d => d.decision === 'REJECT').length;
      const abstentions = allDecisions.filter(d => d.decision === 'ABSTAIN').length;

      // Simple majority rule (you can customize this logic)
      let finalStatus = 'INTERVIEW_COMPLETED';
      let applicationStatus = 'INTERVIEW_COMPLETED';

      if (approvals > rejections) {
        applicationStatus = 'BOARD_APPROVED';
      }

      // Update interview status
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' }
      });

      // Update application status
      await prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: applicationStatus }
      });
    }

    res.json({ 
      success: true, 
      message: 'Decision recorded successfully',
      data: interviewDecision 
    });

  } catch (error) {
    console.error('Error recording decision:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record decision',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/interviews/:id/decisions - Get all decisions for an interview (Admin only)
router.get('/:id/decisions', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id: interviewId } = req.params;

    const decisions = await prisma.interviewDecision.findMany({
      where: { interviewId: interviewId },
      include: {
        boardMember: { select: { name: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: decisions });
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch decisions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;