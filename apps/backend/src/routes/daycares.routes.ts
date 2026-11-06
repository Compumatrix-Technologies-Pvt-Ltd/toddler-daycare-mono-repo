import { Router, Request, Response } from "express";
import { MOCK_DAYCARES } from "../data/mockData.js";

const router = Router();

router.get("/daycares", (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : null;
  const page = parseInt(String(req.query.page || "1"), 10);
  const perPage = parseInt(String(req.query.per_page || "10"), 10);

  let filtered = MOCK_DAYCARES;
  if (search) {
    filtered = filtered.filter(
      (d) =>
        d.name.toLowerCase().includes(search) ||
        d.location.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  res.json({
    data,
    meta: {
      current_page: page,
      last_page: Math.ceil(total / perPage) || 1,
      total,
      per_page: perPage,
    },
  });
});

router.get("/daycares/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const daycare = MOCK_DAYCARES.find((d) => d.id === id);

  if (!daycare) {
    res.status(404).json({
      message: "Daycare not found",
      errors: { id: ["Daycare with specified ID does not exist."] },
    });
    return;
  }

  res.json({
    data: daycare,
  });
});

export default router;

