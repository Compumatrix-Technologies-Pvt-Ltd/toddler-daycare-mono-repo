import { Router } from "express";
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
} from "../controllers/inquiry/inquiry.js";
import { cancelSearchHistory } from "../controllers/caretaker/searchHistoryController.js";

const router = Router();

// Support both "/" (when mounted at /api/v1/inquiries) and "/inquiries" (when mounted at /api or /api/v1)
router.post(["/", "/inquiries"], createInquiry);
router.get(["/", "/inquiries"], getInquiries);
router.get(["/:id", "/inquiries/:id"], getInquiryById);
router.patch(["/:id/status", "/inquiries/:id/status"], updateInquiryStatus);

// Cancel & delete search history / map visibility
router.delete(["/cancel-search", "/:id/cancel-search", "/inquiries/cancel-search"], cancelSearchHistory);
router.post(["/cancel-search", "/:id/cancel-search", "/inquiries/cancel-search"], cancelSearchHistory);
router.get(["/cancel-search", "/:id/cancel-search", "/inquiries/cancel-search"], cancelSearchHistory);

export default router;
