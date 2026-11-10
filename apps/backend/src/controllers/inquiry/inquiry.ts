import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createInquiryService,
  getInquiriesService,
  getInquiryByIdService,
  updateInquiryStatusService,
} from "../../services/inquiry/inquiryService.js";

export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      childName,
      childBirthday,
      desiredStart,
      estTransition,
      careHours,
      preferences,
      parentName,
      phone,
      email,
      note,
      scope,
      caretakerId,
      caretakerIds,
      daycareIds,
      daycareNames,
      consentMapVisibility,
    } = req.body || {};

    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!parentName || !String(parentName).trim()) {
      errors.parentName = ["Parent contact name is required."];
    }
    if (!email || !String(email).trim()) {
      errors.email = ["Valid email address is required."];
    }
    if (!phone || !String(phone).trim()) {
      errors.phone = ["Parent phone number is required."];
    }
    if (!childName || !String(childName).trim()) {
      errors.childName = ["Child name is required."];
    }
    if (!desiredStart || !String(desiredStart).trim()) {
      errors.desiredStart = ["Desired start date/month is required."];
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors,
      });
      return;
    }

    const result: any = await createInquiryService({
      childName: String(childName).trim(),
      childBirthday: childBirthday ? String(childBirthday).trim() : "",
      desiredStart: String(desiredStart).trim(),
      estTransition: estTransition ? String(estTransition).trim() : "2-4 Weeks",
      careHours: careHours ? String(careHours).trim() : "Mon – Fri • 08:00 – 15:00",
      preferences: {
        gender: preferences?.gender || "Female",
        food: preferences?.food || "Self-cooked",
        pets: preferences?.pets || "Pets OK",
      },
      parentName: String(parentName).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      note: note ? String(note).trim() : "",
      scope: scope || "single",
      caretakerId: caretakerId ? String(caretakerId).trim() : undefined,
      caretakerIds: Array.isArray(caretakerIds)
        ? caretakerIds
        : (caretakerId ? [String(caretakerId).trim()] : []),
      daycareIds: Array.isArray(daycareIds) ? daycareIds : [],
      daycareNames: Array.isArray(daycareNames) ? daycareNames : [],
      consentMapVisibility: consentMapVisibility !== false,
    });

    const inquiry = result.inquiry || result;
    const parentEmailResult = result.parentEmailResult;

    res.status(201).json({
      data: inquiry,
      meta: {
        message: "Inquiry successfully submitted and emails dispatched.",
        referenceId: inquiry.referenceId,
        contactedCount: inquiry.daycareNames.length,
        parentEmailPreviewUrl: parentEmailResult?.previewUrl || null,
        parentEmailDelivered: parentEmailResult?.success ?? true,
      },
    });
  } catch (err: any) {
    console.error("[InquiryController] Error creating inquiry:", err);
    res.status(500).json({
      message: "An error occurred while creating the inquiry.",
      error: err.message,
    });
  }
};

export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, email, caretakerId: queryCaretakerId, daycareId, search } = req.query;

    let caretakerId = queryCaretakerId
      ? String(queryCaretakerId)
      : (daycareId ? String(daycareId) : undefined);

    // If caretaker Bearer token is provided, strictly enforce querying for their caretakerId
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_ACCESS_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as any;
          if (decoded?.caretakerId) {
            caretakerId = decoded.caretakerId;
          }
        } catch {
          // Admin or invalid/expired token - continue without overriding
        }
      }
    }

    const inquiries = await getInquiriesService({
      status: status ? String(status) : undefined,
      email: email ? String(email) : undefined,
      caretakerId,
      search: search ? String(search) : undefined,
    });

    res.status(200).json({
      data: inquiries,
      meta: {
        total: inquiries.length,
      },
    });
  } catch (err: any) {
    console.error("[InquiryController] Error listing inquiries:", err);
    res.status(500).json({
      message: "An error occurred while fetching inquiries.",
      error: err.message,
    });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !["pending", "reviewed", "contacted", "accepted", "declined"].includes(status)) {
      res.status(400).json({
        message: "Invalid status value.",
      });
      return;
    }

    const updated = await updateInquiryStatusService(id, status);
    if (!updated) {
      res.status(404).json({
        message: "Inquiry not found.",
      });
      return;
    }

    res.status(200).json({
      data: updated,
      meta: {
        message: `Inquiry status updated to ${status}.`,
      },
    });
  } catch (err: any) {
    console.error("[InquiryController] Error updating inquiry status:", err);
    res.status(500).json({
      message: "An error occurred while updating the inquiry status.",
      error: err.message,
    });
  }
};

export const getInquiryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inquiry = await getInquiryByIdService(id);

    if (!inquiry) {
      res.status(404).json({
        message: "Inquiry not found.",
      });
      return;
    }

    res.status(200).json({
      data: inquiry,
    });
  } catch (err: any) {
    console.error("[InquiryController] Error fetching inquiry by ID:", err);
    res.status(500).json({
      message: "An error occurred while fetching the inquiry.",
      error: err.message,
    });
  }
};

