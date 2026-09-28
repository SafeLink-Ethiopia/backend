import { Router } from "express";
import * as advisorController from "../controllers/advisorController";
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

router.post("/request", advisorController.requestAdvisor);
router.get("/conversations", advisorController.getConversations);
router.get("/conversation/:id", advisorController.getConversation);
router.post("/conversation/:id/message", advisorController.postMessage);
router.patch("/conversation/:id/message/:index", advisorController.patchMessage);
router.post("/conversation/:id/clear", advisorController.postClear);
router.delete("/conversation/:id", advisorController.deleteConversation);
router.post("/conversation/:id/suggest", advisorController.postSuggest);
router.post("/", adminAuthMiddleware, createAdvisor);
router.post("/login", loginAdvisor);
router.post("/change-password", advisorAuthMiddleware, changeAdvisorPassword);
router.post("/logout", advisorAuthMiddleware, logoutAdvisor);
router.post("/forgot-password", forgotAdvisorPassword);
router.post("/verify-reset-otp", verifyAdvisorResetOtp);
router.post("/reset-password", resetAdvisorPassword);

router.get("/", adminAuthMiddleware, getAllAdvisors);
router.patch("/:advisor_id/active", adminAuthMiddleware, toggleAdvisorActive);
router.delete("/:advisor_id", adminAuthMiddleware, deleteAdvisor);
router.get("/:advisor_id", adminAuthMiddleware, getAdvisorById);
router.patch("/:advisor_id", adminAuthMiddleware, updateAdvisor);

export default router;
