import { Router } from "express";
import {
  createContactMessage,
  getContactMessagesAdmin,
  updateContactMessageStatusAdmin,
  deleteContactMessageAdmin,
  replyContactMessageAdmin,
} from "@/controllers/contact/contact";
import { adminMiddleware } from "@/middlewares/admin.middleware";

const router = Router();

// Public contact submission (supports POST /api/contact, /api/v1/contact, /api/contact/submit)
router.post(["/", "/submit"], createContactMessage);

// Admin contact management (supports GET, PATCH, DELETE, REPLY under /api/admin/contact-messages)
router.get("/admin/contact-messages", adminMiddleware, getContactMessagesAdmin);
router.post("/admin/contact-messages/:id/reply", adminMiddleware, replyContactMessageAdmin);
router.patch("/admin/contact-messages/:id/status", adminMiddleware, updateContactMessageStatusAdmin);
router.put("/admin/contact-messages/:id/status", adminMiddleware, updateContactMessageStatusAdmin);
router.delete("/admin/contact-messages/:id", adminMiddleware, deleteContactMessageAdmin);

export default router;
