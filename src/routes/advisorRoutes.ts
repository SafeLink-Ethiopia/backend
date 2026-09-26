import { Router } from "express";
import * as advisorController from "../controllers/advisorController";

const router = Router();

router.post("/request", advisorController.requestAdvisor);
router.get("/conversations", advisorController.getConversations);
router.get("/conversation/:id", advisorController.getConversation);
router.post("/conversation/:id/message", advisorController.postMessage);
router.patch("/conversation/:id/message/:index", advisorController.patchMessage);
router.post("/conversation/:id/clear", advisorController.postClear);
router.delete("/conversation/:id", advisorController.deleteConversation);
router.post("/conversation/:id/suggest", advisorController.postSuggest);

export default router;
