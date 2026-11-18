/**
 * Centralized Booking Date Normalization, Overlap Calculation & Dynamic Classification
 * Strictly adheres to business logic:
 * - Current Bookings: Active bookings today + chained overlapping booking periods,
 *   OR earliest upcoming booking + chained overlapping booking periods (when all in future).
 * - Future Bookings: All subsequent non-overlapping bookings starting after the first group.
 * - Completed Bookings: Past bookings whose end date is before today (excluded from Current & Future).
 */

const MONTH_ALIASES: string[][] = [
  ["jan", "januar", "january"],
  ["feb", "februar", "february"],
  ["mär", "mar", "maerz", "märz", "march"],
  ["apr", "april"],
  ["mai", "may"],
  ["jun", "juni", "june"],
  ["jul", "juli", "july"],
  ["aug", "august"],
  ["sep", "september"],
  ["okt", "oct", "oktober", "october"],
  ["nov", "november"],
  ["dez", "dec", "dezember", "december"],
];

function findMonthIndex(mStr: string): number {
  const clean = mStr.trim().toLowerCase().replace(/[^a-zäöü]/g, "");
  return MONTH_ALIASES.findIndex((aliases) =>
    aliases.some((alias) => clean === alias || clean.startsWith(alias))
  );
}

/**
 * Parses flexible date strings into normalized JavaScript Date objects.
 * Handles:
 * - "Dec 2026", "Feb 2027", "Mar 2027", "Jun 2028"
 * - German months: "Dez 2026", "März 2027", "Mai 2027", "Okt 2027"
 * - ISO formats: "2027-05-13", "2028-11-29", "2027-05-13T00:00:00.000Z", "2027-05"
 * - German format: "13.05.2027", "01.12.2026", "29.11.2028"
 * - "18, Nov, 2026", "18 Nov 2026"
 * 
 * @param dateStr Raw input string
 * @param isEndOfPeriod When true, dates specifying only a month extend to the last day at 23:59:59.999
 */
export function parseFlexibleBookingDate(
  dateStr?: string | null,
  isEndOfPeriod: boolean = false
): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const str = dateStr.trim();
  if (!str) return null;

  // 1. ISO YYYY-MM-DD or YYYY-MM (or with time)
  const isoMatch = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(str);
  if (isoMatch && isoMatch[1] && isoMatch[2]) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    if (isoMatch[3]) {
      const day = parseInt(isoMatch[3], 10);
      return isEndOfPeriod
        ? new Date(year, month, day, 23, 59, 59, 999)
        : new Date(year, month, day, 0, 0, 0, 0);
    }
    // Only year-month (e.g. "2027-05")
    return isEndOfPeriod
      ? new Date(year, month + 1, 0, 23, 59, 59, 999)
      : new Date(year, month, 1, 0, 0, 0, 0);
  }

  // 2. German DD.MM.YYYY
  const deMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(str);
  if (deMatch && deMatch[1] && deMatch[2] && deMatch[3]) {
    const day = parseInt(deMatch[1], 10);
    const month = parseInt(deMatch[2], 10) - 1;
    const year = parseInt(deMatch[3], 10);
    return isEndOfPeriod
      ? new Date(year, month, day, 23, 59, 59, 999)
      : new Date(year, month, day, 0, 0, 0, 0);
  }

  // 3. Day + Month Name + Year (e.g. "18, Nov, 2026" or "18 Nov 2026")
  const dayMonthYearMatch = /^(\d{1,2})[\s,]+([a-zA-ZäöüÄÖÜ]+)[\s,]+(\d{4})/.exec(str);
  if (dayMonthYearMatch && dayMonthYearMatch[1] && dayMonthYearMatch[2] && dayMonthYearMatch[3]) {
    const day = parseInt(dayMonthYearMatch[1], 10);
    const mStr = dayMonthYearMatch[2];
    const year = parseInt(dayMonthYearMatch[3], 10);
    const mIdx = findMonthIndex(mStr);
    if (mIdx !== -1) {
      return isEndOfPeriod
        ? new Date(year, mIdx, day, 23, 59, 59, 999)
        : new Date(year, mIdx, day, 0, 0, 0, 0);
    }
  }

  // 4. Month Name + Year (e.g. "Dec 2026", "December 2026", "Feb 2027", "März 2027")
  const monthYearMatch = /([a-zA-ZäöüÄÖÜ]+)[\s,.-]+(\d{4})|(\d{4})[\s,.-]+([a-zA-ZäöüÄÖÜ]+)/.exec(str);
  if (monthYearMatch) {
    const mStr = monthYearMatch[1] || monthYearMatch[4] || "";
    const yStr = monthYearMatch[2] || monthYearMatch[3] || "";
    const year = parseInt(yStr, 10);
    const mIdx = findMonthIndex(mStr);
    if (mIdx !== -1 && !isNaN(year)) {
      return isEndOfPeriod
        ? new Date(year, mIdx + 1, 0, 23, 59, 59, 999)
        : new Date(year, mIdx, 1, 0, 0, 0, 0);
    }
  }

  // 5. Fallback Date constructor
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return isEndOfPeriod
      ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999)
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }

  return null;
}

export interface BookingClassificationInput {
  placementStart?: string | null;
  kindergartenTransition?: string | null;
  status?: string | null;
  inquiryStatus?: string | null;
}

