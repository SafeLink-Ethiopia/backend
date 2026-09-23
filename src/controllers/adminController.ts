import { Request, Response } from "express";
import { AdminRequest } from "../middleware/adminAuthMiddleware";
import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin";
import jwt from "jsonwebtoken";
// POST /api/admin/setup
export const createAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { admin_id, password } = req.body;

    // Validate admin ID
    if (!admin_id || typeof admin_id !== "string") {
      res.status(400).json({
        message: "Admin ID is required.",
      });
      return;
    }

    // Validate password
    if (!password || typeof password !== "string") {
      res.status(400).json({
        message: "Password is required.",
      });
      return;
    }

    if (password.length < 8 || password.length > 72) {
      res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
      return;
    }

    // Only one admin is allowed
    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      res.status(409).json({
        message: "An admin account already exists.",
      });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create the single admin
    const admin = await Admin.create({
      admin_id: admin_id.trim(),
      password_hash,
    });

    res.status(201).json({
      message: "Admin account created successfully.",
      admin: {
        admin_id: admin.admin_id,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);

    res.status(500).json({
      message: "Failed to create admin account.",
    });
  }
}; // POST /api/admin/login
export const loginAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { admin_id, password } = req.body;

    // Validate admin ID
    if (!admin_id || typeof admin_id !== "string") {
      res.status(400).json({
        message: "Admin ID is required.",
      });
      return;
    }

    // Validate password
    if (!password || typeof password !== "string") {
      res.status(400).json({
        message: "Password is required.",
      });
      return;
    }

    // Find the admin
    const admin = await Admin.findOne({
      admin_id: admin_id.trim(),
    });

    if (!admin) {
      res.status(401).json({
        message: "Invalid Admin ID or password.",
      });
      return;
    }

    // Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      res.status(401).json({
        message: "Invalid Admin ID or password.",
      });
      return;
    }

    // Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        message: "JWT secret is not configured.",
      });
      return;
    }

    // Create JWT
    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        role: "admin",
        token_version: admin.token_version,
      },
      jwtSecret,
      {
        expiresIn: "2h",
      },
    );

    res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: {
        admin_id: admin.admin_id,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Failed to login as admin.",
    });
  }
};
// POST /api/admin/logout
export const logoutAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = (req as any).admin?.admin_id;

    if (!adminId) {
      res.status(401).json({
        message: "Admin authentication required.",
      });
      return;
    }

    const admin = await Admin.findOne({
      admin_id: adminId,
    });

    if (!admin) {
      res.status(401).json({
        message: "Admin account not found.",
      });
      return;
    }

    // Invalidate all currently issued JWTs
    admin.token_version += 1;

    await admin.save();

    res.status(200).json({
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    res.status(500).json({
      message: "Failed to logout admin.",
    });
  }
};
