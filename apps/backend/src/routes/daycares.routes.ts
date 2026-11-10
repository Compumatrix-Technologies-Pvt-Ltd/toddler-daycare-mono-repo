import {
  createDaycare,
  getDaycare,
  updateDaycare,
  allDaycare,
  deleteDaycarePhoto,
} from "@/controllers/caretaker/daycare";
import { caretakerMiddleware } from "@/middlewares/caretaker.middleware";
import { Router } from "express";
import { daycareUpload } from "@/middlewares/upload.middleware";

const router = Router();

router.post("/", caretakerMiddleware, daycareUpload, createDaycare);
router.get("/", caretakerMiddleware, getDaycare);
router.get("/all", allDaycare);
router.put("/", caretakerMiddleware, daycareUpload, updateDaycare);
router.delete("/photos/:photoId", caretakerMiddleware, deleteDaycarePhoto);

export { router as daycareRouter };

export default router;