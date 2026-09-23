import { Router } from "express";

import {
  getConsentAwareness,
  getBoundariesAwareness,
  getHarassmentAwareness,
  getSupportAwareness,
} from "../controllers/awarenessController";

const router = Router();

router.get("/consent", getConsentAwareness);
router.get("/boundaries", getBoundariesAwareness);
router.get("/harassment", getHarassmentAwareness);
router.get("/support", getSupportAwareness);

export default router;
