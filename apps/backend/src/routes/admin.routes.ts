import { Router } from "express";
import { register, login, getProfile } from "@/controllers/admin/admin";
import { adminMiddleware } from "@/middlewares/admin.middleware";

const router = Router();

//public routes
router.post("/register", register);
router.post("/login", login);

//protected routes
router.get("/profile", adminMiddleware, getProfile);

export { router as adminRouter };
export default router;
