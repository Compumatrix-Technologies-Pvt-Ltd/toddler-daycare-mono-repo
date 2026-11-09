import { Router, Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "@repo/backend",
    runtime: "Node.js Express",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;

