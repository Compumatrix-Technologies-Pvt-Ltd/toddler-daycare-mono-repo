"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { Footer } from "../../../components/Footer";
import { GanttCalendar } from "../../../components/caretaker/dashboard/GanttCalendar";
import { BookingDetailsPanel } from "../../../components/caretaker/dashboard/BookingDetailsPanel";
import { AddBookingModal } from "../../../components/caretaker/dashboard/AddBookingModal";
import { ManageSlotModal } from "../../../components/caretaker/dashboard/ManageSlotModal";
import { ContactParentsModal } from "../../../components/caretaker/dashboard/ContactParentsModal";
import { ExportModal } from "../../../components/caretaker/dashboard/ExportModal";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useCaretaker } from "../../../context/CaretakerContext";
import { caretakerApi } from "../../../utils/caretakerApi";
import { fetchInquiries, updateInquiryStatus } from "../../../utils/inquery";
import { getSocket } from "../../../utils/socket";
import { BookingItem, GanttMonth, InquiryStatus, YearGroup } from "../../../types/caretakerDashboard";
import { calculateDistanceKm } from "../../../utils/geoDistance";
import {
  parseFlexibleBookingDate,
  classifyOverlappingBookings,
  filterBookingsByDateRange,
} from "@repo/shared";

const MONTH_SHORT_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function buildGanttTimeline(startDate: Date = new Date(), totalMonths = 22): { months: GanttMonth[]; years: YearGroup[] } {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const months: GanttMonth[] = [];
  const yearCounts = new Map<number, number>();
  const now = new Date();

  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const shortName = MONTH_SHORT_NAMES[m];
    const yy = String(y).slice(-2);
    const isThisMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    months.push({
      id: `${y}-${String(m + 1).padStart(2, "0")}`,
      year: y,
      shortName,
      fullLabel: `${shortName} ${yy}`,
      ...(isThisMonth ? { isCurrentMonth: true } : {}),
    });
    yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
  }

  const years: YearGroup[] = Array.from(yearCounts.entries()).map(([year, monthsCount]) => ({
    year,
    monthsCount,
  }));

  return { months, years };
}

const DEFAULT_GANTT_TIMELINE = buildGanttTimeline(new Date(), 22);

function parseBookingDate(dateStr?: string, isEndOfPeriod: boolean = false): Date | null {
  return parseFlexibleBookingDate(dateStr, isEndOfPeriod);
}

function parseCapacity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function mapBackendStatusToDashboard(status?: string): InquiryStatus {
  switch ((status || "").toLowerCase()) {
    case "contacted":
      return "Reviewing";
    case "accepted":
      return "Accepted";
    case "booked":
      return "Booked";
    case "rejected":
    case "declined":
      return "Declined";
    default:
      return "New";
  }
}

function mapDashboardStatusToBackend(status: InquiryStatus): string {
  switch (status) {
    case "Reviewing":
    case "Invited":
      return "contacted";
    case "Accepted":
      return "accepted";
    case "Booked":
      return "booked";
    case "Declined":
      return "rejected";
    default:
      return "pending";
  }
}

function resolveStartMonthIndex(desiredStart?: string, months: GanttMonth[] = DEFAULT_GANTT_TIMELINE.months): number {
  if (!desiredStart) return 0;
  const d = parseBookingDate(desiredStart);
  if (!d) return 0;
  if (!months || months.length === 0) return 0;
  const targetId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const found = months.findIndex((gm) => gm.id === targetId);
  if (found >= 0) return found;

  const firstMonthNum = parseInt(months[0].id.split("-")[1], 10) - 1;
  const firstD = new Date(months[0].year, firstMonthNum, 1);
  if (d < firstD) return 0;
  return Math.max(0, months.length - 1);
}

