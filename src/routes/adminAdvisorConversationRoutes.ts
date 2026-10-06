import { Router } from "express";

import {
  getOrCreateAdminAdvisorConversation,
  getAdminConversations,
  getAdminAdvisorConversation,
  getAdvisorAdminConversations,
  getAdvisorAdminConversation,
} from "../controllers/adminAdvisorConversationController";

import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";
import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| ADVISOR ROUTES
|--------------------------------------------------------------------------
*/

// Get all conversations for logged-in advisor
router.get("/", advisorAuthMiddleware, getAdvisorAdminConversations);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Get all conversations for logged-in admin
router.get("/admin", adminAuthMiddleware, getAdminConversations);

// Get or create conversation with a specific advisor
router.get(
  "/admin/advisor/:advisor_id",
  adminAuthMiddleware,
  getOrCreateAdminAdvisorConversation,
);

// Get a specific conversation for admin
router.get(
  "/admin/:conversation_id",
  adminAuthMiddleware,
  getAdminAdvisorConversation,
);

/*
|--------------------------------------------------------------------------
| ADVISOR - SPECIFIC CONVERSATION
|--------------------------------------------------------------------------
*/

// Get a specific conversation for advisor
router.get(
  "/:conversation_id",
  advisorAuthMiddleware,
  getAdvisorAdminConversation,
);

export default router;
