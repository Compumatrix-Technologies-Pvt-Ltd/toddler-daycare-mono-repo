import { Router, Request, Response } from "express";

const router = Router();

router.post("/inquiries", (req: Request, res: Response) => {
  const { parentName, email, daycareId, childAge, startDate } = req.body || {};

  if (!parentName || !email || !daycareId) {
    res.status(422).json({
      message: "The given data was invalid.",
      errors: {
        ...(!parentName ? { parentName: ["Parent name is required."] } : {}),
        ...(!email ? { email: ["Valid email address is required."] } : {}),
        ...(!daycareId ? { daycareId: ["Target daycare is required."] } : {}),
      },
    });
    return;
  }

  const referenceId = `ENQ-${Date.now().toString().slice(-6)}`;

  res.status(201).json({
    data: {
      referenceId,
      status: "pending",
      daycareId,
      parentName,
      childAge: childAge || "2 years",
      startDate: startDate || "2026-10-01",
      createdAt: new Date().toISOString(),
    },
    meta: {
      message: "Inquiry successfully dispatched to caretaker.",
    },
  });
});

export default router;

