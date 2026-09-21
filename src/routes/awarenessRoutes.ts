import { Router } from "express";
import { getConsentAwareness } from "../controllers/awarenessController";

const router = Router();

router.get("/consent", getConsentAwareness);

export default router;
