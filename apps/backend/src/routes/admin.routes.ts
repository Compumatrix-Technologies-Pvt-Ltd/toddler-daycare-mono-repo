import { Router, Request, Response } from "express";
import { MOCK_ADMIN_DASHBOARD } from "../data/mockData.js";

const router = Router();

const MOCK_USERS = [
  { id: "u-1", name: "System Admin", email: "admin@toddler.de", role: "super-admin", status: "active" },
  { id: "u-2", name: "Maria Weber", email: "maria@kitasunshine.de", role: "caretaker", status: "verified" },
  { id: "u-3", name: "Hans Becker", email: "hans@kleinestrolche.de", role: "caretaker", status: "verified" },
];

const MOCK_APPLICATIONS = [
  {
    id: "app-101",
    applicantName: "Sabine Neumann",
    daycareName: "Waldkinder Tagesnest",
    submissionDate: "2026-09-01",
    status: "pending_review",
    documentsCount: 4,
  },
  {
    id: "app-102",
    applicantName: "Klara Fischer",
    daycareName: "Sonnenschein Minis",
    submissionDate: "2026-09-08",
    status: "approved",
    documentsCount: 5,
  },
];

router.get("/admin/dashboard", (_req: Request, res: Response) => {
  res.json({
    data: MOCK_ADMIN_DASHBOARD,
  });
});

router.get("/admin/users", (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || "1"), 10);
  const perPage = parseInt(String(req.query.per_page || "10"), 10);

  res.json({
    data: MOCK_USERS,
    meta: {
      current_page: page,
      last_page: 1,
      total: MOCK_USERS.length,
      per_page: perPage,
    },
  });
});

router.get("/admin/applications", (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || "1"), 10);
  const perPage = parseInt(String(req.query.per_page || "10"), 10);

  res.json({
    data: MOCK_APPLICATIONS,
    meta: {
      current_page: page,
      last_page: 1,
      total: MOCK_APPLICATIONS.length,
      per_page: perPage,
    },
  });
});

export default router;

