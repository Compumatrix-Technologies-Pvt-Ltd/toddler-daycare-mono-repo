import { createDaycare, getDaycare, updateDaycare, } from "@/controllers/caretaker/daycare";
import { caretakerMiddleware } from "@/middlewares/caretaker.middleware";
import { Router } from "express";
import { daycareUpload } from "@/middlewares/upload.middleware";

const router = Router();

router.post(
  "/", caretakerMiddleware, daycareUpload, createDaycare);
router.get("/", caretakerMiddleware, getDaycare);
router.put("/", caretakerMiddleware, daycareUpload, updateDaycare);

export { router as daycareRouter }

export default router;