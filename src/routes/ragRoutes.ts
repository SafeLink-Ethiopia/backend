import { Router } from "express";

import {
  uploadRagDocument,
  getRagDocuments,
  getRagDocument,
  updateRagDocument,
  deleteRagDocument,
  viewRagDocumentFile,
} from "../controllers/ragController";

import { ragUpload } from "../middleware/ragUploadMiddleware";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

const router = Router();

// Create
router.post(
  "/documents",
  adminAuthMiddleware,
  ragUpload.single("file"),
  uploadRagDocument,
);

// Read all
router.get("/documents", adminAuthMiddleware, getRagDocuments);

// Read one
router.get("/documents/:id", adminAuthMiddleware, getRagDocument);

// Update
router.put(
  "/documents/:id",
  adminAuthMiddleware,
  ragUpload.single("file"),
  updateRagDocument,
);

// Delete
router.delete("/documents/:id", adminAuthMiddleware, deleteRagDocument);
router.get("/documents/:id/file", adminAuthMiddleware, viewRagDocumentFile);
export default router;