function mapInquiryToBookingItem(
  inq: any,
  category: "inquiry" | "future",
  daycareLocation?: {
    latitude?: number;
    longitude?: number;
    catchmentRadiusKm?: number;
    city?: string;
    street?: string;
  } | null,
  fallbackCatchmentRadius = 3,
  index = 0,
  lang: "de" | "en" = "de",
  months: GanttMonth[] = DEFAULT_GANTT_TIMELINE.months
): BookingItem {
  const startIdx = resolveStartMonthIndex(inq.desiredStart, months);
  const endIdx = Math.min(months.length > 0 ? months.length - 1 : 21, startIdx + 10);
  const startLabel = inq.desiredStart || months[startIdx]?.fullLabel || "";
  const endLabel = months[endIdx]?.fullLabel || "";
  const periodLabel = endLabel ? `${startLabel} – ${endLabel}` : startLabel;
  const isAnInquiry = category === "inquiry";

  const prefParts = [
    inq.preferences?.gender,
    inq.preferences?.food,
    inq.preferences?.pets,
  ].filter(Boolean);

  const cleanDesiredStart =
    inq.desiredStart && inq.desiredStart !== "Flexibel / Nach Absprache"
      ? inq.desiredStart
      : "";

  // Dynamic distance computation from parent inquiry's location & daycare location
  const radius = daycareLocation?.catchmentRadiusKm || fallbackCatchmentRadius || 3;
  const parentLat = inq.currentLocation?.lat ?? inq.searchLocation?.lat;
  const parentLng =
    inq.currentLocation?.lng ??
    inq.currentLocation?.log ??
    inq.searchLocation?.lng ??
    inq.searchLocation?.log;
  const parentArea =
    inq.currentLocation?.area ||
    inq.searchLocation?.area ||
    inq.searchLocation?.address;

  const daycareLat = daycareLocation?.latitude;
  const daycareLng = daycareLocation?.longitude;

  let computedLocationDistance = "";
  let computedLocationDistanceDe = "";

  if (
    parentLat != null &&
    parentLng != null &&
    daycareLat != null &&
    daycareLng != null &&
    !isNaN(Number(parentLat)) &&
    !isNaN(Number(parentLng)) &&
    !isNaN(Number(daycareLat)) &&
    !isNaN(Number(daycareLng))
  ) {
    const dist = calculateDistanceKm(
      Number(parentLat),
      Number(parentLng),
      Number(daycareLat),
      Number(daycareLng)
    );
    if (dist !== Infinity) {
      const distStr = dist.toFixed(1);
      const distStrDe = distStr.replace(".", ",");
      computedLocationDistance = `${distStr} km away (within ${radius}km)`;
      computedLocationDistanceDe = `${distStrDe} km entfernt (im ${radius}km-Radius)`;
    }
  }

  if (!computedLocationDistance && inq.locationDistance) {
    computedLocationDistance = inq.locationDistance;
    computedLocationDistanceDe = inq.locationDistanceDe || inq.locationDistance;
  }

  if (!computedLocationDistance && parentArea) {
    computedLocationDistance = `${parentArea} (within ${radius}km)`;
    computedLocationDistanceDe = `${parentArea} (im ${radius}km-Radius)`;
  }

  if (!computedLocationDistance) {
    computedLocationDistance = `Within ${radius}km`;
    computedLocationDistanceDe = `Im ${radius}km-Radius`;
  }

  // Functional match percentage calculation (never 0%)
  let dynamicMatch = 65;
  if (inq.desiredStart && inq.desiredStart !== "Flexibel / Nach Absprache") dynamicMatch += 15;
  if (inq.careHours && inq.careHours.length > 5) dynamicMatch += 10;
  if (computedLocationDistance && !computedLocationDistance.includes(">")) dynamicMatch += 10;
  const calculatedMatch = Math.min(95, Math.max(65, inq.matchPercent || dynamicMatch));

  // Default child name for inquiries: Inquiry 1, Inquiry 2, etc.
  const defaultInquiryName = lang === "de" ? `Anfrage ${index + 1}` : `Inquiry ${index + 1}`;
  const resolvedChildName =
    inq.childName &&
    inq.childName !== "Child" &&
    inq.childName !== "1 Kind" &&
    !inq.childName.startsWith("Familie ")
      ? inq.childName
      : (isAnInquiry ? defaultInquiryName : inq.parentName || "Kind");

  return {
    id: String(inq._id || inq.id || inq.referenceId || ""),
    childName: resolvedChildName,
    childAge: inq.childBirthday ? `DOB: ${inq.childBirthday}` : "",
    childAgeDe: inq.childBirthday ? `Geb.: ${inq.childBirthday}` : "",
    placementStart: isAnInquiry ? cleanDesiredStart : startLabel,
    placementStartDe: isAnInquiry ? cleanDesiredStart : startLabel,
    kindergartenTransition: isAnInquiry ? (inq.estTransition || "") : endLabel,
    kindergartenTransitionDe: isAnInquiry ? (inq.estTransition || "") : endLabel,
    period: periodLabel,
    periodDe: periodLabel,
    startMonthIndex: startIdx,
    endMonthIndex: endIdx,
    dailyHours: isAnInquiry ? (inq.careHours && inq.careHours !== "Mo – Fr • 08:00 – 15:00" ? inq.careHours : "") : (inq.careHours || "Mon – Fri • 08:00 – 15:00"),
    dailyHoursDe: isAnInquiry ? (inq.careHours && inq.careHours !== "Mo – Fr • 08:00 – 15:00" ? inq.careHours : "") : (inq.careHours || "Mo. – Fr. • 08:00 – 15:00 Uhr"),
    parentContact: {
      parents: inq.parentName || "",
      phone: inq.phone || "",
      email: inq.email || "",
    },
    category,
    isBooked: category === "future",
    inquiryStatus: mapBackendStatusToDashboard(inq.status),
    dob: inq.childBirthday || "",
    desiredStart: isAnInquiry ? cleanDesiredStart : startLabel,
    desiredStartDe: isAnInquiry ? cleanDesiredStart : startLabel,
    estTransition: inq.estTransition || "",
    estTransitionDe: inq.estTransition || "",
    preferences: prefParts.length > 0 ? prefParts.join(" • ") : "",
    preferencesDe: prefParts.length > 0 ? prefParts.join(" • ") : "",
    locationDistance: computedLocationDistance,
    locationDistanceDe: computedLocationDistanceDe,
    matchPercent: calculatedMatch,
    recommendedAllocation: {
      slotText: "Allocates to Slot 4 (follows David)",
      slotTextDe: "Zuordnung zu Platz 4 (nach David)",
      vacantMonthsText: "0 vacant mos",
      vacantMonthsTextDe: "0 Freimonate",
      note: "David leaves Dec 2027 • Starts Dec 2027",
      noteDe: "David wechselt Dez 2027 • Startet Dez 2027",
    },
    parentQuote: inq.note || "",
    parentQuoteDe: inq.note || "",
  };
}

