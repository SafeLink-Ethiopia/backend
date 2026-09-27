import { Router } from "express";

import {
  createAdvisor,
  loginAdvisor,
  changeAdvisorPassword,
  logoutAdvisor,
  forgotAdvisorPassword,
  verifyAdvisorResetOtp,
  resetAdvisorPassword,
  getAllAdvisors,
  toggleAdvisorActive,
  deleteAdvisor,
  getAdvisorById,
  updateAdvisor,
} from "../controllers/advisorController";

import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin creates an advisor
router.post("/", adminAuthMiddleware, createAdvisor);

// =====================================================
// ADVISOR AUTHENTICATION ROUTES
// =====================================================

// Advisor login
router.post("/login", loginAdvisor);

// Advisor changes password
router.post("/change-password", advisorAuthMiddleware, changeAdvisorPassword);

// Advisor logout
router.post("/logout", advisorAuthMiddleware, logoutAdvisor);

// =====================================================
// FORGOT PASSWORD ROUTES
// =====================================================

// Request password reset OTP
router.post("/forgot-password", forgotAdvisorPassword);

// Verify password reset OTP
router.post("/verify-reset-otp", verifyAdvisorResetOtp);

// Reset password
router.post("/reset-password", resetAdvisorPassword);

router.get("/", adminAuthMiddleware, getAllAdvisors);
router.patch("/:advisor_id/active", adminAuthMiddleware, toggleAdvisorActive);
router.delete("/:advisor_id", adminAuthMiddleware, deleteAdvisor);
router.get("/:advisor_id", adminAuthMiddleware, getAdvisorById);
router.patch("/:advisor_id", adminAuthMiddleware, updateAdvisor);

export default router;
