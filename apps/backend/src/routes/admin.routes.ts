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
import {
  getContactMessagesAdmin,
  updateContactMessageStatusAdmin,
  deleteContactMessageAdmin,
  replyContactMessageAdmin,
} from "@/controllers/contact/contact";
import {
  getAdminSearchHistory,
  triggerSearchCleanup,
} from "@/controllers/caretaker/searchHistoryController";
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
router.put("/daycares/:id/status", adminMiddleware, updateDaycareStatusAdmin);
router.put("/settings", adminMiddleware, updatePlatformSettings);
router.patch("/settings", adminMiddleware, updatePlatformSettings);

// Contact messages routes
router.get("/contact-messages", adminMiddleware, getContactMessagesAdmin);
router.post("/contact-messages/:id/reply", adminMiddleware, replyContactMessageAdmin);
router.patch("/contact-messages/:id/status", adminMiddleware, updateContactMessageStatusAdmin);
router.put("/contact-messages/:id/status", adminMiddleware, updateContactMessageStatusAdmin);
router.delete("/contact-messages/:id", adminMiddleware, deleteContactMessageAdmin);

// Parent Search History routes (Governance & 30-Day Visibility)
router.get("/search-history", adminMiddleware, getAdminSearchHistory);
router.post("/search-history/cleanup", adminMiddleware, triggerSearchCleanup);

export { router as adminRouter };
export default router;
