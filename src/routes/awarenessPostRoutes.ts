import { Router } from "express";

import {
  createAwarenessPost,
  getAwarenessPosts,
  updateAwarenessPost,
  deleteAwarenessPost,
} from "../controllers/awarenessPostController";

import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

const router = Router();

router.post("/", adminAuthMiddleware, createAwarenessPost);

router.get("/", adminAuthMiddleware, getAwarenessPosts);

router.put("/:id", adminAuthMiddleware, updateAwarenessPost);

router.delete("/:id", adminAuthMiddleware, deleteAwarenessPost);

export default router;