/**
 * Classifies bookings into Current and Future based on chained overlapping periods
 * and today's date, adhering strictly to:
 * - Current Bookings: Bookings currently active based on today's date + any overlapping chained periods,
 *   OR the earliest booking + any overlapping chained periods (when all start in the future).
 * - Future Bookings: All subsequent non-overlapping bookings starting after the first group.
 * - Completed Bookings: Past bookings whose end date is before today (excluded).
 * - Timeline Window: Selected date range only filters visible bookings, never changing their classification.
 */
function classifyBookings(
  bookings: BookingItem[],
  windowStart: Date,
  windowEnd: Date,
  today: Date = new Date()
): { current: BookingItem[]; future: BookingItem[] } {
  // 1. Centralized chained overlapping grouping across all bookings
  const { current: allCurrent, future: allFuture } = classifyOverlappingBookings(bookings, today);

  // 2. Timeline window filtering (inclusive overlap: bEnd >= windowStart && bStart <= windowEnd)
  const visibleCurrent = filterBookingsByDateRange(allCurrent, windowStart, windowEnd).map((b) => ({
    ...b,
    category: "current" as const,
  }));

  const visibleFuture = filterBookingsByDateRange(allFuture, windowStart, windowEnd).map((b) => ({
    ...b,
    category: "future" as const,
  }));

  return { current: visibleCurrent, future: visibleFuture };
}

function mapDbBookingToBookingItem(
  b: any,
  months: GanttMonth[] = DEFAULT_GANTT_TIMELINE.months,
  category: "current" | "future" = "current"
): BookingItem {
  const dStart = parseFlexibleBookingDate(b.placementStart, false);
  const dEnd = parseFlexibleBookingDate(b.kindergartenTransition, true);

  const m0 = months[0];
  const m0Month = m0 ? parseInt(m0.id.split("-")[1]!, 10) - 1 : 0;
  const m0Year = m0 ? m0.year : new Date().getFullYear();

  // Dynamic month difference calculated from actual dates relative to visible timeline
  const startIdx = dStart
    ? (dStart.getFullYear() - m0Year) * 12 + (dStart.getMonth() - m0Month)
    : (b.startMonthIndex ?? 0);

  const endIdx = dEnd
    ? (dEnd.getFullYear() - m0Year) * 12 + (dEnd.getMonth() - m0Month)
    : (b.endMonthIndex ?? startIdx + 11);

  const startLabel = b.placementStart || (months[Math.max(0, Math.min(months.length - 1, startIdx))]?.fullLabel || "");
  const endLabel = b.kindergartenTransition || (months[Math.max(0, Math.min(months.length - 1, endIdx))]?.fullLabel || "");
  const periodLabel = endLabel ? `${startLabel} – ${endLabel}` : startLabel;

  return {
    id: String(b._id || b.id || b.referenceId),
    inquiryId: b.inquiryId ? String(b.inquiryId) : undefined,
    childName: b.childName,
    childAge: b.childDob ? `DOB: ${b.childDob}` : "",
    childAgeDe: b.childDob ? `Geb.: ${b.childDob}` : "",
    placementStart: b.placementStart,
    placementStartDe: b.placementStart,
    kindergartenTransition: b.kindergartenTransition,
    kindergartenTransitionDe: b.kindergartenTransition,
    period: periodLabel,
    periodDe: periodLabel,
    startMonthIndex: startIdx,
    endMonthIndex: endIdx,
    dailyHours: b.dailyHours,
    dailyHoursDe: b.dailyHours,
    parentContact: {
      parents: b.parentContact?.parents || "",
      phone: b.parentContact?.phone || "",
      email: b.parentContact?.email || "",
    },
    category,
    isBooked: true,
    isExtendingRight: endIdx >= months.length,
    dob: b.childDob,
    desiredStart: b.placementStart,
    desiredStartDe: b.placementStart,
    estTransition: b.kindergartenTransition,
    estTransitionDe: b.kindergartenTransition,
    preferences: b.preferences || "",
    preferencesDe: b.preferences || "",
    parentQuote: b.notes || "",
    parentQuoteDe: b.notes || "",
  };
}

