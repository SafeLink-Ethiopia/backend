import { Router } from "express";
import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";
import {
  getMyConversations,
  getMyProfile,
  updateMyProfile,
} from "../controllers/AdvisorDashboardController";

const router = Router();

// Every route here requires a logged-in advisor (Bearer token).
router.get("/conversations", advisorAuthMiddleware, getMyConversations);
router.get("/profile", advisorAuthMiddleware, getMyProfile);
router.patch("/profile", advisorAuthMiddleware, updateMyProfile);

export default router;