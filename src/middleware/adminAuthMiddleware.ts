import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";

interface AdminTokenPayload {
  admin_id: string;
  role: string;
  token_version: number;
}

export interface AdminRequest extends Request {
  admin?: AdminTokenPayload;
}

export const adminAuthMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Admin authentication required.",
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Invalid authorization format.",
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        message: "Authentication token is required.",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        message: "JWT secret is not configured.",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as AdminTokenPayload;

    if (decoded.role !== "admin" || !decoded.admin_id) {
      res.status(403).json({
        message: "Admin access required.",
      });
      return;
    }

    const admin = await Admin.findOne({
      admin_id: decoded.admin_id,
    });

    if (!admin) {
      res.status(401).json({
        message: "Admin account not found.",
      });
      return;
    }

    if (decoded.token_version !== admin.token_version) {
      res.status(401).json({
        message: "Admin session has been logged out.",
      });
      return;
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);

    res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};
