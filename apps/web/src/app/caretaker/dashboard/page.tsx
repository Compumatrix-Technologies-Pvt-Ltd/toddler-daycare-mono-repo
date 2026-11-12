"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { Footer } from "../../../components/Footer";
import { StatCardsOverview } from "../../../components/caretaker/dashboard/StatCardsOverview";
import { GanttCalendar } from "../../../components/caretaker/dashboard/GanttCalendar";
import { BookingDetailsPanel } from "../../../components/caretaker/dashboard/BookingDetailsPanel";
import { AddBookingModal } from "../../../components/caretaker/dashboard/AddBookingModal";
import { ManageSlotModal } from "../../../components/caretaker/dashboard/ManageSlotModal";
import { ContactParentsModal } from "../../../components/caretaker/dashboard/ContactParentsModal";
import { ExportModal } from "../../../components/caretaker/dashboard/ExportModal";
import { WorkPermitModal } from "../../../components/caretaker/dashboard/WorkPermitModal";
import { DemandRadiusModal } from "../../../components/caretaker/dashboard/DemandRadiusModal";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useCaretaker } from "../../../context/CaretakerContext";
import { caretakerApi } from "../../../utils/caretakerApi";
import { fetchInquiries, updateInquiryStatus } from "../../../utils/inquery";
import { getSocket } from "../../../utils/socket";
import { BookingItem, GanttMonth, InquiryStatus, YearGroup } from "../../../types/caretakerDashboard";

const MONTH_SHORT_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function buildGanttTimeline(totalMonths = 22): { months: GanttMonth[]; years: YearGroup[] } {
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth();
  const months: GanttMonth[] = [];
  const yearCounts = new Map<number, number>();

  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const shortName = MONTH_SHORT_NAMES[m];
    const yy = String(y).slice(-2);
    months.push({
      id: `${y}-${String(m + 1).padStart(2, "0")}`,
      year: y,
      shortName,
      fullLabel: `${shortName} ${yy}`,
      ...(i === 0 ? { isCurrentMonth: true } : {}),
    });
    yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
  }

  const years: YearGroup[] = Array.from(yearCounts.entries()).map(([year, monthsCount]) => ({
    year,
    monthsCount,
  }));

  return { months, years };
}

const { months: GANTT_MONTHS, years: GANTT_YEARS } = buildGanttTimeline(22);

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
    case "rejected":
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
    case "Declined":
      return "rejected";
    default:
      return "pending";
  }
}

function resolveStartMonthIndex(desiredStart?: string): number {
  if (!desiredStart) return 0;
  const lower = desiredStart.toLowerCase();
  const yearMatch = lower.match(/20\d{2}/);
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIdx = monthNames.findIndex((m) => lower.includes(m));
  if (yearMatch && monthIdx >= 0) {
    const targetId = `${yearMatch[0]}-${String(monthIdx + 1).padStart(2, "0")}`;
    const found = GANTT_MONTHS.findIndex((gm) => gm.id === targetId);
    if (found >= 0) return found;
  }
  const isoMatch = lower.match(/(20\d{2})-(\d{2})/);
  if (isoMatch) {
    const found = GANTT_MONTHS.findIndex((gm) => gm.id === `${isoMatch[1]}-${isoMatch[2]}`);
    if (found >= 0) return found;
  }
  return 0;
}

