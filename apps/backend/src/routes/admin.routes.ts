import { Router } from "express";
import {
  register,
  login,
  getProfile,
  getAllDaycaresAdmin,
  getDashboardStatsAdmin,
  updateDaycareStatusAdmin,
} from "@/controllers/admin/admin";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/controllers/admin/settings";
import { adminMiddleware } from "@/middlewares/admin.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/settings", getPlatformSettings);

// Protected routes
router.get("/profile", adminMiddleware, getProfile);
router.get("/dashboard", adminMiddleware, getDashboardStatsAdmin);
router.get("/api/dashboard", adminMiddleware, getDashboardStatsAdmin);
router.get("/stats", adminMiddleware, getDashboardStatsAdmin);
router.get("/daycares", adminMiddleware, getAllDaycaresAdmin);
router.patch("/daycares/:id/status", adminMiddleware, updateDaycareStatusAdmin);
router.put("/settings", adminMiddleware, updatePlatformSettings);
router.patch("/settings", adminMiddleware, updatePlatformSettings);

export { router as adminRouter };
export default router;
