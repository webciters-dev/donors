// server/src/routes/conversations.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/conversations
 * Get all conversations for the current user
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const includeAllMessages = req.query.includeAllMessages === 'true';
    
    console.log("🔍 Conversations API called by user:", userId);
    console.log("🔍 Include all messages:", includeAllMessages);

    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            field: true
          }
        },
        application: {
          select: {
            id: true,
            term: true,
            status: true
          }
        },
        messages: {
          orderBy: {
            createdAt: includeAllMessages ? 'asc' : 'desc'
          },
          ...(includeAllMessages ? {} : { take: 1 }),
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    res.json({ conversations });
  } catch (err) {
    console.error("❌ Failed to fetch conversations:", err);
    console.error("❌ Error details:", err.message);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({ error: "Failed to fetch conversations", details: err.message });
  }
});

/**
 * GET /api/conversations/:id
 * Get a specific conversation with all messages
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participantIds: {
          has: userId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            field: true,
            program: true,
            personalIntroduction: true
          }
        },
        application: {
          select: {
            id: true,
            term: true,
            status: true,
            needUSD: true,
            needPKR: true,
            currency: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Mark messages as read by current user
    await prisma.conversationMessage.updateMany({
      where: {
        conversationId: id,
        NOT: {
          readBy: {
            has: userId
          }
        }
      },
      data: {
        readBy: {
          push: userId
        }
      }
    });

    res.json({ conversation });
  } catch (err) {
    console.error("❌ Failed to fetch conversation:", err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

/**
 * POST /api/conversations
 * Create a new conversation between donor and student
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { studentId, applicationId, type = 'DONOR_STUDENT', initialMessage } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    if (!initialMessage) {
      return res.status(400).json({ error: "initialMessage is required" });
    }

    // Check if conversation already exists between these participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        studentId,
        applicationId: applicationId || null,
        type,
        participantIds: {
          hasEvery: [userId, studentId]
        }
      }
    });

    if (existingConversation) {
      return res.status(400).json({ 
        error: "Conversation already exists",
        conversationId: existingConversation.id 
      });
    }

    // Get student info to include in participants
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        User: {
          select: { id: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentUserId = student.User?.id;
    if (!studentUserId) {
      return res.status(400).json({ error: "Student does not have a user account" });
    }

    // Create conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        type,
        participantIds: [userId, studentUserId],
        studentId,
        applicationId: applicationId || null,
        messages: {
          create: {
            senderId: userId,
            senderRole: userRole,
            text: initialMessage,
            readBy: [userId]
          }
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            field: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ conversation });
  } catch (err) {
    console.error("❌ Failed to create conversation:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message in an existing conversation
 */
router.post("/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participantIds: {
          has: userId
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.conversationMessage.create({
        data: {
          conversationId: id,
          senderId: userId,
          senderRole: userRole,
          text: text.trim(),
          readBy: [userId]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          lastMessageAt: new Date()
        }
      })
    ]);

    res.status(201).json({ message });
  } catch (err) {
    console.error("❌ Failed to send message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;