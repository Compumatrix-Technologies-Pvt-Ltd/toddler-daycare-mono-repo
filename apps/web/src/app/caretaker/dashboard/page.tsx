"use client";

import React, { useState, useRef } from "react";
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
import {
  GANTT_MONTHS,
  GANTT_YEARS,
  INITIAL_CURRENT_BOOKINGS,
  INITIAL_FUTURE_BOOKINGS,
  INITIAL_FITTING_INQUIRIES,
} from "../../../data/mockCaretakerBookings";
import { BookingItem, InquiryStatus } from "../../../types/caretakerDashboard";

export default function CaretakerDashboardPage() {
  const { t, language } = useLanguage();
  const vs = t.caretakerDashboard.viewSwitch;
  const tb = t.caretakerDashboard.toolbar;
  const dt = t.caretakerDashboard.details;

  // Bookings State
  const [currentBookings, setCurrentBookings] = useState<BookingItem[]>(INITIAL_CURRENT_BOOKINGS);
  const [futureBookings, setFutureBookings] = useState<BookingItem[]>(INITIAL_FUTURE_BOOKINGS);
  const [fittingInquiries, setFittingInquiries] = useState<BookingItem[]>(INITIAL_FITTING_INQUIRIES);

  // Selected item defaults to David matching Figma node 580:1449 / 580:1568
  const [selectedItem, setSelectedItem] = useState<BookingItem | null>(
    INITIAL_CURRENT_BOOKINGS.find((b) => b.id === "booking-david") || INITIAL_CURRENT_BOOKINGS[0]
  );

  // Baseline capacity scenario toggle
  const [isBaselineActive, setIsBaselineActive] = useState(false);

  // Catchment radius in km
  const [catchmentRadius, setCatchmentRadius] = useState(3);

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

  // Add new booking
  const handleAddBooking = (newBooking: BookingItem) => {
    setFutureBookings((prev) => [newBooking, ...prev]);
    setSelectedItem(newBooking);
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

    setCurrentBookings(updateList);
    setFutureBookings(updateList);
    setFittingInquiries(updateList);

    if (selectedItem?.id === updated.id) {
      setSelectedItem(updated);
    }
  };

  // Release slot
  const handleReleaseItem = (id: string) => {
    const removeList = (list: BookingItem[]) => list.filter((item) => item.id !== id);

    setCurrentBookings(removeList);
    setFutureBookings(removeList);
    setFittingInquiries(removeList);

    if (selectedItem?.id === id) {
      setSelectedItem(currentBookings[0] || null);
    }
  };

  // Functional Mark As Booked: converts inquiry into confirmed future booking (Figma node 580:2006)
  const handleMarkAsBooked = (inquiry: BookingItem) => {
    const convertedBooking: BookingItem = {
      ...inquiry,
      category: "future",
      isBooked: true,
      isExtendingRight: true,
      period: "Dec 2027 – Aug 2029",
      periodDe: "Dez. 2027 – Aug. 2029",
      placementStart: "Dec 1, 2027",
      placementStartDe: "1. Dez. 2027",
      kindergartenTransition: "Aug 31, 2029",
      kindergartenTransitionDe: "31. Aug. 2029",
    };

    // Remove from inquiries and add to future bookings
    setFittingInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
    setFutureBookings((prev) => [convertedBooking, ...prev]);
    setSelectedItem(convertedBooking);

    // Show confirmation toast with undo
    setNotificationMsg({
      text: dt.markAsBookedSuccess,
      type: "success",
      onUndo: () => {
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

  // Functional Auto Schedule AI: simulates allocation and matches inquiries to upcoming vacancies
  const handleTriggerAutoSchedule = () => {
    // Hans desires Dec 2027 start, David transitions in Dec 2027 -> Perfect match with 0 vacant months!
    const targetInquiry = fittingInquiries.find((i) => i.id === "inquiry-hans");
    if (targetInquiry) {
      handleMarkAsBooked(targetInquiry);
      setNotificationMsg({
        text: tb.aiScheduledSuccess,
        type: "success",
      });
    } else {
      setNotificationMsg({
        text: tb.aiScheduledSuccess,
        type: "info",
      });
    }
    setTimeout(() => setNotificationMsg(null), 5500);
  };

  // Update status of an inquiry (New -> Reviewing -> Invited -> Accepted)
  const handleUpdateInquiryStatus = (id: string, status: InquiryStatus) => {
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
  const handleViewVacancies = () => {
    setNotificationMsg({
      text:
        language === "de"
          ? "Freie Plätze: 2 offene Plätze ab Oktober 2026 und Dezember 2027 prognostiziert."
          : "Slot vacancies: 2 openings forecasted starting Oct 2026 and Dec 2027.",
      type: "info",
    });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Open Work Permit Compliance Modal
  const handleViewPermit = () => {
    setIsWorkPermitOpen(true);
  };

  const allBookings = [...currentBookings, ...futureBookings, ...fittingInquiries];
  const openVacanciesCount = 5 - currentBookings.length;

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
          inquiriesCount={fittingInquiries.length + 8}
          openVacancies={openVacanciesCount > 0 ? openVacanciesCount : 1}
          totalSlots={5}
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
