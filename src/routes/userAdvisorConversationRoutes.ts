import { Router } from "express";

import {
  startConversation,
  getConversation,
  getConversations,
  sendMessage,
  closeConversation,
} from "../controllers/userAdvisorConversationController";

const router = Router();

/*
 * Start or continue a conversation by advisor type.
 *
 * Body:
 * {
 *   "session_id": "...",
 *   "advisor_type": "general"
 * }
 */
router.post("/start", startConversation);

/*
 * Get all conversations for a session.
 *
 * Query:
 * ?session_id=...
 */
router.get("/", getConversations);

/*
 * Get one conversation.
 *
 * Query:
 * ?session_id=...
 */
router.get("/:conversation_id", getConversation);

/*
 * Send a user message.
 *
 * Body:
 * {
 *   "session_id": "...",
 *   "text": "Hello"
 * }
 */
router.post("/:conversation_id/messages", sendMessage);

/*
 * Close a conversation.
 *
 * Body:
 * {
 *   "session_id": "..."
 * }
 */
router.patch("/:conversation_id/close", closeConversation);

export default router;
