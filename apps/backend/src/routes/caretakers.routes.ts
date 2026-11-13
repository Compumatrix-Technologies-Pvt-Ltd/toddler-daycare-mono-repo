import { Router } from "express";
import { register, login, getProfile } from "@/controllers/caretaker/auth";
import { caretakerMiddleware } from "@/middlewares/caretaker.middleware";

const router = Router();

// Public auth routes
router.post("/register", register);
router.post("/login", login);

// Protected token verification & profile routes (valid Bearer token required)
router.get("/verify", caretakerMiddleware, getProfile);
router.get("/me", caretakerMiddleware, getProfile);
router.get("/", caretakerMiddleware, getProfile);

export { router as caretaterRouter };
export default router;
