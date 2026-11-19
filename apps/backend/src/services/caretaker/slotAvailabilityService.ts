import { Booking } from "@/modules/caretaker/booking.js";
import Daycare from "@/modules/caretaker/daycare.js";
import { IBooking } from "@/types/caretaker/booking.js";

export interface AvailableDateOption {
  date: string; // ISO string e.g. "2027-02-01"
  year: number; // e.g. 2027
  month: number; // 1-12
  monthNameEn: string; // e.g. "Feb"
  monthNameDe: string; // e.g. "Feb"
  label: string; // e.g. "Feb, 2027"
  labelDe: string; // e.g. "Feb, 2027"
  totalSlots: number; // e.g. 5
  bookedSlots: number; // e.g. 3
  availableSlots: number; // e.g. 2
}

const DE_MONTHS = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const EN_MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MONTH_INDEX_MAP: Record<string, number> = {
  januar: 1, jan: 1, january: 1,
  februar: 2, feb: 2, february: 2,
  märz: 3, maerz: 3, mar: 3, march: 3, mär: 3,
  april: 4, apr: 4,
  mai: 5, may: 5,
  juni: 6, jun: 6, june: 6,
  juli: 7, jul: 7, july: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10, october: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12, dec: 12, december: 12,
};

/**
 * Robust date parser supporting ISO, DD.MM.YYYY, DD, MMM, YYYY, and German/English month names
 */
export function parseFlexibleDate(dateStr?: string | Date | null): { date: Date; year: number; month: number } | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return {
      date: dateStr,
      year: dateStr.getFullYear(),
      month: dateStr.getMonth() + 1,
    };
  }

  const str = String(dateStr).trim().toLowerCase();
  if (!str) return null;

  // 1) ISO: YYYY-MM-DD or YYYY-MM
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3] || "1", 10);
    return {
      date: new Date(y, m - 1, d),
      year: y,
      month: m,
    };
  }

  // 2) DD MMM, YYYY or DD, MMM, YYYY e.g. "18 Nov, 2026", "18, Nov, 2026", "01 Feb, 2027"
  const dayMonthYearMatch = str.match(/^(\d{1,2})[\s,]+([a-zA-ZäöüÄÖÜ]+)[\s,]+(\d{4})/);
  if (dayMonthYearMatch) {
    const d = parseInt(dayMonthYearMatch[1], 10);
    const monthKey = dayMonthYearMatch[2].toLowerCase();
    const m = MONTH_INDEX_MAP[monthKey] || MONTH_INDEX_MAP[monthKey.slice(0, 3)] || 1;
    const y = parseInt(dayMonthYearMatch[3], 10);
    return {
      date: new Date(y, m - 1, d),
      year: y,
      month: m,
    };
  }

  // 3) DD.MM.YYYY or D.M.YYYY
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    const d = parseInt(dotMatch[1], 10);
    const m = parseInt(dotMatch[2], 10);
    const y = parseInt(dotMatch[3], 10);
    return {
      date: new Date(y, m - 1, d),
      year: y,
      month: m,
    };
  }

  // 4) Named month with year: e.g. "Februar 2027", "February 2027", "Feb 2027", "Dezember 2026"
  const wordYearMatch = str.match(/([a-zA-ZäöüÄÖÜ]+)[^\d]*(\d{4})/);
  if (wordYearMatch) {
    const monthKey = wordYearMatch[1].toLowerCase();
    const m = MONTH_INDEX_MAP[monthKey] || MONTH_INDEX_MAP[monthKey.slice(0, 3)] || 1;
    const y = parseInt(wordYearMatch[2], 10);
    return {
      date: new Date(y, m - 1, 1),
      year: y,
      month: m,
    };
  }

  // 5) MM/YYYY or MM-YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10);
    const y = parseInt(slashMatch[2], 10);
    return {
      date: new Date(y, m - 1, 1),
      year: y,
      month: m,
    };
  }

  // 6) Fallback native Date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      date: parsed,
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
    };
  }

  return null;
}

/**
 * Checks if a booking period [bStart, bEnd] overlaps with a calendar month (year, month).
 * A booking is active during a month if:
 * bStart <= monthEnd AND bEnd >= monthStart
 */
