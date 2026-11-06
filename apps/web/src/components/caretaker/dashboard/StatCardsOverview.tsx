"use client";

import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

interface StatCardsOverviewProps {
  inquiriesCount?: number;
  openVacancies?: number;
  totalSlots?: number;
  radiusValue?: number;
  onFilterInquiries?: () => void;
  onViewRadius?: () => void;
  onViewVacancies?: () => void;
  onViewPermit?: () => void;
}

export function StatCardsOverview({
  inquiriesCount = 12,
  openVacancies = 2,
  totalSlots = 5,
  radiusValue = 3,
  onFilterInquiries,
  onViewRadius,
  onViewVacancies,
  onViewPermit,
}: StatCardsOverviewProps) {
  const { t } = useLanguage();
  const sc = t.caretakerDashboard.statCards;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
      {/* Stat Card 1: Parent Lead Inquiries */}
      <div
        onClick={onFilterInquiries}
        className="bg-white rounded-xl border border-[#EAECF0] p-3 sm:p-3.5 lg:p-4 shadow-[0px_2px_4px_0px_rgba(15,23,36,0.03)] hover:border-[#101828]/30 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E1B18] tracking-wider uppercase">
            {sc.parentLeads}
          </span>
          <svg className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#101828] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div className="my-1 sm:my-1.5">
          <span
            className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta, sans-serif)" }}
          >
            {inquiriesCount} {sc.activeLeads.replace(/^\d+\s*/, "")}
          </span>
        </div>
        <div className="text-[10.5px] sm:text-[11px] font-medium text-[#15803D] flex items-center gap-1">
          <svg className="w-3 h-3 text-[#15803D] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>{sc.leadsThisWeek}</span>
        </div>
      </div>

      {/* Stat Card 2: Demand Reach Radius */}
      <div
        onClick={onViewRadius}
        className="bg-white rounded-xl border border-[#EAECF0] p-3 sm:p-3.5 lg:p-4 shadow-[0px_2px_4px_0px_rgba(15,23,36,0.03)] hover:border-[#101828]/30 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E1B18] tracking-wider uppercase">
            {sc.demandRadius}
          </span>
          <svg className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#101828] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div className="my-1 sm:my-1.5">
          <span
            className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta, sans-serif)" }}
          >
            {radiusValue} km {sc.urbanRadius.replace(/^\d+\s*km\s*/i, "")}
          </span>
        </div>
        <div className="text-[10.5px] sm:text-[11px] font-medium text-[#667085]">
          {sc.radialOverlay}
        </div>
      </div>

      {/* Stat Card 3: Slot Vacancies */}
      <div
        onClick={onViewVacancies}
        className="bg-white rounded-xl border border-[#EAECF0] p-3 sm:p-3.5 lg:p-4 shadow-[0px_2px_4px_0px_rgba(15,23,36,0.03)] hover:border-[#101828]/30 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E1B18] tracking-wider uppercase flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#7C5800] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{sc.slotVacancies}</span>
          </span>
          <svg className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#101828] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div className="my-1 sm:my-1.5">
          <span
            className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta, sans-serif)" }}
          >
            {openVacancies} {t.caretakerDashboard.statCards.vacanciesRatio.includes("Frei") ? "Frei" : "Open"} / {totalSlots} {t.caretakerDashboard.statCards.vacanciesRatio.includes("Gesamt") ? "Gesamt" : "Total"}
          </span>
        </div>
        <div className="text-[10.5px] sm:text-[11px] font-medium text-[#7C5800]">
          {sc.nextVacancy}
        </div>
      </div>

      {/* Stat Card 4: Work Permit Compliance */}
      <div
        onClick={onViewPermit}
        className="bg-white rounded-xl border border-[#EAECF0] p-3 sm:p-3.5 lg:p-4 shadow-[0px_2px_4px_0px_rgba(15,23,36,0.03)] hover:border-[#101828]/30 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E1B18] tracking-wider uppercase flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{sc.workPermit}</span>
          </span>
          <svg className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#101828] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div className="my-1 sm:my-1.5 flex items-center gap-2">
          <span
            className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#15803D] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta, sans-serif)" }}
          >
            {sc.validVerified}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        </div>
        <div className="text-[10.5px] sm:text-[11px] font-medium text-[#667085]">
          {sc.expiryDate}
        </div>
      </div>
    </div>
  );
}
