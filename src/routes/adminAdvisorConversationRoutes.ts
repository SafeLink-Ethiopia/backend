import { Router } from "express";

import {
  getOrCreateAdminAdvisorConversation,
  getAdminConversations,
  getAdminAdvisorConversation,
} from "../controllers/adminAdvisorConversationController";

import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

const router = Router();

router.get("/", adminAuthMiddleware, getAdminConversations);

router.get(
  "/advisor/:advisor_id",
  adminAuthMiddleware,
  getOrCreateAdminAdvisorConversation,
);

router.get(
  "/:conversation_id",
  adminAuthMiddleware,
  getAdminAdvisorConversation,
);

export default router;