export function isBookingOverlappingMonth(
  bookingStart: Date,
  bookingEnd: Date,
  year: number,
  month: number
): boolean {
  // First millisecond of month: Year, Month-1, 1, 00:00:00.000
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  // Last millisecond of month: Year, Month, 0, 23:59:59.999
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  return bookingStart <= monthEnd && bookingEnd >= monthStart;
}

/**
 * Counts how many confirmed bookings are active in a specific month.
 * Excludes cancelled and rejected/declined bookings.
 */
export function countBookedSlotsInMonth(
  bookings: IBooking[],
  year: number,
  month: number
): number {
  return bookings.reduce((count, b) => {
    // Only count active confirmed bookings
    const status = String(b.status || "").toLowerCase();
    if (status === "cancelled" || status === "declined" || status === "rejected") {
      return count;
    }

    const start = parseFlexibleDate(b.placementStart);
    if (!start) return count;

    let end = parseFlexibleDate(b.kindergartenTransition);
    if (!end) {
      // Default to 1 year if transition not specified
      end = {
        date: new Date(start.year + 1, start.month - 1, 1),
        year: start.year + 1,
        month: start.month,
      };
    }

    if (isBookingOverlappingMonth(start.date, end.date, year, month)) {
      return count + 1;
    }
    return count;
  }, 0);
}

/**
 * Calculates availability for a given month.
 */
export function calculateMonthAvailability(
  totalCapacity: number,
  bookings: IBooking[],
  year: number,
  month: number
): { totalSlots: number; bookedSlots: number; availableSlots: number; isAvailable: boolean } {
  const bookedSlots = countBookedSlotsInMonth(bookings, year, month);
  const availableSlots = Math.max(0, totalCapacity - bookedSlots);
  return {
    totalSlots: totalCapacity,
    bookedSlots,
    availableSlots,
    isAvailable: availableSlots > 0,
  };
}

/**
 * Generates upcoming genuinely available date options.
 * Starting from today (or visibility window start if in the future).
 * Fully booked months (availableSlots < minSlots) and past months are skipped.
 */
export async function calculateUpcomingAvailableDates(
  caretakerId: string,
  daycare: any,
  limit: number = 12,
  minSlots: number = 1
): Promise<AvailableDateOption[]> {
  const totalCapacity = Number(daycare?.operations?.maxCapacity || daycare?.maxCapacity || daycare?.slots || 5) || 5;

  // Fetch confirmed bookings for this caretaker / daycare
  const query: any = {
    $or: [
      { caretakerId },
      ...(daycare?._id ? [{ daycareId: daycare._id }] : []),
    ],
    status: { $nin: ["cancelled", "declined", "rejected"] },
  };

  const bookings = await Booking.find(query).lean();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Determine starting point:
  let startYear = currentYear;
  let startMonth = currentMonth;

  const vis = parseFlexibleDate(daycare?.operations?.visibilityWindow || daycare?.visibilityWindow);
  if (vis && (vis.year > currentYear || (vis.year === currentYear && vis.month >= currentMonth))) {
    // Visibility window is in the future or current, start there
    startYear = vis.year;
    startMonth = vis.month;
  }

  const results: AvailableDateOption[] = [];
  let checkYear = startYear;
  let checkMonth = startMonth;

  // Scan up to 24 consecutive months ahead
  for (let step = 0; step < 24 && results.length < limit; step++) {
    // Skip if before current month in reality
    const isPast = checkYear < currentYear || (checkYear === currentYear && checkMonth < currentMonth);

    if (!isPast) {
      const avail = calculateMonthAvailability(totalCapacity, bookings as any, checkYear, checkMonth);

      // Only include dates where availableSlots >= minSlots
      if (avail.availableSlots >= minSlots) {
        const monthNumPadded = String(checkMonth).padStart(2, "0");
        const isoDate = `${checkYear}-${monthNumPadded}-01`;
        const mDe = DE_MONTHS[checkMonth] || "Mon";
        const mEn = EN_MONTHS[checkMonth] || "Mon";

        results.push({
          date: isoDate,
          year: checkYear,
          month: checkMonth,
          monthNameEn: mEn,
          monthNameDe: mDe,
          label: `${mEn}, ${checkYear}`,
          labelDe: `${mDe}, ${checkYear}`,
          totalSlots: totalCapacity,
          bookedSlots: avail.bookedSlots,
          availableSlots: avail.availableSlots,
        });
      }
    }

    // Advance to next month
    checkMonth++;
    if (checkMonth > 12) {
      checkMonth = 1;
      checkYear++;
    }
  }

  return results;
}

