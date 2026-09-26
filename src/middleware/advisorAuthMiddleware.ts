import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AdvisorTokenPayload {
  advisor_id: string;
  role: string;
}

export interface AdvisorRequest extends Request {
  advisor?: AdvisorTokenPayload;
}

export const advisorAuthMiddleware = async (
  req: AdvisorRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Invalid authorization format.",
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        message: "Authentication token is required.",
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

    // Verify JWT
    const decoded = jwt.verify(token, jwtSecret) as AdvisorTokenPayload;

    // Make sure this is an advisor token
    if (decoded.role !== "advisor" || !decoded.advisor_id) {
      res.status(403).json({
        message: "Advisor access required.",
      });
      return;
    }

    // Attach advisor information to request
    req.advisor = decoded;

    next();
  } catch (error) {
    console.error("Advisor authentication error:", error);

    res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};
