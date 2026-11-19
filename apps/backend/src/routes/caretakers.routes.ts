import { Router } from "express";
import {
  register,
  login,
  getProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "@/controllers/caretaker/auth";
import { getCaretakerNearbySearches } from "@/controllers/caretaker/searchHistoryController";
import { caretakerMiddleware } from "@/middlewares/caretaker.middleware";

const router = Router();

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// Protected token verification & profile routes (valid Bearer token required)
router.get("/verify", caretakerMiddleware, getProfile);
router.get("/me", caretakerMiddleware, getProfile);
router.get("/", caretakerMiddleware, getProfile);

// Search history visible within caretaker's daycare catchment radius for 30 days
router.get("/search-history", caretakerMiddleware, getCaretakerNearbySearches);

export { router as caretaterRouter };
export default router;
