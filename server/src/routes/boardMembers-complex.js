import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, onlyRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/boardMembers - Get all board members (Admin only)
router.get('/', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const boardMembers = await prisma.boardMember.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            interviewPanels: true,
            decisions: true
          }
        }
      }
    });

    res.json({ success: true, data: boardMembers });
  } catch (error) {
    console.error('Error fetching board members:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch board members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/boardMembers/active - Get only active board members
router.get('/active', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const activeBoardMembers = await prisma.boardMember.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        title: true
      }
    });

    res.json({ success: true, data: activeBoardMembers });
  } catch (error) {
    console.error('Error fetching active board members:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch active board members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/boardMembers/:id - Get specific board member (Admin only)
router.get('/:id', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const boardMember = await prisma.boardMember.findUnique({
      where: { id: parseInt(id) },
      include: {
        interviewPanels: {
          include: {
            interview: {
              include: {
                student: { select: { name: true, email: true } },
                application: { select: { id: true, status: true } }
              }
            }
          }
        },
        decisions: {
          include: {
            interview: {
              include: {
                student: { select: { name: true, email: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!boardMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Board member not found' 
      });
    }

    res.json({ success: true, data: boardMember });
  } catch (error) {
    console.error('Error fetching board member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch board member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/boardMembers - Create new board member (Admin only)
router.post('/', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, title, isActive = true } = req.body;

    // Validation
    if (!name || !email || !title) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and title are required'
      });
    }

    // Check if email already exists
    const existingMember = await prisma.boardMember.findUnique({
      where: { email }
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'Board member with this email already exists'
      });
    }

    // Create new board member
    const boardMember = await prisma.boardMember.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        title: title.trim(),
        isActive: Boolean(isActive)
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Board member created successfully',
      data: boardMember 
    });
  } catch (error) {
    console.error('Error creating board member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create board member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/boardMembers/:id - Update board member (Admin only)
router.put('/:id', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, title, isActive } = req.body;

    // Check if board member exists
    const existingMember = await prisma.boardMember.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Board member not found' 
      });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.toLowerCase().trim() !== existingMember.email) {
      const emailExists = await prisma.boardMember.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Board member with this email already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (title !== undefined) updateData.title = title.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    // Update board member
    const updatedBoardMember = await prisma.boardMember.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ 
      success: true, 
      message: 'Board member updated successfully',
      data: updatedBoardMember 
    });
  } catch (error) {
    console.error('Error updating board member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update board member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/boardMembers/:id - Soft delete board member (Admin only)
router.delete('/:id', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if board member exists
    const existingMember = await prisma.boardMember.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            interviewPanels: true,
            decisions: true
          }
        }
      }
    });

    if (!existingMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Board member not found' 
      });
    }

    // Check if board member has any interview involvement
    if (existingMember._count.interviewPanels > 0 || existingMember._count.decisions > 0) {
      // Soft delete - just mark as inactive
      const deactivatedMember = await prisma.boardMember.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return res.json({ 
        success: true, 
        message: 'Board member deactivated successfully (has interview history)',
        data: deactivatedMember 
      });
    } else {
      // Hard delete if no interview involvement
      await prisma.boardMember.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Board member deleted successfully' 
      });
    }
  } catch (error) {
    console.error('Error deleting board member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete board member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/boardMembers/:id/toggle-status - Toggle active status (Admin only)
router.patch('/:id/toggle-status', requireAuth, onlyRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const boardMember = await prisma.boardMember.findUnique({
      where: { id: parseInt(id) }
    });

    if (!boardMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Board member not found' 
      });
    }

    const updatedMember = await prisma.boardMember.update({
      where: { id: parseInt(id) },
      data: { isActive: !boardMember.isActive }
    });

    res.json({ 
      success: true, 
      message: `Board member ${updatedMember.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedMember 
    });
  } catch (error) {
    console.error('Error toggling board member status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle board member status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;