/**
 * Validates whether a caretaker has available capacity throughout a proposed booking period.
 * Checks every month in [placementStart, kindergartenTransition].
 * Throws or returns detailed conflict if any month in the range is full.
 */
export async function validateBookingCapacity(
  caretakerId: string,
  daycareId: string | undefined,
  placementStart: string,
  kindergartenTransition: string,
  excludeBookingId?: string
): Promise<{
  isAvailable: boolean;
  minAvailableSlots: number;
  conflictMonth?: string;
  totalCapacity: number;
  assignedSlotNumber: number;
}> {
  let daycare = null;
  if (daycareId) {
    daycare = await Daycare.findById(daycareId).lean();
  }
  if (!daycare) {
    daycare = await Daycare.findOne({ caretakerId }).lean();
  }

  const totalCapacity = Number(daycare?.operations?.maxCapacity || daycare?.maxCapacity || daycare?.slots || 5) || 5;

  const startParsed = parseFlexibleDate(placementStart);
  if (!startParsed) {
    throw new Error("Invalid placement start date.");
  }

  let endParsed = parseFlexibleDate(kindergartenTransition);
  if (!endParsed) {
    endParsed = {
      date: new Date(startParsed.year + 1, startParsed.month - 1, 1),
      year: startParsed.year + 1,
      month: startParsed.month,
    };
  }

  if (endParsed.date < startParsed.date) {
    throw new Error("Kindergarten transition date cannot be earlier than placement start date.");
  }

  // Fetch active bookings
  const query: any = {
    $or: [
      { caretakerId },
      ...(daycare?._id ? [{ daycareId: daycare._id }] : []),
    ],
    status: { $nin: ["cancelled", "declined", "rejected"] },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query).lean();

  let minAvailableSlots = totalCapacity;
  let conflictMonth: string | undefined = undefined;

  // Track used slot numbers across the entire duration
  const usedSlotNumbers = new Set<number>();

  let currYear = startParsed.year;
  let currMonth = startParsed.month;
  const targetEndYear = endParsed.year;
  const targetEndMonth = endParsed.month;

  while (currYear < targetEndYear || (currYear === targetEndYear && currMonth <= targetEndMonth)) {
    const avail = calculateMonthAvailability(totalCapacity, existingBookings as any, currYear, currMonth);

    if (avail.availableSlots < minAvailableSlots) {
      minAvailableSlots = avail.availableSlots;
    }

    if (avail.availableSlots <= 0) {
      const monthLabel = `${EN_MONTHS[currMonth]} ${currYear}`;
      conflictMonth = monthLabel;
      return {
        isAvailable: false,
        minAvailableSlots: 0,
        conflictMonth,
        totalCapacity,
        assignedSlotNumber: 1,
      };
    }

    // Collect occupied slot numbers for bookings overlapping this month
    for (const b of existingBookings) {
      const bStart = parseFlexibleDate(b.placementStart);
      const bEnd = parseFlexibleDate(b.kindergartenTransition) || (bStart ? { date: new Date(bStart.year + 1, bStart.month - 1, 1), year: bStart.year + 1, month: bStart.month } : null);
      if (bStart && bEnd && isBookingOverlappingMonth(bStart.date, bEnd.date, currYear, currMonth)) {
        if (b.slotNumber && b.slotNumber >= 1 && b.slotNumber <= totalCapacity) {
          usedSlotNumbers.add(b.slotNumber);
        }
      }
    }

    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }

  // Find lowest free slotNumber (1 to totalCapacity)
  let assignedSlotNumber = 1;
  for (let s = 1; s <= totalCapacity; s++) {
    if (!usedSlotNumbers.has(s)) {
      assignedSlotNumber = s;
      break;
    }
  }

  return {
    isAvailable: true,
    minAvailableSlots,
    totalCapacity,
    assignedSlotNumber,
  };
}
