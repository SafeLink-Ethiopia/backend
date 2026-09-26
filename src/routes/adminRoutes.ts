import { Router } from "express";

import {
  createAdmin,
  loginAdmin,
  logoutAdmin,
} from "../controllers/adminController";

import {
  adminAuthMiddleware,
  AdminRequest,
} from "../middleware/adminAuthMiddleware";

const router = Router();

router.post("/setup", createAdmin);

router.post("/login", loginAdmin);
router.post("/logout", adminAuthMiddleware, logoutAdmin);

router.get("/test", adminAuthMiddleware, (req: AdminRequest, res) => {
  res.status(200).json({
    message: "Admin authentication successful.",
    admin: {
      admin_id: req.admin?.admin_id,
      role: req.admin?.role,
    },
  });
});

export default router;
