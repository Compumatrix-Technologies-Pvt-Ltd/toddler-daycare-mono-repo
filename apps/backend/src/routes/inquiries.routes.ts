import { Router } from "express";
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
} from "../controllers/inquiry/inquiry.js";

const router = Router();

// Support both "/" (when mounted at /api/v1/inquiries) and "/inquiries" (when mounted at /api or /api/v1)
router.post(["/", "/inquiries"], createInquiry);
router.get(["/", "/inquiries"], getInquiries);
router.get(["/:id", "/inquiries/:id"], getInquiryById);
router.patch(["/:id/status", "/inquiries/:id/status"], updateInquiryStatus);

export default router;
