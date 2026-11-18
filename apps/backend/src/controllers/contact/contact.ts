import { Request, Response } from "express";
import { ContactMessage, inMemoryContactStore } from "@/modules/contact/contact";
import { emitContactMessageCreated } from "@/config/socket";
import { emailService } from "@/services/email/emailService";

/**
 * Public: Submit a contact message from the web contact form
 * POST /api/contact or /api/v1/contact
 */
export async function createContactMessage(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, subject, message } = req.body;

    const errors: Record<string, string[]> = {};
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      errors.fullName = ["Full name is required."];
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = ["A valid email address is required."];
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      errors.subject = ["Subject is required."];
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      errors.message = ["Message content is required."];
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        success: false,
        message: "The given data was invalid.",
        errors,
      });
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: "unread",
      adminNotes: "",
    };

    let savedItem: any = null;

    try {
      savedItem = await ContactMessage.create(payload);
    } catch (dbErr) {
      console.warn("MongoDB unavailable for contact message, using in-memory store:", dbErr);
      const fallbackItem = {
        _id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryContactStore.unshift(fallbackItem);
      savedItem = fallbackItem;
    }

    // Notify connected admin via WebSockets
    try {
      emitContactMessageCreated(savedItem);
    } catch (sockErr) {
      console.warn("Could not emit contact message socket event:", sockErr);
    }

    res.status(201).json({
      success: true,
      message: "Contact message sent successfully.",
      data: savedItem,
    });
  } catch (err: any) {
    console.error("Error creating contact message:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to submit contact message.",
    });
  }
}

/**
 * Admin: Get all contact messages with search, filter, and pagination
 * GET /api/admin/contact-messages
 */
export async function getContactMessagesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;

    let items: any[] = [];
    let total = 0;
    let unreadCount = 0;
    let repliedCount = 0;

    try {
      const query: any = {};
      if (status && status !== "all") {
        query.status = status;
      }
      if (search && typeof search === "string" && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [{ fullName: regex }, { email: regex }, { subject: regex }, { message: regex }];
      }

      items = await ContactMessage.find(query).sort({ createdAt: -1 }).lean();
      total = await ContactMessage.countDocuments();
      unreadCount = await ContactMessage.countDocuments({ status: "unread" });
      repliedCount = await ContactMessage.countDocuments({ status: "replied" });
    } catch (dbErr) {
      console.warn("MongoDB query failed, falling back to in-memory store:", dbErr);
      let filtered = [...inMemoryContactStore];
      if (status && status !== "all") {
        filtered = filtered.filter((m) => m.status === status);
      }
      if (search && typeof search === "string" && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.subject.toLowerCase().includes(q) ||
            m.message.toLowerCase().includes(q)
        );
      }
      items = filtered;
      total = inMemoryContactStore.length;
      unreadCount = inMemoryContactStore.filter((m) => m.status === "unread").length;
      repliedCount = inMemoryContactStore.filter((m) => m.status === "replied").length;
    }

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        total,
        unread: unreadCount,
        replied: repliedCount,
      },
    });
  } catch (err: any) {
    console.error("Error fetching contact messages for admin:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve contact messages.",
    });
  }
}

/**
 * Admin: Update contact message status or notes
 * PATCH /api/admin/contact-messages/:id/status
 */
export async function updateContactMessageStatusAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ["unread", "read", "replied", "archived"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    let updated: any = null;

    try {
      const updatePayload: any = {};
      if (status) updatePayload.status = status;
      if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;

      updated = await ContactMessage.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    } catch (dbErr) {
      console.warn("MongoDB update failed, falling back to in-memory store:", dbErr);
      const memIndex = inMemoryContactStore.findIndex((m) => m._id === id);
      if (memIndex !== -1) {
        if (status) inMemoryContactStore[memIndex].status = status;
        if (adminNotes !== undefined) inMemoryContactStore[memIndex].adminNotes = adminNotes;
        inMemoryContactStore[memIndex].updatedAt = new Date();
        updated = inMemoryContactStore[memIndex];
      }
    }

    if (!updated) {
      res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact message updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    console.error("Error updating contact message:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update contact message.",
    });
  }
}

/**
 * Admin: Delete a contact message
 * DELETE /api/admin/contact-messages/:id
 */
export async function deleteContactMessageAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    let deleted = false;

    try {
      const result = await ContactMessage.findByIdAndDelete(id);
      deleted = !!result;
    } catch (dbErr) {
      console.warn("MongoDB delete failed, falling back to in-memory store:", dbErr);
      const memIndex = inMemoryContactStore.findIndex((m) => m._id === id);
      if (memIndex !== -1) {
        inMemoryContactStore.splice(memIndex, 1);
        deleted = true;
      }
    }

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact message deleted successfully.",
    });
  } catch (err: any) {
    console.error("Error deleting contact message:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete contact message.",
    });
  }
}

/**
 * Admin: Reply to a contact message via email
 * POST /api/admin/contact-messages/:id/reply
 */
export async function replyContactMessageAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { subject, replyMessage } = req.body;

    if (!replyMessage || typeof replyMessage !== "string" || !replyMessage.trim()) {
      res.status(422).json({
        success: false,
        message: "Reply message content is required.",
      });
      return;
    }

    let targetMessage: any = null;

    try {
      targetMessage = await ContactMessage.findById(id);
    } catch {
      targetMessage = inMemoryContactStore.find((m) => m._id === id);
    }

    if (!targetMessage) {
      res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
      return;
    }

    const emailSubject = subject?.trim() || `Re: ${targetMessage.subject}`;

    // Send email via emailService
    const emailResult = await emailService.sendContactReplyEmail({
      toEmail: targetMessage.email,
      recipientName: targetMessage.fullName,
      subject: emailSubject,
      replyMessage: replyMessage.trim(),
      originalMessage: targetMessage.message,
      adminName: (req as any).admin?.name || "Toddler Daycare Team",
    });

    // Update message status to "replied"
    const notesAppend = `Reply sent on ${new Date().toISOString()}:\n${replyMessage.trim()}`;
    const updatedNotes = targetMessage.adminNotes
      ? `${targetMessage.adminNotes}\n\n---\n${notesAppend}`
      : notesAppend;

    let updated: any = null;
    try {
      updated = await ContactMessage.findByIdAndUpdate(
        id,
        {
          status: "replied",
          adminNotes: updatedNotes,
        },
        { new: true }
      ).lean();
    } catch {
      targetMessage.status = "replied";
      targetMessage.adminNotes = updatedNotes;
      targetMessage.updatedAt = new Date();
      updated = targetMessage;
    }

    res.status(200).json({
      success: true,
      message: "Reply email sent successfully.",
      data: updated,
      emailResult: {
        sent: emailResult.success,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl,
      },
    });
  } catch (err: any) {
    console.error("Error sending contact message reply:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to send reply email.",
    });
  }
}