export default function CaretakerDashboardPage() {
  const { t, language } = useLanguage();
  const { profile } = useCaretaker();
  const vs = t.caretakerDashboard.viewSwitch;
  const tb = t.caretakerDashboard.toolbar;
  const dt = t.caretakerDashboard.details;

  // Bookings & Inquiries State (loaded dynamically from backend)
  const [currentBookings, setCurrentBookings] = useState<BookingItem[]>([]);
  const [futureBookings, setFutureBookings] = useState<BookingItem[]>([]);
  const [fittingInquiries, setFittingInquiries] = useState<BookingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BookingItem | null>(null);

  // Dynamic Timeline Start Date & Months (Functional Date Range Filter)
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { months: ganttMonths, years: ganttYears } = useMemo(() => {
    return buildGanttTimeline(timelineStartDate, 22);
  }, [timelineStartDate]);

  // Dynamic Date Range label
  const dateRangeLabel = useMemo(() => {
    if (ganttMonths.length === 0) return "";
    const first = ganttMonths[0];
    const last = ganttMonths[ganttMonths.length - 1];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthNamesDe = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];

    const firstMonthNum = parseInt(first.id.split("-")[1], 10) - 1;
    const lastMonthNum = parseInt(last.id.split("-")[1], 10) - 1;

    const firstStr = language === "de" ? `${monthNamesDe[firstMonthNum]} ${first.year}` : `${monthNamesEn[firstMonthNum]} ${first.year}`;
    const lastStr = language === "de" ? `${monthNamesDe[lastMonthNum]} ${last.year}` : `${monthNamesEn[lastMonthNum]} ${last.year}`;

    return `${firstStr} – ${lastStr}`;
  }, [ganttMonths, language]);

  // Filter params state (synchronized with API query params and URL)
  const [categoryFilter, setCategoryFilter] = useState<"all" | "current" | "future" | "inquiry">("all");
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dynamic capacity & catchment radius
  const [totalSlots, setTotalSlots] = useState<number>(() =>
    parseCapacity(profile.permitAuthorizedCapacity || profile.maxCapacity)
  );
  const [catchmentRadius, setCatchmentRadius] = useState<number>(3);

  // Sync with browser URL search params
  const updateUrlParams = (cat: string, q: string, st: string, date: Date = timelineStartDate) => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (cat && cat !== "all") url.searchParams.set("category", cat);
      else url.searchParams.delete("category");

      if (q) url.searchParams.set("search", q);
      else url.searchParams.delete("search");

      if (st && st !== "all") url.searchParams.set("status", st);
      else url.searchParams.delete("status");

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      url.searchParams.set("date", dateStr);

      setTimeout(() => {
        window.history.replaceState({}, "", url.toString());
      }, 0);
    } catch {
      // Ignore URL manipulation errors
    }
  };

  const loadDashboardData = useCallback(async (
    cat: "all" | "current" | "future" | "inquiry" = categoryFilter,
    q: string = filterQuery,
    st: string = statusFilter,
    activeTimelineDate: Date = timelineStartDate
  ) => {
    const token = caretakerApi.getToken();
    const caretakerId = caretakerApi.getCaretakerId();

    try {
      const activeTimeline = buildGanttTimeline(activeTimelineDate, 22);
      const activeMonths = activeTimeline.months;

      const windowStart = new Date(activeMonths[0].year, parseInt(activeMonths[0].id.split("-")[1], 10) - 1, 1);
      const windowEnd = new Date(activeMonths[activeMonths.length - 1].year, parseInt(activeMonths[activeMonths.length - 1].id.split("-")[1], 10), 0);
      const windowStartIso = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}-01`;
      const windowEndIso = `${windowEnd.getFullYear()}-${String(windowEnd.getMonth() + 1).padStart(2, "0")}-${String(windowEnd.getDate()).padStart(2, "0")}`;

      const [settingsRes, daycareRes, inquiriesRes, bookingsRes] = await Promise.all([
        caretakerApi.getSettings().catch(() => null),
        token ? caretakerApi.getDaycare().catch(() => null) : Promise.resolve(null),
        fetchInquiries({
          ...(caretakerId ? { caretakerId } : {}),
          token: token || undefined,
          search: q.trim() || undefined,
          status: st !== "all" ? st : undefined,
        }).catch(() => []),
        caretakerApi.getBookings({
          category: cat !== "all" && cat !== "inquiry" ? cat : undefined,
          status: st !== "all" ? st : undefined,
          search: q.trim() || undefined,
          startDate: windowStartIso,
          endDate: windowEndIso,
        }).catch(() => []),
      ]);

      if (settingsRes?.defaultCatchmentRadiusKm) {
        setCatchmentRadius(Number(settingsRes.defaultCatchmentRadiusKm) || 3);
      }

      if (daycareRes) {
        const cap = parseCapacity(
          daycareRes.operations?.maxCapacity ??
          daycareRes.workPermit?.authorizedCapacity ??
          profile.permitAuthorizedCapacity ??
          profile.maxCapacity
        );
        setTotalSlots(cap);
      }

      const list = Array.isArray(inquiriesRes) ? inquiriesRes : [];
      const daycareLocation = daycareRes?.location || null;
      const currentRadius = settingsRes?.defaultCatchmentRadiusKm
        ? Number(settingsRes.defaultCatchmentRadiusKm) || 3
        : (daycareLocation?.catchmentRadiusKm || catchmentRadius || 3);

      // 1. Map all bookings from MongoDB database
      const dbBookingsList = Array.isArray(bookingsRes)
        ? bookingsRes.map((b: any) => mapDbBookingToBookingItem(b, activeMonths))
        : [];

      // 2. Track all booked inquiry IDs to avoid duplicates across sections
      const bookedInquiryIds = new Set<string>();
      dbBookingsList.forEach((b: any) => {
        if (b.inquiryId) bookedInquiryIds.add(String(b.inquiryId));
        if (b._id) bookedInquiryIds.add(String(b._id));
        if (b.id) bookedInquiryIds.add(String(b.id));
      });

      // 3. Fitting Inquiries: EXCLUDE any inquiry marked as booked, accepted, declined, or rejected,
      // and any inquiry that already has a corresponding booking in the database
      const pendingList = list
        .filter((inq: any) => {
          const inqId = String(inq._id || inq.id || "");
          const refId = String(inq.referenceId || "");
          const isBooked =
            inq.status === "booked" ||
            inq.status === "accepted" ||
            bookedInquiryIds.has(inqId) ||
            (refId && bookedInquiryIds.has(refId));
          const isDeclined = inq.status === "declined" || inq.status === "rejected";
          return !isBooked && !isDeclined;
        })
        .map((inq: any, idx: number) =>
          mapInquiryToBookingItem(inq, "inquiry", daycareLocation, currentRadius, idx, language, activeMonths)
        );

      const finalInquiries = pendingList;

      // 4. Inquiries marked as accepted/booked in DB without a separate booking document yet
      const acceptedWithoutDbBooking = list
        .filter((inq: any) => {
          const inqId = String(inq._id || inq.id || "");
          const refId = String(inq.referenceId || "");
          const isBooked = inq.status === "booked" || inq.status === "accepted";
          const alreadyInDb = bookedInquiryIds.has(inqId) || (refId && bookedInquiryIds.has(refId));
          return isBooked && !alreadyInDb;
        })
        .map((inq: any, idx: number) =>
          mapInquiryToBookingItem(inq, "future", daycareLocation, currentRadius, idx, language, activeMonths)
        );

      // 5. Merge any locally-added manual bookings for this caretaker session
      let manualBookings: BookingItem[] = [];
      if (typeof window !== "undefined") {
        try {
          const storageKey = `toddler_manual_bookings_${caretakerId || "default"}`;
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.current)) manualBookings.push(...parsed.current);
            if (Array.isArray(parsed?.future)) manualBookings.push(...parsed.future);
          }
        } catch {
          // Ignore malformed local bookings
        }
      }

      // 6. Deduplicate all booking items by unique ID
      const allBookingsMap = new Map<string, BookingItem>();
      dbBookingsList.forEach((b) => allBookingsMap.set(b.id, b));
      acceptedWithoutDbBooking.forEach((b) => {
        if (!allBookingsMap.has(b.id)) allBookingsMap.set(b.id, b);
      });
      manualBookings.forEach((b) => {
        if (!allBookingsMap.has(b.id)) allBookingsMap.set(b.id, b);
      });
      const allUniqueBookings = Array.from(allBookingsMap.values());

      // 7. Dynamic Date-Based Classification (Section 2 & 3 Requirements):
      // - Classifies bookings that overlap the selected availability window
      // - Current Bookings: active today OR earliest booking period in selected window (e.g. Booking 1 in Dec 2026)
      // - Future Bookings: start after today / after earlier bookings (e.g. Booking 2 in Jan 2027)
      const now = new Date();
      const { current: classifiedCurrent, future: classifiedFuture } = classifyBookings(
        allUniqueBookings,
        windowStart,
        windowEnd,
        now
      );

      setCurrentBookings(classifiedCurrent);
      setFutureBookings(classifiedFuture);
      setFittingInquiries(finalInquiries);

      setSelectedItem((prev) => {
        const combined = [...classifiedCurrent, ...classifiedFuture, ...finalInquiries];
        if (prev && combined.some((item) => item.id === prev.id)) {
          return combined.find((item) => item.id === prev.id) || prev;
        }
        return combined[0] || null;
      });
    } catch (err) {
      console.error("Failed to load caretaker dashboard data:", err);
    }
  }, [profile.maxCapacity, profile.permitAuthorizedCapacity, language, catchmentRadius, categoryFilter, filterQuery, statusFilter, timelineStartDate]);

  // Date range navigation handlers (Today, Prev, Next)
  const handleToday = () => {
    const now = new Date();
    const todayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setTimelineStartDate(todayMonth);
    updateUrlParams(categoryFilter, filterQuery, statusFilter, todayMonth);
    loadDashboardData(categoryFilter, filterQuery, statusFilter, todayMonth);
  };

  const handlePrevDateRange = () => {
    const nextDate = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth() - 6, 1);
    setTimelineStartDate(nextDate);
    updateUrlParams(categoryFilter, filterQuery, statusFilter, nextDate);
    loadDashboardData(categoryFilter, filterQuery, statusFilter, nextDate);
  };

  const handleNextDateRange = () => {
    const nextDate = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth() + 6, 1);
    setTimelineStartDate(nextDate);
    updateUrlParams(categoryFilter, filterQuery, statusFilter, nextDate);
    loadDashboardData(categoryFilter, filterQuery, statusFilter, nextDate);
  };

  // Read URL params on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const catParam = sp.get("category");
      const searchParam = sp.get("search");
      const statusParam = sp.get("status");
      const dateParam = sp.get("date");

      const resolvedCat = (catParam === "all" || catParam === "current" || catParam === "future" || catParam === "inquiry")
        ? catParam
        : "all";
      const resolvedSearch = searchParam || "";
      const resolvedStatus = statusParam || "all";

      let initialDate = new Date();
      if (dateParam) {
        const parsedD = parseBookingDate(dateParam);
        if (parsedD) initialDate = parsedD;
      }
      const initialMonthDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);

      setTimelineStartDate(initialMonthDate);
      setCategoryFilter(resolvedCat);
      setFilterQuery(resolvedSearch);
      setStatusFilter(resolvedStatus);

      loadDashboardData(resolvedCat, resolvedSearch, resolvedStatus, initialMonthDate);
    } else {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const socket = getSocket();
    if (!socket) return;

    const caretakerId = caretakerApi.getCaretakerId();
    if (caretakerId) {
      socket.emit("join:caretaker", caretakerId);
    }

    const handleSync = () => {
      loadDashboardData();
    };

    socket.on("inquiry:created", handleSync);
    socket.on("inquiry:updated", handleSync);
    socket.on("daycare:updated", handleSync);

    return () => {
      socket.off("inquiry:created", handleSync);
      socket.off("inquiry:updated", handleSync);
      socket.off("daycare:updated", handleSync);
    };
  }, [loadDashboardData]);

  // Mobile segmented view state: "calendar" vs "details" (Rule 2 Mandatory Mobile Switcher)
  const [mobileView, setMobileView] = useState<"calendar" | "details">("calendar");

  // Notification banners state
  const [notificationMsg, setNotificationMsg] = useState<{
    text: string;
    type: "success" | "info";
    onUndo?: () => void;
  } | null>(null);

  // Modals state
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isManageSlotOpen, setIsManageSlotOpen] = useState(false);
  const [isContactParentsOpen, setIsContactParentsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<BookingItem | null>(null);

  // Ref to Fitting Inquiries for smooth scrolling from top stat card
  const inquiriesSectionRef = useRef<HTMLDivElement | null>(null);

  // Handle selecting an item
  const handleSelectItem = (item: BookingItem) => {
    setSelectedItem(item);
    // On mobile devices, automatically switch to details view for immediate inspection
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileView("details");
    }
  };

  // Persist manual bookings helper
  const saveManualBookings = (nextCurrent: BookingItem[], nextFuture: BookingItem[]) => {
    if (typeof window === "undefined") return;
    try {
      const caretakerId = caretakerApi.getCaretakerId();
      const storageKey = `toddler_manual_bookings_${caretakerId || "default"}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          current: nextCurrent,
          future: nextFuture.filter((b) => b.id.startsWith("manual-")),
        })
      );
    } catch {
      // Ignore storage errors
    }
  };

  // Add new booking
  const handleAddBooking = (newBooking: BookingItem) => {
    const nextFuture = [newBooking, ...futureBookings.filter((b) => b.id !== newBooking.id)];
    setFutureBookings(nextFuture);
    saveManualBookings(currentBookings, nextFuture);
    setSelectedItem(newBooking);
    setNotificationMsg({
      text: t.caretakerDashboard.modals.addBooking.success,
      type: "success",
    });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Update existing booking
  const handleUpdateItem = async (updated: BookingItem) => {
    // If backend DB booking, update in DB
    if (updated.id && !updated.id.startsWith("manual-")) {
      try {
        await caretakerApi.updateBooking(updated.id, {
          childName: updated.childName,
          childDob: updated.dob,
          placementStart: updated.placementStart,
          kindergartenTransition: updated.kindergartenTransition,
          dailyHours: updated.dailyHours,
          parentContact: updated.parentContact,
          notes: updated.parentQuote,
        }).catch(() => {});
      } catch {}
    }

    const updateList = (list: BookingItem[]) =>
      list.map((item) => (item.id === updated.id ? updated : item));

    const nextCurrent = updateList(currentBookings);
    const nextFuture = updateList(futureBookings);
    setCurrentBookings(nextCurrent);
    setFutureBookings(nextFuture);
    setFittingInquiries(updateList);
    saveManualBookings(nextCurrent, nextFuture);

    if (selectedItem?.id === updated.id) {
      setSelectedItem(updated);
    }

    // Dynamic reclassification when booking dates change
    loadDashboardData();
  };

  // Release slot
  const handleReleaseItem = async (id: string) => {
    if (id && !id.startsWith("manual-")) {
      try {
        await caretakerApi.deleteBooking(id).catch(() => {});
      } catch {}
    }

    const removeList = (list: BookingItem[]) => list.filter((item) => item.id !== id);

    const nextCurrent = removeList(currentBookings);
    const nextFuture = removeList(futureBookings);
    setCurrentBookings(nextCurrent);
    setFutureBookings(nextFuture);
    setFittingInquiries(removeList);
    saveManualBookings(nextCurrent, nextFuture);

    if (selectedItem?.id === id) {
      setSelectedItem(nextCurrent[0] || nextFuture[0] || null);
    }

    // Dynamic reclassification when a booking is deleted/released
    loadDashboardData();
  };

  // Functional Mark As Booked: converts inquiry into confirmed booking in DB & dynamic classification
  const handleMarkAsBooked = async (inquiry: BookingItem) => {
    let createdDbBooking: any = null;
    try {
      createdDbBooking = await caretakerApi.createBooking({
        childName: inquiry.childName || (language === "de" ? "Anfrage" : "Inquiry"),
        childDob: inquiry.dob || "2025-01-01",
        placementStart: inquiry.desiredStart || inquiry.placementStart || "2026-12-01",
        kindergartenTransition: inquiry.estTransition || inquiry.kindergartenTransition || "2027-02-28",
        dailyHours: inquiry.dailyHours || "Mon – Fri • 08:00 – 15:00",
        parentContact: {
          parents: inquiry.parentContact?.parents || "Parent",
          phone: inquiry.parentContact?.phone || "+49 000 000000",
          email: inquiry.parentContact?.email || "parent@example.com",
        },
        inquiryId: inquiry.id && !inquiry.id.startsWith("manual-") ? inquiry.id : undefined,
        notes: inquiry.parentQuote || "",
      });
    } catch (err: any) {
      console.warn("Could not save converted booking to backend DB:", err);
      if (err.message?.includes("capacity") || err.message?.includes("Cannot confirm booking")) {
        setNotificationMsg({
          text: err.message,
          type: "info",
        });
        return;
      }
    }

    // Persist booked status to backend when inquiry is a backend record
    if (inquiry.id && !inquiry.id.startsWith("manual-")) {
      updateInquiryStatus(inquiry.id, "booked").catch(() => {});
    }

    // Immediately remove from fitting inquiries
    setFittingInquiries((prev) =>
      prev.filter(
        (i) =>
          i.id !== inquiry.id &&
          i.id !== String(createdDbBooking?._id || "") &&
          i.id !== String(createdDbBooking?.inquiryId || "") &&
          i.childName !== inquiry.childName
      )
    );

    // Refresh dashboard to re-classify and sync state dynamically
    await loadDashboardData();

    // Show confirmation toast with undo
    setNotificationMsg({
      text: dt.markAsBookedSuccess,
      type: "success",
      onUndo: async () => {
        if (inquiry.id && !inquiry.id.startsWith("manual-")) {
          await updateInquiryStatus(inquiry.id, "pending").catch(() => {});
        }
        if (createdDbBooking?._id) {
          await caretakerApi.deleteBooking(String(createdDbBooking._id)).catch(() => {});
        }
        await loadDashboardData();
        setNotificationMsg(null);
      },
    });

    setTimeout(() => {
      setNotificationMsg((curr) => (curr?.text === dt.markAsBookedSuccess ? null : curr));
    }, 6000);
  };

  // Update status of an inquiry (New -> Reviewing -> Invited -> Accepted -> Booked)
  const handleUpdateInquiryStatus = async (id: string, status: InquiryStatus) => {
    if (id && !id.startsWith("manual-")) {
      await updateInquiryStatus(id, mapDashboardStatusToBackend(status)).catch(() => {});
    }
    if (status === "Accepted" || status === "Booked") {
      const targetItem = fittingInquiries.find((item) => item.id === id);
      if (targetItem) {
        await handleMarkAsBooked(targetItem);
      } else {
        setFittingInquiries((prev) => prev.filter((item) => item.id !== id));
        await loadDashboardData();
      }
    } else {
      setFittingInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, inquiryStatus: status } : item))
      );
      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, inquiryStatus: status } : null));
      }
    }
  };

  // Open Manage Slot modal for an item
  const handleOpenManageSlot = (item: BookingItem) => {
    setActiveModalItem(item);
    setIsManageSlotOpen(true);
  };

  // Open Contact Parents modal for an item
  const handleOpenContactParents = (item: BookingItem) => {
    setActiveModalItem(item);
    setIsContactParentsOpen(true);
  };

  const allBookings = [...currentBookings, ...futureBookings, ...fittingInquiries];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18] overflow-x-clip">
      {/* 1. Navigation Header (Figma node 580:1260 / 580:1640) */}
      <CaretakerHeader />

      {/* 2. Main Content Container (Figma node 580:1639 / 580:1700) */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Functional Notification Banner (AI Auto-Schedule / Mark As Booked / Feedback) */}
        {notificationMsg && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${notificationMsg.type === "success"
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]"
              }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <span className="shrink-0">
                {notificationMsg.type === "success" ? (
                  <svg className="w-4 h-4 text-[#15803D]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#175CD3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
              <span>{notificationMsg.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {notificationMsg.onUndo && (
                <button
                  type="button"
                  onClick={notificationMsg.onUndo}
                  className="px-2.5 py-1 rounded-md bg-white border border-[#BBF7D0] text-xs font-bold text-[#15803D] hover:bg-[#DCFCE7] transition-colors cursor-pointer shadow-2xs"
                >
                  {language === "de" ? "Rückgängig" : "Undo"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setNotificationMsg(null)}
                className="w-6 h-6 rounded-md flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Close notification"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mobile View Switcher (< lg) */}
        <div className="lg:hidden flex items-center justify-center p-1 bg-[#F0EAE1] rounded-2xl border border-[#DDD3C4] max-w-sm mx-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileView("calendar")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${mobileView === "calendar"
              ? "bg-white text-[#7C5800] shadow-xs"
              : "text-[#6B5E51] hover:text-[#1E1B18]"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{vs.calendar}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("details")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${mobileView === "details"
              ? "bg-white text-[#7C5800] shadow-xs"
              : "text-[#6B5E51] hover:text-[#1E1B18]"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{vs.details}</span>
          </button>
        </div>

        {/* Back to Calendar Button on Mobile when viewing details */}
        {mobileView === "details" && (
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView("calendar")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5DDD2] text-xs font-semibold text-[#1E1B18] shadow-2xs hover:bg-[#FAF9F6] transition-all min-h-[42px] cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#7C5800]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>{vs.backToCalendar}</span>
            </button>
          </div>
        )}

        {/* Responsive Layout Grid (Gantt Calendar Left + Details Right) */}
        <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-5">
          {/* Gantt Booking Calendar (Figma node 580:1701 & 580:1702) */}
          <div
            className={`w-full flex-1 min-w-0 transition-all ${mobileView === "details" ? "hidden lg:block" : "block"
              }`}
          >
            <GanttCalendar
              months={ganttMonths}
              years={ganttYears}
              currentBookings={currentBookings}
              futureBookings={futureBookings}
              fittingInquiries={fittingInquiries}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onOpenAddBooking={() => setIsAddBookingOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onAllocateInquiry={handleMarkAsBooked}
              inquiriesSectionRef={inquiriesSectionRef}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(newCat) => {
                setCategoryFilter(newCat);
                updateUrlParams(newCat, filterQuery, statusFilter, timelineStartDate);
                loadDashboardData(newCat, filterQuery, statusFilter, timelineStartDate);
              }}
              filterQuery={filterQuery}
              onFilterQueryChange={(newQuery) => {
                setFilterQuery(newQuery);
                updateUrlParams(categoryFilter, newQuery, statusFilter, timelineStartDate);
                loadDashboardData(categoryFilter, newQuery, statusFilter, timelineStartDate);
              }}
              dateRangeLabel={dateRangeLabel}
              onToday={handleToday}
              onPrevDateRange={handlePrevDateRange}
              onNextDateRange={handleNextDateRange}
            />
          </div>

          {/* Task / Inquiry Details Panel (Figma node 580:1930) */}
          <div
            className={`w-full lg:w-[320px] xl:w-[350px] shrink-0 transition-all ${mobileView === "calendar" ? "hidden lg:block" : "block"
              }`}
          >
            <BookingDetailsPanel
              item={selectedItem}
              onOpenManageSlot={handleOpenManageSlot}
              onOpenContactParents={handleOpenContactParents}
              onMarkAsBooked={handleMarkAsBooked}
              onUpdateInquiryStatus={handleUpdateInquiryStatus}
              onUpdateItem={handleUpdateItem}
            />
          </div>
        </div>
      </main>

      {/* 3. Footer (Figma node 580:1678) */}
      <Footer />

      {/* 4. Interactive Modals */}
      <AddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        onAddBooking={handleAddBooking}
      />

      <ManageSlotModal
        isOpen={isManageSlotOpen}
        onClose={() => setIsManageSlotOpen(false)}
        item={activeModalItem || selectedItem}
        onUpdateItem={handleUpdateItem}
        onReleaseItem={handleReleaseItem}
      />

      <ContactParentsModal
        isOpen={isContactParentsOpen}
        onClose={() => setIsContactParentsOpen(false)}
        item={activeModalItem || selectedItem}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        bookings={allBookings}
      />
    </div>
  );
}
