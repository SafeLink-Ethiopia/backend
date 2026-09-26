import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";

import Advisor from "../models/Advisor";
import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";
import {
  sendAdvisorCredentials,
  sendAdvisorResetOtp,
} from "../services/emailService";

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const generateAdvisorId = (): string => {
  return `ADV-${randomUUID()}`;
};

const generateTemporaryPassword = (): string => {
  return randomBytes(6).toString("base64url").slice(0, 10);
};

const generateOtp = (): string => {
  return randomInt(1000, 10000).toString();
};

const hashResetToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

// =====================================================
// CREATE ADVISOR
// =====================================================

export const createAdvisor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      email,
      gender,
      type,
      phone_number,
      location,
      working_hours,
      active,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!name || typeof name !== "string") {
      res.status(400).json({
        message: "Advisor name is required.",
      });
      return;
    }

    if (!email || typeof email !== "string") {
      res.status(400).json({
        message: "Advisor email is required.",
      });
      return;
    }

    if (!gender) {
      res.status(400).json({
        message: "Advisor gender is required.",
      });
      return;
    }

    if (!type) {
      res.status(400).json({
        message: "Advisor type is required.",
      });
      return;
    }

    if (!phone_number || typeof phone_number !== "string") {
      res.status(400).json({
        message: "Phone number is required.",
      });
      return;
    }

    if (!location || typeof location !== "string") {
      res.status(400).json({
        message: "Location is required.",
      });
      return;
    }

    if (
      !working_hours ||
      typeof working_hours !== "object" ||
      !working_hours.start ||
      !working_hours.end
    ) {
      res.status(400).json({
        message: "Working hours are required.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -------------------------------------------------
    // CHECK EXISTING EMAIL
    // -------------------------------------------------

    const existingAdvisor = await Advisor.findOne({
      email: normalizedEmail,
    });

    if (existingAdvisor) {
      res.status(409).json({
        message: "An advisor with this email already exists.",
      });
      return;
    }

    // -------------------------------------------------
    // GENERATE ADVISOR ID
    // -------------------------------------------------

    const advisor_id = generateAdvisorId();

    // -------------------------------------------------
    // GENERATE TEMPORARY PASSWORD
    // -------------------------------------------------

    const temporaryPassword = generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // -------------------------------------------------
    // CREATE ADVISOR
    // -------------------------------------------------

    const advisor = await Advisor.create({
      advisor_id,

      name: name.trim(),

      email: normalizedEmail,

      gender,

      type,

      phone_number: phone_number.trim(),

      location: location.trim(),

      working_hours: {
        start: working_hours.start,
        end: working_hours.end,
      },

      active: active !== undefined ? active : true,

      passwordHash,

      mustChangePassword: true,

      resetOtpHash: null,
      resetOtpExpires: null,
      resetOtpAttempts: 0,

      resetTokenHash: null,
      resetTokenExpires: null,
    });

    // -------------------------------------------------
    // SEND LOGIN CREDENTIALS BY EMAIL
    // -------------------------------------------------

    try {
      await sendAdvisorCredentials(
        advisor.email,
        advisor.name,
        advisor.advisor_id,
        temporaryPassword,
      );
    } catch (emailError) {
      console.error("Send advisor credentials email error:", emailError);

      // If the email cannot be sent, remove the advisor
      // so an account is not created without credentials
      // being delivered.
      await Advisor.deleteOne({
        _id: advisor._id,
      });

      res.status(500).json({
        message:
          "Advisor account could not be created because the credentials email could not be sent.",
      });

      return;
    }

    // -------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------

    res.status(201).json({
      message: "Advisor created successfully.",

      advisor: {
        id: advisor._id,
        advisor_id: advisor.advisor_id,
        name: advisor.name,
        email: advisor.email,
        gender: advisor.gender,
        type: advisor.type,
        phone_number: advisor.phone_number,
        location: advisor.location,
        working_hours: advisor.working_hours,
        active: advisor.active,
        mustChangePassword: advisor.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Create advisor error:", error);

    res.status(500).json({
      message: "Failed to create advisor.",
    });
  }
};

// =====================================================
// ADVISOR LOGIN
// =====================================================

export const loginAdvisor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { advisor_id, password } = req.body;

    // -------------------------------------------------
    // VALIDATE ADVISOR ID
    // -------------------------------------------------

    if (!advisor_id || typeof advisor_id !== "string") {
      res.status(400).json({
        message: "Advisor ID is required.",
      });
      return;
    }

    // -------------------------------------------------
    // VALIDATE PASSWORD
    // -------------------------------------------------

    if (!password || typeof password !== "string") {
      res.status(400).json({
        message: "Password is required.",
      });
      return;
    }

    // -------------------------------------------------
    // FIND ADVISOR
    // -------------------------------------------------

    const advisor = await Advisor.findOne({
      advisor_id: advisor_id.trim(),
    });

    if (!advisor) {
      res.status(401).json({
        message: "Invalid advisor ID or password.",
      });
      return;
    }

    // -------------------------------------------------
    // CHECK ACCOUNT STATUS
    // -------------------------------------------------

    if (!advisor.active) {
      res.status(403).json({
        message: "This advisor account is inactive.",
      });
      return;
    }

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    const passwordMatch = await bcrypt.compare(password, advisor.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({
        message: "Invalid advisor ID or password.",
      });
      return;
    }

    // -------------------------------------------------
    // JWT SECRET
    // -------------------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        message: "JWT secret is not configured.",
      });
      return;
    }

    // -------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------

    const token = jwt.sign(
      {
        advisor_id: advisor.advisor_id,
        role: "advisor",
      },
      jwtSecret,
      {
        expiresIn: "2h",
      },
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.status(200).json({
      message: "Advisor login successful.",

      token,

      advisor: {
        advisor_id: advisor.advisor_id,
        name: advisor.name,
        email: advisor.email,
        gender: advisor.gender,
        type: advisor.type,
        phone_number: advisor.phone_number,
        location: advisor.location,
        working_hours: advisor.working_hours,
        active: advisor.active,
        mustChangePassword: advisor.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Advisor login error:", error);

    res.status(500).json({
      message: "Failed to login advisor.",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changeAdvisorPassword = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || typeof newPassword !== "string") {
      res.status(400).json({
        message: "New password is required.",
      });
      return;
    }

    if (!confirmPassword || typeof confirmPassword !== "string") {
      res.status(400).json({
        message: "Confirm password is required.",
      });
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        message: "Passwords do not match.",
      });
      return;
    }

    const advisor = await Advisor.findOne({
      advisor_id,
    });

    if (!advisor) {
      res.status(404).json({
        message: "Advisor account not found.",
      });
      return;
    }

    if (!advisor.active) {
      res.status(403).json({
        message: "This advisor account is inactive.",
      });
      return;
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      advisor.passwordHash,
    );

    if (samePassword) {
      res.status(400).json({
        message: "New password must be different from the current password.",
      });
      return;
    }

    advisor.passwordHash = await bcrypt.hash(newPassword, 10);

    advisor.mustChangePassword = false;

    await advisor.save();

    res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change advisor password error:", error);

    res.status(500).json({
      message: "Failed to change password.",
    });
  }
};

// =====================================================
// LOGOUT
// =====================================================

export const logoutAdvisor = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    res.status(200).json({
      message: "Advisor logged out successfully.",
    });
  } catch (error) {
    console.error("Advisor logout error:", error);

    res.status(500).json({
      message: "Failed to logout advisor.",
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotAdvisorPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        message: "Email is required.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const advisor = await Advisor.findOne({
      email: normalizedEmail,
    });

    /*
     * We intentionally return the same response whether
     * the email exists or not.
     */

    if (!advisor || !advisor.active) {
      res.status(200).json({
        message:
          "If an advisor account exists with this email, a verification code has been sent.",
      });
      return;
    }

    // -------------------------------------------------
    // GENERATE OTP
    // -------------------------------------------------

    const otp = generateOtp();

    const otpHash = await bcrypt.hash(otp, 10);

    advisor.resetOtpHash = otpHash;

    advisor.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    advisor.resetOtpAttempts = 0;

    // Invalidate previous reset token
    advisor.resetTokenHash = null;
    advisor.resetTokenExpires = null;

    await advisor.save();

    // -------------------------------------------------
    // SEND OTP THROUGH BREVO
    // -------------------------------------------------

    try {
      await sendAdvisorResetOtp(advisor.email, advisor.name, otp);
    } catch (emailError) {
      console.error("Send reset OTP email error:", emailError);

      // Remove OTP if email delivery failed
      advisor.resetOtpHash = null;
      advisor.resetOtpExpires = null;
      advisor.resetOtpAttempts = 0;

      await advisor.save();

      res.status(500).json({
        message: "Failed to send password reset email.",
      });

      return;
    }

    res.status(200).json({
      message:
        "If an advisor account exists with this email, a verification code has been sent.",
    });
  } catch (error) {
    console.error("Forgot advisor password error:", error);

    res.status(500).json({
      message: "Failed to process password reset request.",
    });
  }
};

