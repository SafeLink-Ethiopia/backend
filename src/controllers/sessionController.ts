import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Session, Language } from "../models/Session";

const generateSafeLinkId = (): string => {
  return `SL-${randomBytes(4).toString("hex").toUpperCase()}`;
};

const isValidLanguage = (language: unknown): language is Language => {
  return language === "am" || language === "om" || language === "en";
};

// POST /session/create
export const createSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { language = "en", password } = req.body;

    // Validate language
    if (!isValidLanguage(language)) {
      res.status(400).json({
        message: "Invalid language. Use am, om, or en.",
      });
      return;
    }

    // Validate optional password/PIN
    if (password !== undefined && password !== null) {
      if (typeof password !== "string") {
        res.status(400).json({
          message: "Password must be a string.",
        });
        return;
      }

      if (password.length < 4 || password.length > 20) {
        res.status(400).json({
          message: "Password must be between 4 and 20 characters.",
        });
        return;
      }
    }

    // Hash password if provided
    let password_hash: string | null = null;

    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Generate unique SafeLink ID
    let safelink_id = generateSafeLinkId();

    while (await Session.exists({ safelink_id })) {
      safelink_id = generateSafeLinkId();
    }

    // Save session
    const session = await Session.create({
      safelink_id,
      password_hash,
      language,
    });

    // Never return password_hash
    res.status(201).json({
      message: "Private session created successfully",
      session: {
        safelink_id: session.safelink_id,
        language: session.language,
        created_at: session.created_at,
      },
    });
  } catch (error) {
    console.error("Create session error:", error);

    res.status(500).json({
      message: "Failed to create private session",
    });
  }
};

// POST /session/login
export const loginSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { safelink_id, password } = req.body;

    if (!safelink_id || typeof safelink_id !== "string") {
      res.status(400).json({
        message: "SafeLink ID is required.",
      });
      return;
    }

    const session = await Session.findOne({ safelink_id });

    if (!session) {
      res.status(401).json({
        message: "Invalid SafeLink ID or password.",
      });
      return;
    }

    // Protected session
    if (session.password_hash) {
      if (!password) {
        res.status(401).json({
          message: "Password is required for this session.",
        });
        return;
      }

      if (typeof password !== "string") {
        res.status(400).json({
          message: "Password must be a string.",
        });
        return;
      }

      const passwordMatch = await bcrypt.compare(
        password,
        session.password_hash,
      );

      if (!passwordMatch) {
        res.status(401).json({
          message: "Invalid SafeLink ID or password.",
        });
        return;
      }
    }

    res.status(200).json({
      message: "Session login successful",
      session: {
        safelink_id: session.safelink_id,
        language: session.language,
        created_at: session.created_at,
      },
    });
  } catch (error) {
    console.error("Login session error:", error);

    res.status(500).json({
      message: "Failed to login to session",
    });
  }
};

// GET /session/:id
export const getSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await Session.findOne({
      safelink_id: id,
    });

    if (!session) {
      res.status(404).json({
        message: "Session not found.",
      });
      return;
    }

    res.status(200).json({
      session: {
        safelink_id: session.safelink_id,
        language: session.language,
        created_at: session.created_at,
      },
    });
  } catch (error) {
    console.error("Get session error:", error);

    res.status(500).json({
      message: "Failed to get session.",
    });
  }
};
