import { Router } from "express";
import {
  createSearchHistory,
  getCaretakerNearbySearches,
  getAdminSearchHistory,
  triggerSearchCleanup,
} from "../controllers/caretaker/searchHistoryController.js";
import { caretakerMiddleware } from "../middlewares/caretaker.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

// Public / Parent: Record parent search demand history
router.post("/", createSearchHistory);
router.post("/record", createSearchHistory);

// Caretaker: View search history within daycare catchment radius (30-day active window)
router.get("/nearby", caretakerMiddleware, getCaretakerNearbySearches);
router.get("/caretaker", caretakerMiddleware, getCaretakerNearbySearches);

// Admin: View all search history demands & trigger manual cleanup
router.get("/admin", adminMiddleware, getAdminSearchHistory);
router.post("/cleanup", adminMiddleware, triggerSearchCleanup);

export default router;