// =====================================================
// VERIFY RESET OTP
// =====================================================

export const verifyAdvisorResetOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        message: "Email is required.",
      });
      return;
    }

    if (!otp || typeof otp !== "string") {
      res.status(400).json({
        message: "OTP is required.",
      });
      return;
    }

    if (!/^\d{4}$/.test(otp)) {
      res.status(400).json({
        message: "OTP must be a 4-digit number.",
      });
      return;
    }

    const advisor = await Advisor.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!advisor) {
      res.status(400).json({
        message: "Invalid or expired OTP.",
      });
      return;
    }

    if (!advisor.resetOtpHash || !advisor.resetOtpExpires) {
      res.status(400).json({
        message: "Invalid or expired OTP.",
      });
      return;
    }

    if (advisor.resetOtpExpires.getTime() < Date.now()) {
      advisor.resetOtpHash = null;
      advisor.resetOtpExpires = null;
      advisor.resetOtpAttempts = 0;

      await advisor.save();

      res.status(400).json({
        message: "OTP has expired. Please request a new code.",
      });
      return;
    }

    if (advisor.resetOtpAttempts >= 5) {
      res.status(429).json({
        message: "Too many incorrect OTP attempts. Please request a new code.",
      });
      return;
    }

    const otpMatch = await bcrypt.compare(otp, advisor.resetOtpHash);

    if (!otpMatch) {
      advisor.resetOtpAttempts += 1;

      await advisor.save();

      res.status(400).json({
        message: "Invalid OTP.",
      });
      return;
    }

    // -------------------------------------------------
    // OTP CORRECT
    // -------------------------------------------------

    const resetToken = randomBytes(32).toString("hex");

    const resetTokenHash = hashResetToken(resetToken);

    advisor.resetTokenHash = resetTokenHash;

    advisor.resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Make OTP single-use
    advisor.resetOtpHash = null;
    advisor.resetOtpExpires = null;
    advisor.resetOtpAttempts = 0;

    await advisor.save();

    res.status(200).json({
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Verify advisor reset OTP error:", error);

    res.status(500).json({
      message: "Failed to verify OTP.",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetAdvisorPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        message: "Email is required.",
      });
      return;
    }

    if (!resetToken || typeof resetToken !== "string") {
      res.status(400).json({
        message: "Reset token is required.",
      });
      return;
    }

    if (!newPassword || typeof newPassword !== "string") {
      res.status(400).json({
        message: "New password is required.",
      });
      return;
    }

    if (!confirmPassword || typeof confirmPassword !== "string") {
      res.status(400).json({
        message: "Confirm password is required.",
      });
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        message: "Passwords do not match.",
      });
      return;
    }

    const advisor = await Advisor.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!advisor) {
      res.status(400).json({
        message: "Invalid or expired reset token.",
      });
      return;
    }

    if (!advisor.resetTokenHash || !advisor.resetTokenExpires) {
      res.status(400).json({
        message: "Invalid or expired reset token.",
      });
      return;
    }

    if (advisor.resetTokenExpires.getTime() < Date.now()) {
      advisor.resetTokenHash = null;
      advisor.resetTokenExpires = null;

      await advisor.save();

      res.status(400).json({
        message:
          "Reset session has expired. Please request a new password reset.",
      });
      return;
    }

    const providedTokenHash = hashResetToken(resetToken);

    if (providedTokenHash !== advisor.resetTokenHash) {
      res.status(400).json({
        message: "Invalid or expired reset token.",
      });
      return;
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      advisor.passwordHash,
    );

    if (samePassword) {
      res.status(400).json({
        message: "New password must be different from the old password.",
      });
      return;
    }

    advisor.passwordHash = await bcrypt.hash(newPassword, 10);

    advisor.mustChangePassword = false;

    // Invalidate reset token
    advisor.resetTokenHash = null;
    advisor.resetTokenExpires = null;

    // Clear OTP fields
    advisor.resetOtpHash = null;
    advisor.resetOtpExpires = null;
    advisor.resetOtpAttempts = 0;

    await advisor.save();

    res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset advisor password error:", error);

    res.status(500).json({
      message: "Failed to reset password.",
    });
  }
};
