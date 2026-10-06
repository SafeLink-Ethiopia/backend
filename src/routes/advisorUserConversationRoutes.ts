import { Router } from "express";

import {
  getAdvisorUserConversations,
  getAdvisorUserConversation,
  sendAdvisorUserMessage,
  closeAdvisorUserConversation,
} from "../controllers/advisorUserConversationController";

import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

/*
 * All routes require Advisor authentication.
 */
router.use(advisorAuthMiddleware);

/*
 * Get all users assigned to this advisor.
 */
router.get("/", getAdvisorUserConversations);

/*
 * Get one assigned user conversation.
 */
router.get("/:conversation_id", getAdvisorUserConversation);

/*
 * Send advisor message.
 */
router.post("/:conversation_id/messages", sendAdvisorUserMessage);

/*
 * Close conversation.
 */
router.patch("/:conversation_id/close", closeAdvisorUserConversation);

export default router;
