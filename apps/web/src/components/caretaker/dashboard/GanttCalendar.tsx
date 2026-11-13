"use client";

import React, { useState, useRef } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { SparklesIcon } from "../../icons/WebIcons";
import {
  BookingItem,
  GanttMonth,
  YearGroup,
} from "../../../types/caretakerDashboard";

interface GanttCalendarProps {
  months: GanttMonth[];
  years: YearGroup[];
  currentBookings: BookingItem[];
  futureBookings: BookingItem[];
  fittingInquiries: BookingItem[];
  selectedItem: BookingItem | null;
  onSelectItem: (item: BookingItem) => void;
  onOpenAddBooking: () => void;
  onOpenExport: () => void;
  isBaselineActive?: boolean;
  onToggleBaseline?: () => void;
  onTriggerAutoSchedule?: () => void;
  onAllocateInquiry?: (inquiry: BookingItem) => void;
  inquiriesSectionRef?: React.RefObject<HTMLDivElement | null>;
}

const MONTH_COL_WIDTH = 28; // width in px of each month column in timeline

export function GanttCalendar({
  months,
  years,
  currentBookings,
  futureBookings,
  fittingInquiries,
  selectedItem,
  onSelectItem,
  onOpenAddBooking,
  onOpenExport,
  isBaselineActive = false,
  onToggleBaseline,
  onTriggerAutoSchedule,
  onAllocateInquiry,
  inquiriesSectionRef,
}: GanttCalendarProps) {
  const { t, language } = useLanguage();
  const tb = t.caretakerDashboard.toolbar;
  const tbl = t.caretakerDashboard.table;

  const [currentCollapsed, setCurrentCollapsed] = useState(false);
  const [futureCollapsed, setFutureCollapsed] = useState(false);
  const [inquiriesCollapsed, setInquiriesCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "current" | "future" | "inquiry">("all");
  const [draggedInquiryId, setDraggedInquiryId] = useState<string | null>(null);
  const [isDragOverSlot4, setIsDragOverSlot4] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showInquiryDensity, setShowInquiryDensity] = useState(true);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen mode on the card container
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Scroll to Today indicator
  const handleScrollToToday = () => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  // Scroll Prev / Next in months
  const handleScrollLeft = () => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollBy({ left: -MONTH_COL_WIDTH * 4, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollBy({ left: MONTH_COL_WIDTH * 4, behavior: "smooth" });
    }
  };

  // Filter items if user searches
  const filterFn = (item: BookingItem) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.childName.toLowerCase().includes(q) ||
      item.period.toLowerCase().includes(q) ||
      item.parentContact.parents.toLowerCase().includes(q)
    );
  };

  const filteredCurrent =
    categoryFilter === "all" || categoryFilter === "current"
      ? currentBookings.filter(filterFn)
      : [];
  const filteredFuture =
    categoryFilter === "all" || categoryFilter === "future"
      ? futureBookings.filter(filterFn)
      : [];
  const filteredInquiries =
    categoryFilter === "all" || categoryFilter === "inquiry"
      ? fittingInquiries.filter(filterFn)
      : [];

  return (
    <div
      ref={cardContainerRef}
      className={`bg-white rounded-2xl border border-[#EAECF0] shadow-[0px_2px_4px_0px_rgba(15,23,36,0.04)] py-3.5 sm:py-4 flex flex-col gap-3 sm:gap-3.5 overflow-hidden ${
        isFullscreen ? "p-4 sm:p-6 fixed inset-0 z-50 rounded-none overflow-y-auto" : "w-full"
      }`}
    >
      {/* 1. Toolbar Header */}
      <div className="px-3.5 sm:px-5 flex flex-col gap-2.5 border-b border-[#F2F4F7] pb-3 sm:pb-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left Toolbar Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Today Button */}
            <button
              type="button"
              onClick={handleScrollToToday}
              className="h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#344054] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{tb.today}</span>
            </button>

            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleScrollLeft}
                aria-label={tb.prev}
                className="w-8 h-8 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-[#667085] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                aria-label={tb.next}
                className="w-8 h-8 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-[#667085] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Date Range Display */}
            <span className="text-sm sm:text-[15px] font-semibold text-[#101828] pl-1 tracking-tight">
              {tb.dateRange}
            </span>
          </div>

        {/* Right Toolbar Controls (Figma node 580:1719) */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 relative">
          {/* Baseline Button (Figma node 580:1720) */}
          <button
            type="button"
            onClick={onToggleBaseline}
            className={`h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isBaselineActive
                ? "bg-[#FAF4ED] border-[#7C5800] text-[#7C5800] font-semibold"
                : "border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-[#344054]"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 12h18M3 20h18" />
            </svg>
            <span>{tb.baseline}</span>
          </button>

          {/* Auto Schedule AI Button (Figma node 580:1726) */}
          <button
            type="button"
            onClick={onTriggerAutoSchedule}
            className="h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg border border-[#E9D7FE] bg-[#F4F0FF] hover:bg-[#EBE2FE] text-xs font-semibold text-[#53389E] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
          >
            <svg className="w-3.5 h-3.5 text-[#7F56D9] group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
            </svg>
            <span>{tb.autoSchedule}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#53389E] text-white tracking-wide">
              {tb.aiBadge}
            </span>
          </button>

          {/* Export Button (Figma node 580:1736) */}
          <button
            type="button"
            onClick={onOpenExport}
            className="h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#344054] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{tb.export}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? tb.exitFullscreen : tb.fullscreen}
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-[#667085] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h4m-4 0v4m6 6l5 5m0 0h-4m4 0v-4" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Settings Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              aria-label={tb.settings}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-[#D0D5DD] bg-white hover:bg-[#F8FAFC] text-[#667085] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#EAECF0] p-2.5 z-30 animate-in fade-in text-xs space-y-2">
                <div className="font-semibold text-[#101828] px-2 py-1 border-b border-[#F2F4F7]">
                  Calendar View Options
                </div>
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F8FAFC] rounded-lg cursor-pointer text-[#344054]">
                  <input
                    type="checkbox"
                    checked={showInquiryDensity}
                    onChange={(e) => setShowInquiryDensity(e.target.checked)}
                    className="rounded text-[#A12D3A] focus:ring-[#A12D3A]"
                  />
                  <span>{tb.showMatchIndicators || "Show Match % Indicators"}</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Toolbar: Search Matrix & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2F4F7] rounded-xl self-start max-w-full">
            {(
              [
                { id: "all", label: tb.filterAll },
                { id: "current", label: tb.filterCurrent },
                { id: "future", label: tb.filterFuture },
                { id: "inquiry", label: tb.filterInquiries },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? "bg-white text-[#101828] shadow-2xs"
                    : "text-[#667085] hover:text-[#101828]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full sm:w-64">
            <svg
              className="w-3.5 h-3.5 text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={tb.searchPlaceholder}
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-[#D0D5DD] bg-white text-xs text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:border-[#7C5800]"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#101828] p-0.5"
                aria-label="Clear filter"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Baseline Scenario Info Banner */}
        {isBaselineActive && (
          <div className="p-2.5 rounded-xl bg-[#FAF4ED] border border-[#EBE3D7] text-xs text-[#7C5800] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <svg className="w-4 h-4 text-[#7C5800] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{tb.baselineActiveNote}</span>
            </div>
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-[#EBE3D7] text-[11px]">
              5 Slots Cap
            </span>
          </div>
        )}
      </div>

      {/* 2. Scrollable Gantt Matrix */}
      <div
        ref={timelineScrollRef}
        className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-[#D0D5DD] scrollbar-track-[#F2F4F7] select-none"
      >
        <div className="min-w-[920px] relative">
          {/* Floating Today Vertical Indicator Line */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10 flex flex-col items-center"
            style={{
              left: `${140 + 150 + 14}px`, // Centered over AUG 26 column
            }}
          >
            {/* Today Badge */}
            <div className="bg-[#1D2939] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide shadow-xs mb-0.5">
              {tbl.todayIndicator}
            </div>
            {/* Vertical Line */}
            <div className="w-[2px] flex-1 bg-[rgba(208,169,126,0.9)]" />
          </div>

          {/* Table Header: Column Names & Timeline Headers */}
          <div className="bg-[#FAFBFC] border-b border-[#EAECF0] flex items-stretch text-[#98A2B3] text-[10px] font-bold tracking-wider">
            {/* Column CARETAKER */}
            <div className="w-[140px] px-3 py-3 flex items-center shrink-0 border-r border-[#EAECF0]/60">
              {tbl.colCaretaker}
            </div>
            {/* Column PERIOD */}
            <div className="w-[150px] px-3 py-3 flex items-center shrink-0 border-r border-[#EAECF0]/60">
              {tbl.colPeriod}
            </div>

            {/* Months Timeline Header Container */}
            <div className="flex-1 flex flex-col">
              {/* Year Headers */}
              <div className="flex border-b border-[#EAECF0]/50 h-5">
                {years.map((y) => (
                  <div
                    key={y.year}
                    className="px-2 py-0.5 text-[#475467] font-bold text-[10px] flex items-center border-r border-[#EAECF0]/40 last:border-r-0"
                    style={{ width: `${y.monthsCount * MONTH_COL_WIDTH}px` }}
                  >
                    {y.year}
                  </div>
                ))}
              </div>

              {/* Month Abbreviations */}
              <div className="flex h-5">
                {months.map((m) => (
                  <div
                    key={m.id}
                    style={{ width: `${MONTH_COL_WIDTH}px` }}
                    className={`shrink-0 flex items-center justify-center text-[8px] font-semibold tracking-tight border-r border-[#EAECF0]/30 last:border-r-0 ${
                      m.isCurrentMonth ? "text-[#101828] font-bold bg-[#FAF4ED]/50" : "text-[#667085]"
                    }`}
                  >
                    {m.shortName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 1: CURRENT BOOKINGS */}
          <div className="border-b border-[#EAECF0]">
            {/* Section Header */}
            <div
              onClick={() => setCurrentCollapsed(!currentCollapsed)}
              className="px-3 py-2 bg-white hover:bg-[#FAFBFC] transition-colors flex items-center gap-2 cursor-pointer border-b border-[#F2F4F7]"
            >
              <svg
                className={`w-3.5 h-3.5 text-[#667085] transition-transform ${
                  currentCollapsed ? "-rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8A6B0A] shrink-0" />
              <span className="text-[11px] font-bold text-[#344054] tracking-wide">
                {tbl.currentBookings}
              </span>
            </div>

            {/* Current Bookings Rows */}
            {!currentCollapsed &&
              filteredCurrent.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const periodDisplay = language === "de" ? item.periodDe : item.period;

                // Calculate Gantt bar position
                const barStart = item.startMonthIndex * MONTH_COL_WIDTH;
                const barWidth =
                  (item.endMonthIndex - item.startMonthIndex + 1) * MONTH_COL_WIDTH;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`h-[38px] flex items-center border-b border-[#F2F4F7] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FDFBF7] ring-1 ring-inset ring-[#8A6B0A]/30"
                        : "hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {/* Caretaker / Child Column */}
                    <div className="w-[140px] px-3 text-xs shrink-0 flex items-center truncate">
                      <span
                        className={`truncate ${
                          isSelected ? "font-bold text-[#8A6B0A]" : "font-normal text-[#101828]"
                        }`}
                      >
                        {item.childName}
                      </span>
                    </div>

                    {/* Period Column */}
                    <div className="w-[150px] px-3 text-[11px] text-[#475467] shrink-0 truncate">
                      {periodDisplay}
                    </div>

                    {/* Timeline Grid Cell & Gantt Bar */}
                    <div
                      onDragOver={(e) => {
                        if (item.id === "booking-david") {
                          e.preventDefault();
                          setIsDragOverSlot4(true);
                        }
                      }}
                      onDragLeave={() => {
                        if (item.id === "booking-david") {
                          setIsDragOverSlot4(false);
                        }
                      }}
                      onDrop={(e) => {
                        if (item.id === "booking-david") {
                          e.preventDefault();
                          setIsDragOverSlot4(false);
                          const targetHans = fittingInquiries.find((i) => i.id === "inquiry-hans");
                          if (targetHans) {
                            onAllocateInquiry?.(targetHans);
                          }
                        }
                      }}
                      className="flex-1 relative h-full flex items-center"
                    >
                      <div
                        className="absolute h-[26px] rounded-md bg-[#F5EFE6] border border-[#EBE3D7] px-2 flex items-center overflow-hidden transition-all shadow-2xs hover:brightness-95"
                        style={{
                          left: `${barStart}px`,
                          width: `${barWidth}px`,
                        }}
                      >
                        <span className="text-[11px] font-medium text-[#47321B] truncate whitespace-nowrap">
                          {periodDisplay}
                        </span>
                      </div>

                      {/* Interactive Recommended Ghost Allocation Bar for Hans following David */}
                      {item.id === "booking-david" && (selectedItem?.id === "inquiry-hans" || draggedInquiryId === "inquiry-hans") && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetHans = fittingInquiries.find((i) => i.id === "inquiry-hans");
                            if (targetHans) onAllocateInquiry?.(targetHans);
                          }}
                          className={`absolute h-[26px] rounded-md border-2 border-dashed flex items-center px-2 cursor-pointer transition-all z-20 ${
                            isDragOverSlot4
                              ? "bg-[#D1FADF] border-[#12B76A] shadow-md scale-[1.02]"
                              : "bg-[#EFF8FF]/95 border-[#2E90FA] hover:bg-[#D1E9FF] shadow-2xs"
                          }`}
                          style={{
                            left: `${barStart + barWidth}px`,
                            width: `${5 * MONTH_COL_WIDTH}px`,
                          }}
                          title={tbl.recommendedSlotIndicator.replace("{name}", "Hans")}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] shrink-0 animate-ping" />
                            <span className="text-[10px] font-bold text-[#175CD3] truncate whitespace-nowrap inline-flex items-center gap-1">
                              <SparklesIcon className="w-3 h-3 text-[#175CD3] shrink-0" />
                              <span>{tbl.recommendedSlotIndicator.replace("{name}", "Hans")}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* SECTION 2: FUTURE BOOKINGS */}
          <div className="border-b border-[#EAECF0]">
            {/* Section Header */}
            <div className="px-3 py-2 bg-white flex items-center justify-between border-b border-[#F2F4F7]">
              <div
                onClick={() => setFutureCollapsed(!futureCollapsed)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 text-[#667085] transition-transform ${
                    futureCollapsed ? "-rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F79009] shrink-0" />
                <span className="text-[11px] font-bold text-[#344054] tracking-wide">
                  {tbl.futureBookings}
                </span>
              </div>

              {/* Add New Booking Button */}
              <button
                type="button"
                onClick={onOpenAddBooking}
                className="h-[28px] px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>{tbl.addBooking}</span>
              </button>
            </div>

            {/* Future Bookings Rows */}
            {!futureCollapsed &&
              filteredFuture.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const periodDisplay = language === "de" ? item.periodDe : item.period;

                const barStart = item.startMonthIndex * MONTH_COL_WIDTH;
                // Spans to the end of visible calendar or beyond
                const barWidth =
                  (months.length - item.startMonthIndex) * MONTH_COL_WIDTH;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`h-[38px] flex items-center border-b border-[#F2F4F7] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FDFBF7] ring-1 ring-inset ring-[#F79009]/30"
                        : "hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <div className="w-[140px] px-3 text-xs text-[#101828] font-normal shrink-0 truncate">
                      {item.childName}
                    </div>

                    <div className="w-[150px] px-3 text-[11px] text-[#475467] shrink-0 truncate">
                      {periodDisplay}
                    </div>

                    <div className="flex-1 relative h-full flex items-center">
                      <div
                        className="absolute h-[26px] rounded-l-md rounded-r-none bg-[#F4F0FF] border border-[#E9D7FE] px-2 flex items-center justify-between gap-1.5 overflow-hidden shadow-2xs hover:brightness-95"
                        style={{
                          left: `${barStart}px`,
                          width: `${barWidth}px`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[11px] font-medium text-[#53389E] truncate whitespace-nowrap">
                            {periodDisplay}
                          </span>
                          {item.isBooked && (
                            <span className="text-[9px] font-bold text-[#53389E] bg-[#E9D7FE] px-1.5 py-0.5 rounded-sm shrink-0">
                              {tb.bookedBadge}
                            </span>
                          )}
                        </div>
                        {item.isExtendingRight && (
                          <svg
                            className="w-3.5 h-3.5 text-[#53389E] shrink-0 ml-1.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* SECTION 3: FITTING INQUIRIES */}
          <div ref={inquiriesSectionRef}>
            {/* Section Header */}
            <div className="px-3 py-2 bg-white flex items-center justify-between border-b border-[#F2F4F7]">
              <div
                onClick={() => setInquiriesCollapsed(!inquiriesCollapsed)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 text-[#667085] transition-transform ${
                    inquiriesCollapsed ? "-rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E90FA] shrink-0" />
                <span className="text-[11px] font-bold text-[#344054] tracking-wide">
                  {tbl.fittingInquiries}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#EFF8FF] text-[#175CD4] border border-[#D1E9FF] text-[10px] font-semibold">
                  {tbl.inquiriesBadge.replace("{count}", "20")}
                </span>
              </div>
            </div>

            {/* Fitting Inquiries Rows */}
            {!inquiriesCollapsed &&
              filteredInquiries.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const periodDisplay = language === "de" ? item.periodDe : item.period;

                const barStart = item.startMonthIndex * MONTH_COL_WIDTH;
                const barWidth = 3 * MONTH_COL_WIDTH; // Compact inquiry block

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`h-[38px] flex items-center border-b border-[#F2F4F7] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FDFBF7] ring-1 ring-inset ring-[#2E90FA]/30"
                        : "hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {/* Drag Grip + Child Name */}
                    <div
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedInquiryId(item.id);
                        e.dataTransfer.setData("text/plain", item.id);
                      }}
                      onDragEnd={() => {
                        setDraggedInquiryId(null);
                        setIsDragOverSlot4(false);
                      }}
                      className="w-[140px] px-3 text-xs text-[#101828] font-normal shrink-0 flex items-center gap-2 truncate cursor-grab active:cursor-grabbing hover:bg-[#F2F4F7]/60 rounded-md py-1"
                    >
                      <span
                        className="text-[#98A2B3] hover:text-[#475467] font-mono text-sm leading-none select-none"
                        title={tbl.dragGripAria}
                      >
                        ⋮⋮
                      </span>
                      <span className="truncate">{item.childName}</span>
                    </div>

                    {/* Period Column */}
                    <div className="w-[150px] px-3 text-[11px] text-[#475467] shrink-0 truncate">
                      {periodDisplay}
                    </div>

                    {/* Timeline Grid Cell & Inquiry Pill */}
                    <div className="flex-1 relative h-full flex items-center">
                      <div
                        className="absolute h-[26px] rounded-md bg-[#EFF8FF] border border-[#D1E9FF] px-2 flex items-center justify-between gap-1 shadow-2xs hover:brightness-95"
                        style={{
                          left: `${barStart}px`,
                          width: `${barWidth + 16}px`,
                        }}
                      >
                        <span className="text-[11px] font-medium text-[#175CD3] truncate whitespace-nowrap">
                          {tbl.flexibility}
                        </span>
                        {showInquiryDensity && item.matchPercent && (
                          <span className="text-[10px] font-bold text-[#175CD3] shrink-0">
                            {item.matchPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
