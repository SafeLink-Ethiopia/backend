import { Router } from "express";
import {
  getUserConversations,
  getAdvisorInbox,
  initiateConversation,
} from "../controllers/conversationController";

const router = Router();

router.get("/user/:sessionId", getUserConversations);
router.get("/advisor/:advisorId", getAdvisorInbox);
router.post("/initiate", initiateConversation);

export default router;