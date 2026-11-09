import { Router } from "express";
import { register, login } from "@/controllers/caretaker/auth";

const router = Router();

//public routes
router.post("/register", register);
router.post("/login", login);

export { router as caretaterRouter }
export default router