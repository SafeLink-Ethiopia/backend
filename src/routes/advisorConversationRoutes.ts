import { Router } from "express";

import {
  getAdvisorConversations,
  getAdvisorConversation,
  getOrCreateAdvisorConversation,
} from "../controllers/advisorConversationController";

import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

/*
 * Get all conversations belonging to the logged-in advisor
 *
 * GET /api/advisor-conversations
 */
router.get("/", advisorAuthMiddleware, getAdvisorConversations);

/*
 * Get or create a conversation between
 * the logged-in advisor and an admin.
 *
 * GET /api/advisor-conversations/admin/:admin_id
 */
router.get(
  "/admin/:admin_id",
  advisorAuthMiddleware,
  getOrCreateAdvisorConversation,
);

/*
 * Get one conversation.
 *
 * GET /api/advisor-conversations/:conversation_id
 */
router.get("/:conversation_id", advisorAuthMiddleware, getAdvisorConversation);

export default router;