function mapInquiryToBookingItem(inq: any, category: "inquiry" | "future"): BookingItem {
  const startIdx = resolveStartMonthIndex(inq.desiredStart);
  const endIdx = Math.min(GANTT_MONTHS.length - 1, startIdx + 10);
  const startLabel = inq.desiredStart || GANTT_MONTHS[startIdx]?.fullLabel || "";
  const endLabel = GANTT_MONTHS[endIdx]?.fullLabel || "";
  const periodLabel = endLabel ? `${startLabel} – ${endLabel}` : startLabel;
  const prefParts = [
    inq.preferences?.gender,
    inq.preferences?.food,
    inq.preferences?.pets,
  ].filter(Boolean);

  return {
    id: String(inq._id || inq.id || inq.referenceId || ""),
    childName: inq.childName || "Child",
    childAge: inq.childBirthday ? `DOB: ${inq.childBirthday}` : "",
    childAgeDe: inq.childBirthday ? `Geb.: ${inq.childBirthday}` : "",
    placementStart: startLabel,
    placementStartDe: startLabel,
    kindergartenTransition: endLabel,
    kindergartenTransitionDe: endLabel,
    period: periodLabel,
    periodDe: periodLabel,
    startMonthIndex: startIdx,
    endMonthIndex: endIdx,
    dailyHours: inq.careHours || "Mon – Fri • 08:00 – 15:00",
    dailyHoursDe: inq.careHours || "Mo. – Fr. • 08:00 – 15:00 Uhr",
    parentContact: {
      parents: inq.parentName || "",
      phone: inq.phone || "",
      email: inq.email || "",
    },
    category,
    isBooked: category === "future",
    inquiryStatus: mapBackendStatusToDashboard(inq.status),
    ...(inq.childBirthday ? { dob: inq.childBirthday } : {}),
    desiredStart: startLabel,
    desiredStartDe: startLabel,
    ...(inq.estTransition ? { estTransition: inq.estTransition, estTransitionDe: inq.estTransition } : {}),
    ...(prefParts.length > 0 ? { preferences: prefParts.join(" • "), preferencesDe: prefParts.join(" • ") } : {}),
    ...(inq.note ? { parentQuote: inq.note, parentQuoteDe: inq.note } : {}),
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

  // Dynamic capacity & catchment radius
  const [totalSlots, setTotalSlots] = useState<number>(() =>
    parseCapacity(profile.permitAuthorizedCapacity || profile.maxCapacity)
  );
  const [catchmentRadius, setCatchmentRadius] = useState<number>(3);
  const [isBaselineActive, setIsBaselineActive] = useState(false);

  const loadDashboardData = useCallback(async () => {
    const token = caretakerApi.getToken();
    const caretakerId = caretakerApi.getCaretakerId();

    try {
      const [settingsRes, daycareRes, inquiriesRes] = await Promise.all([
        caretakerApi.getSettings().catch(() => null),
        token ? caretakerApi.getDaycare().catch(() => null) : Promise.resolve(null),
        token
          ? fetchInquiries({
              ...(caretakerId ? { caretakerId } : {}),
              token,
            }).catch(() => [])
          : Promise.resolve([]),
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
      const acceptedList = list
        .filter((inq: any) => inq.status === "accepted")
        .map((inq: any) => mapInquiryToBookingItem(inq, "future"));
      const pendingList = list
        .filter((inq: any) => inq.status !== "accepted" && inq.status !== "rejected")
        .map((inq: any) => mapInquiryToBookingItem(inq, "inquiry"));

      // Merge any locally-added manual bookings for this caretaker session
      let manualCurrent: BookingItem[] = [];
      let manualFuture: BookingItem[] = [];
      if (typeof window !== "undefined") {
        try {
          const storageKey = `toddler_manual_bookings_${caretakerId || "default"}`;
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.current)) manualCurrent = parsed.current;
            if (Array.isArray(parsed?.future)) manualFuture = parsed.future;
          }
        } catch {
          // Ignore malformed local bookings
        }
      }

      const nextCurrent = manualCurrent;
      const nextFuture = [...manualFuture, ...acceptedList];
      setCurrentBookings(nextCurrent);
      setFutureBookings(nextFuture);
      setFittingInquiries(pendingList);

      setSelectedItem((prev) => {
        const combined = [...nextCurrent, ...nextFuture, ...pendingList];
        if (prev && combined.some((item) => item.id === prev.id)) {
          return combined.find((item) => item.id === prev.id) || prev;
        }
        return combined[0] || null;
      });
    } catch (err) {
      console.error("Failed to load caretaker dashboard data:", err);
    }
  }, [profile.maxCapacity, profile.permitAuthorizedCapacity]);

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
  const [isWorkPermitOpen, setIsWorkPermitOpen] = useState(false);
  const [isDemandRadiusOpen, setIsDemandRadiusOpen] = useState(false);
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
    const manualBooking: BookingItem = {
      ...newBooking,
      id: newBooking.id.startsWith("manual-") ? newBooking.id : `manual-${newBooking.id}`,
    };
    const nextFuture = [manualBooking, ...futureBookings];
    setFutureBookings(nextFuture);
    saveManualBookings(currentBookings, nextFuture);
    setSelectedItem(manualBooking);
    setNotificationMsg({
      text: t.caretakerDashboard.modals.addBooking.success,
      type: "success",
    });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Update existing booking
  const handleUpdateItem = (updated: BookingItem) => {
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
  };

  // Release slot
  const handleReleaseItem = (id: string) => {
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
  };

  // Functional Mark As Booked: converts inquiry into confirmed future booking
  const handleMarkAsBooked = (inquiry: BookingItem) => {
    const convertedBooking: BookingItem = {
      ...inquiry,
      category: "future",
      isBooked: true,
      isExtendingRight: true,
      inquiryStatus: "Accepted",
    };

    // Persist accepted status to backend when inquiry is a backend record
    if (inquiry.id && !inquiry.id.startsWith("manual-")) {
      updateInquiryStatus(inquiry.id, "accepted").catch(() => {});
    }

    // Remove from inquiries and add to future bookings
    setFittingInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
    setFutureBookings((prev) => [convertedBooking, ...prev]);
    setSelectedItem(convertedBooking);

    // Show confirmation toast with undo
    setNotificationMsg({
      text: dt.markAsBookedSuccess,
      type: "success",
      onUndo: () => {
        if (inquiry.id && !inquiry.id.startsWith("manual-")) {
          updateInquiryStatus(inquiry.id, "pending").catch(() => {});
        }
        setFutureBookings((prev) => prev.filter((b) => b.id !== inquiry.id));
        setFittingInquiries((prev) => [inquiry, ...prev]);
        setSelectedItem(inquiry);
        setNotificationMsg(null);
      },
    });

    setTimeout(() => {
      setNotificationMsg((curr) => (curr?.text === dt.markAsBookedSuccess ? null : curr));
    }, 6000);
  };

  // Functional Auto Schedule AI: allocates the first fitting inquiry to an upcoming vacancy
  const handleTriggerAutoSchedule = () => {
    const targetInquiry = fittingInquiries[0];
    if (targetInquiry) {
      handleMarkAsBooked(targetInquiry);
      setNotificationMsg({
        text: tb.aiScheduledSuccess,
        type: "success",
      });
    } else {
      setNotificationMsg({
        text:
          language === "de"
            ? "Keine offenen Anfragen für die automatische Zuteilung vorhanden."
            : "No pending inquiries available to auto-schedule.",
        type: "info",
      });
    }
    setTimeout(() => setNotificationMsg(null), 5500);
  };

  // Update status of an inquiry (New -> Reviewing -> Invited -> Accepted)
  const handleUpdateInquiryStatus = (id: string, status: InquiryStatus) => {
    if (id && !id.startsWith("manual-")) {
      updateInquiryStatus(id, mapDashboardStatusToBackend(status)).catch(() => {});
    }
    setFittingInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inquiryStatus: status } : item))
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, inquiryStatus: status } : null));
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

  // Scroll to Fitting Inquiries from Stat Card
  const handleScrollToInquiries = () => {
    inquiriesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Open Demand Radius Simulation Modal
  const handleViewRadius = () => {
    setIsDemandRadiusOpen(true);
  };

  // Highlight Slot Vacancies info toast
  const allBookings = [...currentBookings, ...futureBookings, ...fittingInquiries];
  const openVacanciesCount = Math.max(0, totalSlots - currentBookings.length);

  const handleViewVacancies = () => {
    setNotificationMsg({
      text:
        language === "de"
          ? `Freie Plätze: ${openVacanciesCount} von ${totalSlots} Plätzen aktuell verfügbar.`
          : `Slot vacancies: ${openVacanciesCount} of ${totalSlots} spots currently available.`,
      type: "info",
    });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Open Work Permit Compliance Modal
  const handleViewPermit = () => {
    setIsWorkPermitOpen(true);
  };

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

        {/* 13b Stat Cards Overview (Figma node 580:1661) */}
        <StatCardsOverview
          inquiriesCount={fittingInquiries.length}
          openVacancies={openVacanciesCount}
          totalSlots={totalSlots}
          radiusValue={catchmentRadius}
          onFilterInquiries={handleScrollToInquiries}
          onViewRadius={handleViewRadius}
          onViewVacancies={handleViewVacancies}
          onViewPermit={handleViewPermit}
        />

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
              months={GANTT_MONTHS}
              years={GANTT_YEARS}
              currentBookings={currentBookings}
              futureBookings={futureBookings}
              fittingInquiries={fittingInquiries}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onOpenAddBooking={() => setIsAddBookingOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              isBaselineActive={isBaselineActive}
              onToggleBaseline={() => setIsBaselineActive(!isBaselineActive)}
              onTriggerAutoSchedule={handleTriggerAutoSchedule}
              onAllocateInquiry={handleMarkAsBooked}
              inquiriesSectionRef={inquiriesSectionRef}
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

      <WorkPermitModal
        isOpen={isWorkPermitOpen}
        onClose={() => setIsWorkPermitOpen(false)}
      />

      <DemandRadiusModal
        isOpen={isDemandRadiusOpen}
        onClose={() => setIsDemandRadiusOpen(false)}
        currentRadius={catchmentRadius}
        onUpdateRadius={(r) => {
          setCatchmentRadius(r);
          setNotificationMsg({
            text:
              language === "de"
                ? `Einzugsradius auf ${r} km kalibriert (~${Math.round(r * 4)} passende Familien im Umkreis).`
                : `Catchment radius calibrated to ${r} km (~${Math.round(r * 4)} matching parent inquiries).`,
            type: "info",
          });
          setTimeout(() => setNotificationMsg(null), 4500);
        }}
      />
    </div>
  );
}
