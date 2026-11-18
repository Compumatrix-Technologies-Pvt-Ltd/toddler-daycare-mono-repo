import { Response } from "express";
import { AuthRequest } from "@/middlewares/caretaker.middleware.js";
import {
  createBookingService,
  getCaretakerBookingsService,
  updateBookingService,
  deleteBookingService,
} from "@/services/caretaker/bookingService.js";

export const createBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const caretakerId = req.user?.id || req.body?.caretakerId;
    if (!caretakerId) {
      res.status(401).json({ success: false, message: "Unauthorized. Caretaker ID required." });
      return;
    }

    const {
      childName,
      childDob,
      placementStart,
      kindergartenTransition,
      dailyHours,
      slotNumber,
      category,
      preferences,
      parentContact,
      notes,
      inquiryId,
      startMonthIndex,
      endMonthIndex,
    } = req.body || {};

    // Validate ALL required fields
    const errors: Record<string, string[]> = {};

    if (!childName || !String(childName).trim()) {
      errors.childName = ["Child name is required."];
    }
    if (!childDob || !String(childDob).trim()) {
      errors.childDob = ["Date of birth is required."];
    }
    if (!placementStart || !String(placementStart).trim()) {
      errors.placementStart = ["Placement / desired start date is required."];
    }
    if (!kindergartenTransition || !String(kindergartenTransition).trim()) {
      errors.kindergartenTransition = ["Kindergarten transition date is required."];
    }
    if (!dailyHours || !String(dailyHours).trim()) {
      errors.dailyHours = ["Care hours are required."];
    }
    if (!parentContact?.phone || !String(parentContact.phone).trim()) {
      errors["parentContact.phone"] = ["Parent phone number is required."];
    }
    if (!parentContact?.email || !String(parentContact.email).trim()) {
      errors["parentContact.email"] = ["Parent email address is required."];
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        success: false,
        message: "All fields are required to confirm a booking.",
        errors,
      });
      return;
    }

    const booking = await createBookingService(caretakerId, {
      childName,
      childDob,
      placementStart,
      kindergartenTransition,
      dailyHours,
      slotNumber: Number(slotNumber) || 1,
      category: category || "future",
      preferences,
      parentContact,
      notes,
      inquiryId,
      startMonthIndex,
      endMonthIndex,
    });

    res.status(201).json({
      success: true,
      message: "Booking successfully created and saved to database.",
      data: booking,
    });
  } catch (err: any) {
    console.error("[BookingController] Error creating booking:", err);
    const isCapacityOrValidationError =
      err.message?.includes("capacity") ||
      err.message?.includes("Cannot confirm booking") ||
      err.message?.includes("date");
    const statusCode = isCapacityOrValidationError ? 422 : 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to create booking.",
      errors: isCapacityOrValidationError ? { capacity: [err.message] } : undefined,
      error: err.message,
    });
  }
};

export const getCaretakerBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const caretakerId = req.user?.id || (req.query?.caretakerId as string);
    if (!caretakerId) {
      res.status(401).json({ success: false, message: "Unauthorized. Caretaker ID required." });
      return;
    }

    const { category, status, search, startDate, endDate } = req.query as {
      category?: string;
      status?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    };
    const bookings = await getCaretakerBookingsService(caretakerId, { category, status, search, startDate, endDate });

    res.status(200).json({
      success: true,
      data: bookings,
      meta: {
        total: bookings.length,
      },
    });
  } catch (err: any) {
    console.error("[BookingController] Error fetching bookings:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
      error: err.message,
    });
  }
};

export const updateBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const caretakerId = req.user?.id || req.body?.caretakerId;
    const { id } = req.params;

    if (!caretakerId || !id) {
      res.status(400).json({ success: false, message: "Caretaker ID and Booking ID required." });
      return;
    }

    const updated = await updateBookingService(caretakerId, id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    console.error("[BookingController] Error updating booking:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update booking.",
      error: err.message,
    });
  }
};

export const deleteBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const caretakerId = req.user?.id || req.body?.caretakerId;
    const { id } = req.params;

    if (!caretakerId || !id) {
      res.status(400).json({ success: false, message: "Caretaker ID and Booking ID required." });
      return;
    }

    const deleted = await deleteBookingService(caretakerId, id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (err: any) {
    console.error("[BookingController] Error deleting booking:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking.",
      error: err.message,
    });
  }
};
