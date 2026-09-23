import { Router, Request, Response } from "express";
import { mockServices } from "../data/mockServices";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    services: mockServices,
  });
});

export default router;