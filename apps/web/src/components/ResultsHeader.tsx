"use client";

import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface ResultsHeaderProps {
  totalSpots?: number;
  childrenCount: string;
  selectedMonth: string;
  selectedYear: string;
  mobileView: "list" | "detail";
  setMobileView: (v: "list" | "detail") => void;
  onOpenBulkModal: () => void;
  catchmentRadius?: number;
  isLocating?: boolean;
  onLocateMe?: () => void;
}

export function ResultsHeader({
  totalSpots,
  childrenCount,
  selectedMonth,
  selectedYear,
  mobileView,
  setMobileView,
  onOpenBulkModal,
  catchmentRadius = 3,
  isLocating = false,
  onLocateMe,
}: ResultsHeaderProps) {
  const { t } = useLanguage();

  const childrenLabel =
    childrenCount === "1"
      ? t.search.children.one
      : childrenCount === "2"
        ? t.search.children.two
        : childrenCount === "3" || childrenCount === "3+"
          ? t.search.children.threePlus
          : "";
  const monthIndex = selectedMonth !== "" ? Number.parseInt(selectedMonth, 10) : NaN;
  const monthLabel =
    !isNaN(monthIndex) && Number.isInteger(monthIndex) && t.search.months[monthIndex]
      ? t.search.months[monthIndex]
      : selectedMonth;

  const hasCriteria = Boolean(childrenLabel || (monthLabel && selectedYear));

  return (
    <div className="space-y-3 pb-4 sm:pb-5 border-b border-[#F0E8DC]">
      {/* Title & Bulk Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-base sm:text-[17px] font-semibold text-[#1E1B18] leading-snug">
            {hasCriteria ? (
              <>
                {totalSpots ?? 0}{" "}
                {childrenLabel ? `${t.results.availableSpotsFor} ${childrenLabel}` : t.results.availableSpots}{" "}
                {monthLabel && selectedYear ? `${t.results.from} ${monthLabel} ${selectedYear}` : ""}
              </>
            ) : (
              <>
                {totalSpots ?? 0} {t.results.availableSpotsInArea || t.results.availableSpots}
              </>
            )}
          </h1>

          {/* Location & Catchment Radius Indicator (Under 3km / admin configured) */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#7A6E62]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[#423223] font-medium text-[11px] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>{t.results.withinRadiusOf.replace("{radius}", String(catchmentRadius))}</span>
            </span>

            {onLocateMe && (
              <button
                type="button"
                onClick={onLocateMe}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A12D3A] hover:underline cursor-pointer transition-colors"
                title="Detect GPS Location"
              >
                {isLocating ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
                    <span>{t.results.locating}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t.results.locateMe}</span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onOpenBulkModal}
          className="w-full sm:w-auto bg-[#F3A712] hover:bg-[#DF9400] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[42px] shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>{t.results.inquireAll}</span>
        </button>
      </div>

      {/* Mobile-Only Segmented View Switcher (< lg screens) */}
      <div className="flex lg:hidden w-full bg-[#F3ECE2] p-1 rounded-xl shadow-2xs">
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all min-h-[38px] flex items-center justify-center gap-1.5 ${
            mobileView === "list"
              ? "bg-white text-[#A12D3A] shadow-xs"
              : "text-[#6B5E51] hover:text-[#1E1B18]"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span>{t.results.viewList}</span>
        </button>
        <button
          onClick={() => setMobileView("detail")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all min-h-[38px] flex items-center justify-center gap-1.5 ${
            mobileView === "detail"
              ? "bg-white text-[#A12D3A] shadow-xs"
              : "text-[#6B5E51] hover:text-[#1E1B18]"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span>{t.results.viewMapDetails}</span>
        </button>
      </div>
    </div>
  );
}
