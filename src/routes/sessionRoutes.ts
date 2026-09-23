import { Router } from "express";
import {
  createSession,
  loginSession,
  getSession,
} from "../controllers/sessionController";

const router = Router();

router.post("/create", createSession);
router.post("/login", loginSession);
router.get("/:id", getSession);

export default router;
