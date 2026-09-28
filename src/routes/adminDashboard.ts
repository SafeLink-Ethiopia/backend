import { Router } from "express";

import { getAdminDashboard } from "../controllers/adminDashboardController";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

const router = Router();

router.get("/", adminAuthMiddleware, getAdminDashboard);

export default router;
