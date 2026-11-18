import { Booking } from "@/modules/caretaker/booking.js";
import { Daycare } from "@/modules/caretaker/daycare.js";
import { Inquiry } from "@/modules/inquiry/inquiry.js";
import { CreateBookingInput, IBooking } from "@/types/caretaker/booking.js";
import { emitInquiryUpdated, emitDaycareUpdated } from "@/config/socket.js";
import { validateBookingCapacity } from "./slotAvailabilityService.js";
import { parseFlexibleBookingDate } from "@repo/shared";

function parseBookingDate(dateStr?: string, isEndOfPeriod: boolean = false): Date | null {
  return parseFlexibleBookingDate(dateStr, isEndOfPeriod);
}

export const createBookingService = async (
  caretakerId: string,
  input: CreateBookingInput
): Promise<IBooking> => {
  // Resolve Daycare ID if not provided
  let daycareId = input.daycareId;
  if (!daycareId) {
    const daycare = await Daycare.findOne({ caretakerId });
    if (daycare) {
      daycareId = String(daycare._id);
    }
  }

  // Backend availability & capacity validation:
  // Check overlapping confirmed bookings and prevent exceeding capacity
  const capacityCheck = await validateBookingCapacity(
    caretakerId,
    daycareId,
    input.placementStart,
    input.kindergartenTransition
  );

  if (!capacityCheck.isAvailable) {
    throw new Error(
      `Cannot confirm booking: Caretaker capacity of ${capacityCheck.totalCapacity} slots is fully booked in ${capacityCheck.conflictMonth}.`
    );
  }

  const assignedSlot =
    input.slotNumber && Number(input.slotNumber) > 0
      ? Number(input.slotNumber)
      : capacityCheck.assignedSlotNumber;

  const referenceId =
    input.referenceId ||
    `BKG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const booking = new Booking({
    caretakerId,
    daycareId: daycareId || undefined,
    inquiryId: input.inquiryId || "",
    referenceId,
    childName: input.childName.trim(),
    childDob: input.childDob.trim(),
    placementStart: input.placementStart.trim(),
    kindergartenTransition: input.kindergartenTransition.trim(),
    dailyHours: input.dailyHours.trim(),
    slotNumber: assignedSlot,
    status: input.status || "confirmed",
    preferences: input.preferences || "",
    parentContact: {
      parents: (input.parentContact?.parents || "").trim(),
      phone: input.parentContact.phone.trim(),
      email: input.parentContact.email.trim(),
    },
    notes: input.notes || "",
    startMonthIndex:
      input.startMonthIndex != null
        ? Number(input.startMonthIndex)
        : (() => {
            const now = new Date();
            const d = parseFlexibleBookingDate(input.placementStart, false);
            return d ? Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())) : 0;
          })(),
    endMonthIndex:
      input.endMonthIndex != null
        ? Number(input.endMonthIndex)
        : (() => {
            const now = new Date();
            const d = parseFlexibleBookingDate(input.kindergartenTransition, true);
            return d ? Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())) : 11;
          })(),
  });

  const saved = await booking.save();

  // If connected to an inquiry, update the inquiry status to booked and emit socket event
  if (input.inquiryId) {
    try {
      const isObjectId = input.inquiryId.length === 24;
      const updatedInquiry = await Inquiry.findOneAndUpdate(
        {
          $or: [
            ...(isObjectId ? [{ _id: input.inquiryId }] : []),
            { referenceId: input.inquiryId },
          ],
        },
        { $set: { status: "booked" } },
        { new: true }
      );

      if (updatedInquiry) {
        emitInquiryUpdated({
          inquiryId: String(updatedInquiry._id),
          referenceId: updatedInquiry.referenceId,
          caretakerIds: updatedInquiry.caretakerIds?.map(String) || [caretakerId],
          status: "booked",
          action: "status_changed",
        });
      }
    } catch (err) {
      console.warn("[BookingService] Could not update inquiry status:", err);
    }
  }

  // Notify clients that availability and slots have updated
  emitDaycareUpdated({
    daycareId: String(daycareId || ""),
    caretakerId,
    action: "updated",
  });

  return saved;
};

export const getCaretakerBookingsService = async (
  caretakerId: string,
  query: { category?: string; status?: string; search?: string; startDate?: string; endDate?: string } = {}
): Promise<IBooking[]> => {
  const filter: any = { caretakerId };
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }
  if (query.search) {
    const s = query.search.trim();
    const regex = new RegExp(s, "i");
    filter.$or = [
      { childName: regex },
      { referenceId: regex },
      { "parentContact.phone": regex },
      { "parentContact.email": regex },
      { "parentContact.parents": regex },
    ];
  }

  const bookings = await Booking.find(filter).sort({ placementStart: 1, createdAt: -1 });

  // If date range is specified, filter for bookings that overlap the range:
  // (bEnd >= filterStart && bStart <= filterEnd)
  if (query.startDate || query.endDate) {
    const filterStart = query.startDate ? parseBookingDate(query.startDate, false) : null;
    const filterEnd = query.endDate ? parseBookingDate(query.endDate, true) : null;

    return bookings.filter((b) => {
      const bStart = parseBookingDate(b.placementStart, false);
      const bEnd = parseBookingDate(b.kindergartenTransition, true);

      // Overlap logic: Include bookings that overlap the selected range,
      // even when their start or end dates fall outside it
      if (filterStart && bEnd && bEnd < filterStart) return false;
      if (filterEnd && bStart && bStart > filterEnd) return false;
      return true;
    });
  }

  return bookings;
};

export const updateBookingService = async (
  caretakerId: string,
  bookingId: string,
  updateData: Partial<CreateBookingInput>
): Promise<IBooking | null> => {
  const updated = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      caretakerId,
    },
    { $set: updateData },
    { new: true }
  );

  if (updated) {
    emitDaycareUpdated({
      daycareId: String(updated.daycareId || ""),
      caretakerId,
      action: "updated",
    });
  }

  return updated;
};

export const deleteBookingService = async (
  caretakerId: string,
  bookingId: string
): Promise<boolean> => {
  const result = await Booking.findOneAndDelete({
    _id: bookingId,
    caretakerId,
  });

  if (result) {
    emitDaycareUpdated({
      daycareId: String(result.daycareId || ""),
      caretakerId,
      action: "updated",
    });
  }

  return Boolean(result);
};
