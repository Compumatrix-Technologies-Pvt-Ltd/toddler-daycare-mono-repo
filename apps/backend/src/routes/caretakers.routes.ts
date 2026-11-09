import { Router, Request, Response } from "express";
import { MOCK_CARETAKER_PROFILE } from "../data/mockData.js";

const router = Router();

router.get("/caretakers/profile", (_req: Request, res: Response) => {
  res.json({
    data: MOCK_CARETAKER_PROFILE,
  });
});

router.put("/caretakers/profile", (req: Request, res: Response) => {
  res.json({
    data: {
      ...MOCK_CARETAKER_PROFILE,
      ...(req.body || {}),
    },
    meta: {
      message: "Profile updated successfully.",
    },
  });
});

router.get("/caretakers/permits", (_req: Request, res: Response) => {
  res.json({
    data: [
      {
        id: "pmt-1",
        permitNumber: "BE-JG-2024-884",
        authority: "Jugendamt Pankow, Berlin",
        status: "approved",
        validUntil: "2029-08-31",
        maxCapacity: 5,
        uploadedDocuments: ["pflegeerlaubnis_berlin.pdf", "ersthelfer_schein.pdf"],
      },
    ],
  });
});

router.get("/caretakers/slots", (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: "slot-1", childName: "Leon S.", age: 2, schedule: "Mon-Fri 08:00 - 16:30", status: "occupied" },
      { id: "slot-2", childName: "Mia K.", age: 3, schedule: "Mon-Fri 08:00 - 16:30", status: "occupied" },
      { id: "slot-3", childName: "Noah B.", age: 2, schedule: "Mon-Fri 08:00 - 16:30", status: "occupied" },
      { id: "slot-4", childName: "Emma W.", age: 1, schedule: "Mon-Fri 08:00 - 16:30", status: "occupied" },
      { id: "slot-5", childName: null, age: null, schedule: "Available from Oct 1, 2026", status: "vacant" },
    ],
  });
});

router.post("/caretakers/slots", (req: Request, res: Response) => {
  res.status(201).json({
    data: {
      id: `slot-${Date.now()}`,
      ...(req.body || {}),
    },
  });
});

router.get("/caretakers/inquiries", (_req: Request, res: Response) => {
  res.json({
    data: [
      {
        id: "inq-101",
        parentName: "Julia & David Schneider",
        childName: "Felix",
        childAge: "14 months",
        startDate: "2026-10-01",
        status: "new",
        notes: "Looking for full-time care (35h/week), plant-based meals preferred.",
        createdAt: "2026-09-15T09:30:00Z",
      },
      {
        id: "inq-102",
        parentName: "Sarah Bergmann",
        childName: "Lina",
        childAge: "2 years",
        startDate: "2026-11-01",
        status: "in_review",
        notes: "Flexible hours.",
        createdAt: "2026-09-12T14:15:00Z",
      },
    ],
    meta: {
      total: 2,
    },
  });
});

export default router;

