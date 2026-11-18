import { Router } from "express";
import { caretakerMiddleware } from "@/middlewares/caretaker.middleware.js";
import {
  createBooking,
  getCaretakerBookings,
  updateBooking,
  deleteBooking,
} from "@/controllers/caretaker/bookingController.js";

const router = Router();

// Routes for Caretaker Bookings (supports token authentication or query params)
router.post("/", caretakerMiddleware, createBooking);
router.get("/", caretakerMiddleware, getCaretakerBookings);
router.put("/:id", caretakerMiddleware, updateBooking);
router.delete("/:id", caretakerMiddleware, deleteBooking);

export { router as bookingRouter };
export default router;
