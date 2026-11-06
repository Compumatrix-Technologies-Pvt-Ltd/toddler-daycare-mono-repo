"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem, InquiryStatus } from "../../../types/caretakerDashboard";

interface BookingDetailsPanelProps {
  item: BookingItem | null;
  onClose?: () => void;
  onOpenManageSlot: (item: BookingItem) => void;
  onOpenContactParents: (item: BookingItem) => void;
  onMarkAsBooked?: (item: BookingItem) => void;
  onUpdateInquiryStatus?: (id: string, status: InquiryStatus) => void;
  onUpdateItem?: (updated: BookingItem) => void;
}

export function BookingDetailsPanel({
  item,
  onClose,
  onOpenManageSlot,
  onOpenContactParents,
  onMarkAsBooked,
  onUpdateInquiryStatus,
  onUpdateItem,
}: BookingDetailsPanelProps) {
  const { t, language } = useLanguage();
  const d = t.caretakerDashboard.details;

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [interactiveDob, setInteractiveDob] = useState(item?.dob || "2026-11-15");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(
    item?.parentQuote || ""
  );
  const [noteSavedAlert, setNoteSavedAlert] = useState(false);

  // Sync internal note content when item changes
  React.useEffect(() => {
    setNoteContent(item?.parentQuote || "");
    setIsEditingNote(false);
    setNoteSavedAlert(false);
  }, [item?.id]);

  const handleSaveNote = () => {
    if (!item) return;
    const updated: BookingItem = {
      ...item,
      parentQuote: noteContent,
      parentQuoteDe: noteContent,
    };
    onUpdateItem?.(updated);
    setIsEditingNote(false);
    setNoteSavedAlert(true);
    setTimeout(() => setNoteSavedAlert(false), 3000);
  };

  if (!item) {
    return (
      <aside
        aria-label={d.title}
        className="w-full bg-white rounded-2xl border border-[#EAECF0] shadow-[0px_2px_4px_0px_rgba(15,23,36,0.04)] p-4 sm:p-6 flex flex-col items-center justify-center text-center text-[#667085] min-h-[300px]"
      >
        <div className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#98A2B3] mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-sm font-medium">{d.noSelection}</p>
      </aside>
    );
  }

  const isInquiry = item.category === "inquiry";
  const childAgeDisplay = language === "de" ? item.childAgeDe : item.childAge;
  const placementStartDisplay = language === "de" ? item.placementStartDe : item.placementStart;
  const kindergartenTransitionDisplay =
    language === "de" ? item.kindergartenTransitionDe : item.kindergartenTransition;
  const dailyHoursDisplay = language === "de" ? item.dailyHoursDe : item.dailyHours;

  const dotColor =
    item.category === "current"
      ? "bg-[#8A6B0A]"
      : item.category === "future"
      ? "bg-[#F79009]"
      : "bg-[#2E90FA]";

  const currentStatus: InquiryStatus = item.inquiryStatus || "New";

  const handleSelectStatus = (newStatus: InquiryStatus) => {
    onUpdateInquiryStatus?.(item.id, newStatus);
    setStatusDropdownOpen(false);
  };

  return (
    <aside
      aria-label={isInquiry ? d.inquiryTitle : d.title}
      className="w-full bg-white rounded-2xl border border-[#EAECF0] shadow-[0px_2px_4px_0px_rgba(15,23,36,0.04)] p-3.5 sm:p-4.5 xl:p-5 flex flex-col gap-3.5 sm:gap-4 shrink-0"
    >
      {/* Panel Header Row (Figma node 580:1931) */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#F2F4F7]">
        <h3 className="text-sm sm:text-base font-semibold text-[#101828]" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
          {isInquiry ? d.inquiryTitle : d.title}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={d.close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Title & Status Badge Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <h2 className="text-lg font-bold text-[#101828] tracking-tight">{item.childName}</h2>
          </div>

          {/* Status Badge Dropdown for Inquiries (Figma node 580:1941) */}
          {isInquiry ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#D0D5DD] bg-[#FAFBFC] hover:bg-[#F2F4F7] text-xs font-semibold text-[#344054] transition-all cursor-pointer shadow-2xs"
              >
                <span>
                  {currentStatus === "New"
                    ? d.statusNew
                    : currentStatus === "Reviewing"
                    ? d.statusReviewing
                    : currentStatus === "Invited"
                    ? d.statusInvited
                    : d.statusAccepted}
                </span>
                <svg className="w-3 h-3 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-[#EAECF0] p-1.5 z-30 animate-in fade-in text-xs space-y-0.5">
                  {(["New", "Reviewing", "Invited", "Accepted"] as InquiryStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleSelectStatus(st)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                        currentStatus === st ? "bg-[#EFF8FF] text-[#175CD3] font-bold" : "text-[#344054] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {st === "New"
                        ? d.statusNew
                        : st === "Reviewing"
                        ? d.statusReviewing
                        : st === "Invited"
                        ? d.statusInvited
                        : d.statusAccepted}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                  item.category === "current"
                    ? "bg-[#F4F3FF] text-[#5925DC]"
                    : "bg-[#FEF3F2] text-[#B42318]"
                }`}
              >
                {item.category === "current" ? d.categoryCurrent : d.categoryFuture}
              </span>
            </div>
          )}
        </div>

        {/* Category & Match Badge */}
        {isInquiry && (
          <div className="inline-flex">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-[#EFF8FF] text-[#175CD3]">
              {d.fittingInquiryMatch.replace("{percent}", String(item.matchPercent || 65))}
            </span>
          </div>
        )}
      </div>

      {/* RECOMMENDED ALLOCATION CARD (Figma node 580:1947 - Specific to Inquiries) */}
      {isInquiry && (
        <div className="rounded-xl border border-[#D1E9FF] bg-[#F8FBFF] p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#175CD4] tracking-wider uppercase">
              {d.recommendedAllocation}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#EFF8FF] border border-[#B2DDFF] text-[10px] font-bold text-[#175CD4]">
              {item.recommendedAllocation?.vacantMonthsText || d.vacantMonths}
            </span>
          </div>
          <div className="text-xs font-bold text-[#101828]">
            {language === "de"
              ? item.recommendedAllocation?.slotTextDe || d.allocatesToSlot
              : item.recommendedAllocation?.slotText || d.allocatesToSlot}
          </div>
          <div className="text-[11px] text-[#475467] leading-relaxed">
            {language === "de"
              ? item.recommendedAllocation?.noteDe || d.slotTransitionNote
              : item.recommendedAllocation?.note || d.slotTransitionNote}
          </div>
        </div>
      )}

      {/* Properties Section */}
      <div className="space-y-2 sm:space-y-2.5 pt-1">
        {/* Date of Birth / Child Age */}
        {isInquiry ? (
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
              {d.dob}
            </span>
            <div className="flex items-center gap-1.5 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
              <input
                type="date"
                value={interactiveDob}
                onChange={(e) => setInteractiveDob(e.target.value)}
                className="bg-transparent text-xs text-[#101828] focus:outline-hidden"
              />
              <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
              {d.childAge}
            </span>
            <span className="font-medium text-[#101828] text-[12px]">{childAgeDisplay}</span>
          </div>
        )}

        {/* Start Date / Desired Start */}
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
            {isInquiry ? d.desiredStart : d.placementStart}
          </span>
          <div className="flex items-center gap-2 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
            <span>
              {isInquiry
                ? language === "de"
                  ? item.desiredStartDe || item.desiredStart
                  : item.desiredStart || placementStartDisplay
                : placementStartDisplay}
            </span>
            <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>

        {/* Transition Date / Estimated Transition */}
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
            {isInquiry ? d.estTransition : d.kindergartenTransition}
          </span>
          <div className="flex items-center gap-2 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
            <span>
              {isInquiry
                ? language === "de"
                  ? item.estTransitionDe || item.estTransition
                  : item.estTransition || kindergartenTransitionDisplay
                : kindergartenTransitionDisplay}
            </span>
            <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>

        {/* Care Hours */}
        <div className="flex items-center justify-between text-xs py-1">
          <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
            {isInquiry ? d.careHours : d.dailyHours}
          </span>
          <span className="font-medium text-[#101828] text-[12px]">{dailyHoursDisplay}</span>
        </div>

        {/* Preferences (Figma node 580:1985) */}
        {isInquiry && (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
              {d.preferences}
            </span>
            <span className="font-medium text-[#101828] text-[12px] text-right">
              {language === "de" ? item.preferencesDe || d.preferencesValue : item.preferences || d.preferencesValue}
            </span>
          </div>
        )}

        {/* Location Search (Figma node 580:1988) */}
        {isInquiry && (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
              {d.locationSearch}
            </span>
            <span className="font-medium text-[#101828] text-[12px] text-right">
              {language === "de" ? item.locationDistanceDe || d.locationSearchValue : item.locationDistance || d.locationSearchValue}
            </span>
          </div>
        )}
      </div>

      {/* Parent Contact & Note Section (Figma node 580:1991) */}
      <div className="space-y-2 pt-2 border-t border-[#F2F4F7]">
        <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wide">
          {isInquiry ? d.parentContactAndNote : d.parentContact}
        </div>
        <div className="bg-[#FAFBFC] rounded-xl border border-[#EAECF0] p-3 space-y-2.5">
          <div className="text-[13px] font-semibold text-[#101828]">
            {item.parentContact.parents}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#344054]">
            <svg className="w-3.5 h-3.5 text-[#667085] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${item.parentContact.phone}`} className="hover:text-[#101828] transition-colors">
              {item.parentContact.phone}
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#344054]">
            <svg className="w-3.5 h-3.5 text-[#667085] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${item.parentContact.email}`} className="hover:text-[#101828] transition-colors truncate">
              {item.parentContact.email}
            </a>
          </div>

          {/* Parent Quote Note & Editable Caretaker Note */}
          <div className="pt-2 border-t border-[#EAECF0] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085]">
              <span>{language === "de" ? "NOTIZ / ELTERNWUNSCH" : "PARENT NOTE & PREFERENCES"}</span>
              <button
                type="button"
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="text-[10px] text-[#7C5800] hover:underline font-bold cursor-pointer"
              >
                {isEditingNote ? (language === "de" ? "Abbrechen" : "Cancel") : (language === "de" ? "Bearbeiten" : "Edit")}
              </button>
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-hidden focus:border-[#7C5800]"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  {d.saveNotes}
                </button>
              </div>
            ) : (
              <div className="text-xs italic text-[#475467] leading-relaxed">
                {noteContent || (language === "de" ? item.parentQuoteDe || d.parentQuote : item.parentQuote || d.parentQuote)}
              </div>
            )}

            {noteSavedAlert && (
              <div className="text-[11px] font-bold text-[#15803D] animate-in fade-in flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#15803D]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{d.notesSaved}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Figma node 580:2005) */}
      <div className="pt-2 flex flex-col sm:flex-row lg:flex-row items-center gap-2">
        {isInquiry ? (
          <>
            {/* Mark As Booked Button (Figma node 580:2006) */}
            <button
              type="button"
              onClick={() => onMarkAsBooked?.(item)}
              className="w-full flex-1 h-[38px] px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#22C55E]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{d.markAsBooked}</span>
            </button>

            {/* Contact Parents Button */}
            <button
              type="button"
              onClick={() => onOpenContactParents(item)}
              className="w-full flex-1 h-[38px] px-3 rounded-lg bg-white border border-[#D0D5DD] hover:bg-[#F8FAFC] text-[#344054] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{d.contactParents}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenContactParents(item)}
              className="w-full flex-1 h-[38px] px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>{d.contactParents}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenManageSlot(item)}
              className="w-full flex-1 h-[38px] px-3 rounded-lg bg-white border border-[#D0D5DD] hover:bg-[#F8FAFC] text-[#344054] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
            >
              {d.manageSlot}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
