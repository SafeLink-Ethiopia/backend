import { Router } from "express";

import {
  getAdvisorConversation,
  getAdvisorConversations,
} from "../controllers/advisorAdminConversationController";

import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

/*
 * Get all conversations belonging to the logged-in advisor
 */
router.get("/", advisorAuthMiddleware, getAdvisorConversations);

/*
 * Get the advisor's conversation with the admin
 */
router.get("/conversation", advisorAuthMiddleware, getAdvisorConversation);

export default router;