/**
 * Classifies bookings into Current and Future using inclusive chained overlapping:
 * - Excludes cancelled, rejected, and completed/past bookings.
 * - Current Bookings:
 *   1. If one or more bookings are active today, includes all active bookings.
 *   2. Extends current group end date for every chained overlapping booking (`next.startDate <= currentGroupEndDate`).
 *   3. If no bookings are active today, uses the earliest upcoming booking and all chained overlapping bookings.
 * - Future Bookings: All subsequent non-overlapping bookings starting after the first group.
 */
export function classifyOverlappingBookings<T extends BookingClassificationInput>(
  bookings: T[],
  today: Date = new Date()
): {
  current: T[];
  future: T[];
  completed: T[];
} {
  const normalizedTodayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const normalizedTodayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  // 1. Separate cancelled / rejected / declined
  const nonCancelled = bookings.filter((b) => {
    const st = (b.status || "").toLowerCase();
    const inqSt = (b.inquiryStatus || "").toLowerCase();
    return st !== "cancelled" && st !== "rejected" && st !== "declined" && inqSt !== "declined";
  });

  // 2. Separate completed bookings (explicit status 'completed' OR ended before today)
  const completed: T[] = [];
  const activeAndUpcoming: { item: T; startDate: Date; endDate: Date }[] = [];

  for (const b of nonCancelled) {
    const sDate = parseFlexibleBookingDate(b.placementStart, false);
    const eDate = parseFlexibleBookingDate(b.kindergartenTransition, true);

    const isExplicitlyCompleted = (b.status || "").toLowerCase() === "completed";
    const isPastDate = eDate !== null && eDate < normalizedTodayStart;

    if (isExplicitlyCompleted || isPastDate) {
      completed.push(b);
    } else if (sDate && eDate) {
      activeAndUpcoming.push({ item: b, startDate: sDate, endDate: eDate });
    } else {
      // If dates cannot be parsed, treat as upcoming fallback
      const fallbackStart = sDate || new Date(9999, 11, 31);
      const fallbackEnd = eDate || fallbackStart;
      activeAndUpcoming.push({ item: b, startDate: fallbackStart, endDate: fallbackEnd });
    }
  }

  // 3. Sort active and upcoming bookings by startDate ascending, then endDate ascending
  activeAndUpcoming.sort((a, b) => {
    const sDiff = a.startDate.getTime() - b.startDate.getTime();
    if (sDiff !== 0) return sDiff;
    return a.endDate.getTime() - b.endDate.getTime();
  });

  if (activeAndUpcoming.length === 0) {
    return { current: [], future: [], completed };
  }

  const current: T[] = [];
  const future: T[] = [];

  // 4. Check if any bookings are active today
  const activeToday = activeAndUpcoming.filter(
    (b) => b.startDate <= normalizedTodayEnd && b.endDate >= normalizedTodayStart
  );

  if (activeToday.length > 0) {
    // Case A: At least one booking is currently active today
    // Initial current group comprises all active bookings
    const activeItemSet = new Set<T>(activeToday.map((b) => b.item));
    let currentGroupEndDate = new Date(
      Math.max(...activeToday.map((b) => b.endDate.getTime()))
    );

    activeToday.forEach((b) => current.push(b.item));

    // Iterate through subsequent bookings starting after today (or not in activeToday)
    const upcomingList = activeAndUpcoming.filter((b) => !activeItemSet.has(b.item));

    for (const entry of upcomingList) {
      // Inclusive date overlap: nextBooking.startDate <= currentGroupEndDate
      if (entry.startDate <= currentGroupEndDate) {
        current.push(entry.item);
        if (entry.endDate > currentGroupEndDate) {
          currentGroupEndDate = entry.endDate;
        }
      } else {
        future.push(entry.item);
      }
    }
  } else {
    // Case B: No booking active today (all bookings in future relative to today)
    // Identify earliest upcoming booking period
    const firstEntry = activeAndUpcoming[0];
    if (firstEntry) {
      current.push(firstEntry.item);
      let currentGroupEndDate = firstEntry.endDate;

      // Chained overlap check
      for (let i = 1; i < activeAndUpcoming.length; i++) {
        const entry = activeAndUpcoming[i];
        if (!entry) continue;
        // Inclusive date overlap: nextBooking.startDate <= currentGroupEndDate
        if (entry.startDate <= currentGroupEndDate) {
          current.push(entry.item);
          if (entry.endDate > currentGroupEndDate) {
            currentGroupEndDate = entry.endDate;
          }
        } else {
          future.push(entry.item);
        }
      }
    }
  }

  return { current, future, completed };
}

/**
 * Filters bookings that overlap a specific date window [windowStart, windowEnd]:
 * (bEnd >= windowStart && bStart <= windowEnd)
 */
export function filterBookingsByDateRange<T extends BookingClassificationInput>(
  bookings: T[],
  windowStart: Date,
  windowEnd: Date
): T[] {
  return bookings.filter((b) => {
    const sDate = parseFlexibleBookingDate(b.placementStart, false);
    const eDate = parseFlexibleBookingDate(b.kindergartenTransition, true);
    if (!sDate && !eDate) return true;
    if (eDate && eDate < windowStart) return false;
    if (sDate && sDate > windowEnd) return false;
    return true;
  });
}
