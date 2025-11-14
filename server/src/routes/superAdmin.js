// server/src/routes/superAdmin.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireSuperAdmin, requireAdminOrSuperAdmin } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/super-admin/admins
// SUPER_ADMIN only: List all admin users (excluding SUPER_ADMIN users)
router.get("/admins", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "desc" },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        createdAt: true,
        updatedAt: true
      },
    });

    res.json({ 
      success: true,
      admins,
      count: admins.length
    });
  } catch (error) {
    console.error("GET /api/super-admin/admins failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve admin users" 
    });
  }
});

// POST /api/super-admin/admins
// SUPER_ADMIN only: Create a new admin user
router.post("/admins", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Name, email, and password are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters long" 
      });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (existing) {
      return res.status(409).json({ 
        success: false,
        error: "Email address is already registered" 
      });
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(String(password), 12);
    
    const newAdmin = await prisma.user.create({
      data: { 
        name: name?.trim() || null, 
        email: email.toLowerCase().trim(), 
        passwordHash, 
        role: "ADMIN" 
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        createdAt: true 
      }
    });

    res.status(201).json({ 
      success: true,
      admin: newAdmin,
      message: "Admin user created successfully"
    });

    // Log the action for security
    console.log(`SUPER_ADMIN ${req.user.email} created new ADMIN: ${newAdmin.email}`);

  } catch (error) {
    console.error("POST /api/super-admin/admins failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create admin user" 
    });
  }
});

// PATCH /api/super-admin/admins/:id
// SUPER_ADMIN only: Update admin user credentials (name, email, password)
router.patch("/admins/:id", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body || {};

    if (!id) {
      return res.status(400).json({ 
        success: false,
        error: "Admin ID is required" 
      });
    }

    // Verify the target user exists and is an admin
    const existingAdmin = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!existingAdmin) {
      return res.status(404).json({ 
        success: false,
        error: "Admin user not found" 
      });
    }

    if (existingAdmin.role !== "ADMIN") {
      return res.status(403).json({ 
        success: false,
        error: "Can only modify ADMIN users" 
      });
    }

    // Build update data
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }
    
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      
      // Check if new email is already taken by another user
      if (trimmedEmail !== existingAdmin.email) {
        const emailExists = await prisma.user.findUnique({ 
          where: { email: trimmedEmail } 
        });
        
        if (emailExists) {
          return res.status(409).json({ 
            success: false,
            error: "Email address is already in use" 
          });
        }
      }
      
      updateData.email = trimmedEmail;
    }
    
    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false,
          error: "Password must be at least 6 characters long" 
        });
      }
      updateData.passwordHash = await bcrypt.hash(String(password), 12);
    }

    // Update the admin user
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        updatedAt: true
      }
    });

    res.json({ 
      success: true,
      admin: updatedAdmin,
      message: "Admin user updated successfully"
    });

    // Log the action for security
    console.log(`SUPER_ADMIN ${req.user.email} updated ADMIN: ${updatedAdmin.email}`);

  } catch (error) {
    console.error("PATCH /api/super-admin/admins/:id failed:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ 
        success: false,
        error: "Admin user not found" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Failed to update admin user" 
    });
  }
});

// DELETE /api/super-admin/admins/:id
// SUPER_ADMIN only: Delete an admin user (with safety checks)
router.delete("/admins/:id", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        error: "Admin ID is required" 
      });
    }

    // Verify the target user exists and is an admin
    const existingAdmin = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!existingAdmin) {
      return res.status(404).json({ 
        success: false,
        error: "Admin user not found" 
      });
    }

    if (existingAdmin.role !== "ADMIN") {
      return res.status(403).json({ 
        success: false,
        error: "Can only delete ADMIN users" 
      });
    }

    // Prevent self-deletion (in case a SUPER_ADMIN somehow targets themselves)
    if (existingAdmin.id === req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: "Cannot delete yourself" 
      });
    }

    // Check if this is the last admin user
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    if (adminCount <= 1) {
      return res.status(403).json({ 
        success: false,
        error: "Cannot delete the last admin user. Create another admin first." 
      });
    }

    // Delete the admin user
    await prisma.user.delete({
      where: { id }
    });

    res.json({ 
      success: true,
      message: "Admin user deleted successfully",
      deletedAdmin: {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email
      }
    });

    // Log the action for security
    console.log(`SUPER_ADMIN ${req.user.email} deleted ADMIN: ${existingAdmin.email}`);

  } catch (error) {
    console.error("DELETE /api/super-admin/admins/:id failed:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ 
        success: false,
        error: "Admin user not found" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Failed to delete admin user" 
    });
  }
});

// GET /api/super-admin/me
// Get current SUPER_ADMIN user info
router.get("/me", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const superAdmin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!superAdmin) {
      return res.status(404).json({ 
        success: false,
        error: "Super admin user not found" 
      });
    }

    res.json({ 
      success: true,
      superAdmin
    });

  } catch (error) {
    console.error("GET /api/super-admin/me failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve user information" 
    });
  }
});

// PATCH /api/super-admin/me
// SUPER_ADMIN can update their own credentials
router.patch("/me", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const { name, email, password, currentPassword } = req.body || {};

    // For security, require current password when changing sensitive info
    if ((email !== undefined || password !== undefined) && !currentPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Current password is required to change email or password" 
      });
    }

    // Verify current password if provided
    if (currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
      });

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false,
          error: "Current password is incorrect" 
        });
      }
    }

    // Build update data
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }
    
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      
      // Check if new email is already taken
      if (trimmedEmail !== req.user.email) {
        const emailExists = await prisma.user.findUnique({ 
          where: { email: trimmedEmail } 
        });
        
        if (emailExists) {
          return res.status(409).json({ 
            success: false,
            error: "Email address is already in use" 
          });
        }
      }
      
      updateData.email = trimmedEmail;
    }
    
    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false,
          error: "Password must be at least 6 characters long" 
        });
      }
      updateData.passwordHash = await bcrypt.hash(String(password), 12);
    }

    // Update the super admin user
    const updatedSuperAdmin = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        updatedAt: true
      }
    });

    res.json({ 
      success: true,
      superAdmin: updatedSuperAdmin,
      message: "Profile updated successfully"
    });

    // Log the action for security
    console.log(`SUPER_ADMIN ${req.user.email} updated their own profile`);

  } catch (error) {
    console.error("PATCH /api/super-admin/me failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update profile" 
    });
  }
});

export default router;