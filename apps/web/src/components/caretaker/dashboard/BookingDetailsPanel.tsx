"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem, InquiryStatus } from "../../../types/caretakerDashboard";
import { DatePicker, TimePicker } from "@repo/ui";

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

  // Helper parsers for Care Hours and Preferences
  const parseCareHours = (raw?: string): { from: string; to: string } => {
    if (!raw || typeof raw !== "string") return { from: "08:00", to: "15:00" };
    const match = /(\d{1,2}:\d{2})\s*(?:–|-|to)\s*(\d{1,2}:\d{2})/i.exec(raw);
    if (match && match[1] && match[2]) {
      const from = match[1].length === 4 ? `0${match[1]}` : match[1];
      const to = match[2].length === 4 ? `0${match[2]}` : match[2];
      return { from, to };
    }
    return { from: "08:00", to: "15:00" };
  };

  const parsePreferences = (raw?: string): { female: boolean; selfCooked: boolean; petsOk: boolean } => {
    if (!raw || typeof raw !== "string") return { female: false, selfCooked: false, petsOk: false };
    const lower = raw.toLowerCase();
    return {
      female: lower.includes("female") || lower.includes("weiblich") || lower.includes("woman"),
      selfCooked: lower.includes("cook") || lower.includes("koch") || lower.includes("fresh") || lower.includes("selbst"),
      petsOk: lower.includes("pet") || lower.includes("tier") || lower.includes("dog") || lower.includes("cat"),
    };
  };

  const formatPreferencesString = (
    prefs: { female: boolean; selfCooked: boolean; petsOk: boolean },
    lang: "de" | "en"
  ): string => {
    const parts: string[] = [];
    if (prefs.female) parts.push(lang === "de" ? "Weiblich" : "Female");
    if (prefs.selfCooked) parts.push(lang === "de" ? "Selbstgekocht" : "Self-cooked");
    if (prefs.petsOk) parts.push(lang === "de" ? "Haustiere OK" : "Pets OK");
    return parts.join(" • ");
  };

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [interactiveChildName, setInteractiveChildName] = useState(item?.childName || "");
  const [interactiveDob, setInteractiveDob] = useState(item?.dob || "");
  const [interactiveDesiredStart, setInteractiveDesiredStart] = useState(item?.desiredStart || item?.placementStart || "");
  const [interactiveTransition, setInteractiveTransition] = useState(item?.estTransition || item?.kindergartenTransition || "");

  const initialHours = parseCareHours(item?.dailyHours);
  const [careHoursFrom, setCareHoursFrom] = useState(initialHours.from);
  const [careHoursTo, setCareHoursTo] = useState(initialHours.to);
  const [interactiveHours, setInteractiveHours] = useState(item?.dailyHours || "");

  const initialPrefs = parsePreferences(item?.preferences);
  const [prefFemale, setPrefFemale] = useState(initialPrefs.female);
  const [prefSelfCooked, setPrefSelfCooked] = useState(initialPrefs.selfCooked);
  const [prefPetsOk, setPrefPetsOk] = useState(initialPrefs.petsOk);
  const [interactivePreferences, setInteractivePreferences] = useState(item?.preferences || "");

  const [interactiveParents, setInteractiveParents] = useState(item?.parentContact?.parents || "");
  const [interactivePhone, setInteractivePhone] = useState(item?.parentContact?.phone || "");
  const [interactiveEmail, setInteractiveEmail] = useState(item?.parentContact?.email || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(item?.parentQuote || "");
  const [noteSavedAlert, setNoteSavedAlert] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sync internal state when item changes
  React.useEffect(() => {
    setInteractiveChildName(item?.childName || "");
    setInteractiveDob(item?.dob || "");
    setInteractiveDesiredStart(item?.desiredStart || item?.placementStart || "");
    setInteractiveTransition(item?.estTransition || item?.kindergartenTransition || "");

    const hours = parseCareHours(item?.dailyHours);
    setCareHoursFrom(hours.from);
    setCareHoursTo(hours.to);
    setInteractiveHours(item?.dailyHours || "");

    const prefs = parsePreferences(item?.preferences);
    setPrefFemale(prefs.female);
    setPrefSelfCooked(prefs.selfCooked);
    setPrefPetsOk(prefs.petsOk);
    setInteractivePreferences(item?.preferences || "");

    setInteractiveParents(item?.parentContact?.parents || "");
    setInteractivePhone(item?.parentContact?.phone || "");
    setInteractiveEmail(item?.parentContact?.email || "");
    setNoteContent(item?.parentQuote || "");
    setIsEditingName(false);
    setIsEditingNote(false);
    setNoteSavedAlert(false);
    setValidationErrors({});
  }, [item?.id]);

  // Dynamic & functional match percentage (guaranteed responsive and never 0%)
  const currentMatchPercent = React.useMemo(() => {
    let score = 55;
    if (interactiveDesiredStart && interactiveDesiredStart.trim()) score += 20;
    if (interactiveHours && interactiveHours.trim()) score += 15;
    if (item?.locationDistance && !item.locationDistance.includes(">")) score += 10;
    return Math.min(95, Math.max(65, score));
  }, [interactiveDesiredStart, interactiveHours, item?.locationDistance]);

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

  const handleConfirmBooking = () => {
    if (!item) return;
    const errors: Record<string, string> = {};

    const finalName = (interactiveChildName || item.childName || "").trim();
    if (!finalName) {
      errors.childName = language === "de" ? "Name des Kindes ist erforderlich." : "Child name is required.";
    }
    if (!interactiveDob.trim()) {
      errors.dob = language === "de" ? "Geburtsdatum ist erforderlich." : "Date of birth is required.";
    }
    if (!interactiveDesiredStart.trim() && !item.placementStart?.trim()) {
      errors.desiredStart = language === "de" ? "Wunschstart ist erforderlich." : "Desired start date is required.";
    }
    if (!interactiveTransition.trim() && !item.kindergartenTransition?.trim()) {
      errors.estTransition = language === "de" ? "Übergangstermin ist erforderlich." : "Transition date is required.";
    }
    if (!interactiveHours.trim() && !item.dailyHours?.trim()) {
      errors.dailyHours = language === "de" ? "Betreuungszeiten sind erforderlich." : "Care hours are required.";
    } else if (careHoursFrom && careHoursTo && careHoursTo <= careHoursFrom) {
      errors.dailyHours = d.careHoursValidation || (language === "de" ? "Endzeit muss nach der Startzeit liegen." : "End time must be after start time.");
    }
    const finalParentName = (interactiveParents || item.parentContact?.parents || "").trim();
    if (!finalParentName) {
      errors.parentName = language === "de" ? "Name der Eltern ist erforderlich." : "Parent name is required.";
    }
    const finalPhone = (interactivePhone || item.parentContact?.phone || "").trim();
    if (!finalPhone) {
      errors.phone = language === "de" ? "Telefonnummer ist erforderlich." : "Parent phone number is required.";
    }
    const finalEmail = (interactiveEmail || item.parentContact?.email || "").trim();
    if (!finalEmail) {
      errors.email = language === "de" ? "E-Mail-Adresse ist erforderlich." : "Parent email is required.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const validatedItem: BookingItem = {
      ...item,
      childName: finalName,
      dob: interactiveDob.trim(),
      childAge: `DOB: ${interactiveDob.trim()}`,
      childAgeDe: `Geb.: ${interactiveDob.trim()}`,
      desiredStart: interactiveDesiredStart.trim() || item.placementStart,
      desiredStartDe: interactiveDesiredStart.trim() || item.placementStart,
      placementStart: interactiveDesiredStart.trim() || item.placementStart,
      placementStartDe: interactiveDesiredStart.trim() || item.placementStart,
      estTransition: interactiveTransition.trim() || item.kindergartenTransition,
      estTransitionDe: interactiveTransition.trim() || item.kindergartenTransition,
      kindergartenTransition: interactiveTransition.trim() || item.kindergartenTransition,
      kindergartenTransitionDe: interactiveTransition.trim() || item.kindergartenTransition,
      dailyHours: interactiveHours.trim() || item.dailyHours,
      dailyHoursDe: interactiveHours.trim() || item.dailyHours,
      preferences: interactivePreferences.trim() || item.preferences,
      preferencesDe: interactivePreferences.trim() || item.preferences,
      parentContact: {
        parents: finalParentName,
        phone: finalPhone,
        email: finalEmail,
      },
    };

    onMarkAsBooked?.(validatedItem);
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  type="text"
                  value={interactiveChildName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInteractiveChildName(val);
                    onUpdateItem?.({ ...item, childName: val });
                  }}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                  }}
                  placeholder={isInquiry ? (language === "de" ? "Anfrage 1" : "Inquiry 1") : "Name"}
                  className="text-base font-bold text-[#101828] bg-[#F2F4F7] px-2 py-0.5 rounded-lg border border-[#D0D5DD] focus:outline-none focus:border-[#A12D3A] focus:bg-white w-full"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-1 rounded text-[#15803D] hover:bg-[#F0FDF4] cursor-pointer"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer flex-1 min-w-0"
                onClick={() => setIsEditingName(true)}
                title={language === "de" ? "Klicken zum Bearbeiten" : "Click to edit"}
              >
                <h2 className="text-lg font-bold text-[#101828] tracking-tight truncate">
                  {interactiveChildName || (isInquiry ? (language === "de" ? "Anfrage 1" : "Inquiry 1") : item.childName)}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  className="text-[#98A2B3] group-hover:text-[#101828] transition-colors p-0.5"
                  title={language === "de" ? "Name bearbeiten" : "Edit Name"}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
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
                        : currentStatus === "Booked"
                          ? ((d as any).statusBooked || "Booked")
                          : d.statusAccepted}
                </span>
                <svg className="w-3 h-3 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-[#EAECF0] p-1.5 z-30 animate-in fade-in text-xs space-y-0.5">
                  {(["New", "Reviewing", "Invited", "Accepted", "Booked"] as InquiryStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleSelectStatus(st)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${currentStatus === st ? "bg-[#EFF8FF] text-[#175CD3] font-bold" : "text-[#344054] hover:bg-[#F8FAFC]"
                        }`}
                    >
                      {st === "New"
                        ? d.statusNew
                        : st === "Reviewing"
                          ? d.statusReviewing
                          : st === "Invited"
                            ? d.statusInvited
                            : st === "Booked"
                              ? ((d as any).statusBooked || "Booked")
                              : d.statusAccepted}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${item.category === "current"
                  ? "bg-[#F4F3FF] text-[#5925DC]"
                  : "bg-[#FEF3F2] text-[#B42318]"
                  }`}
              >
                {item.category === "current" ? d.categoryCurrent : d.categoryFuture}
              </span>
            </div>
          )}
        </div>

        {/* Category & Match Badge (Figma node 580:1944) - Functional & Dynamic Match */}
        {isInquiry && (
          <div className="inline-flex">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-[#EFF8FF] text-[#175CD3]">
              {d.fittingInquiryMatch.replace("{percent}", String(currentMatchPercent))}
            </span>
          </div>
        )}
      </div>

      {/* For Inquiries: Display Full Inquiry Details with Manually Fillable & Default Empty Inputs (Matching Figma node 13b) */}
      {isInquiry ? (
        <div className="space-y-3.5 pt-1">
          {/* RECOMMENDED ALLOCATION CARD (Figma node 580:1947 - Specific to Inquiries) */}
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

          {/* Properties Section (Manually Fillable & Default Empty, with Validation Indicators) */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Date of Birth (Required) */}
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex flex-col">
                <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                  {d.dob} <span className="text-[#A12D3A]">*</span>
                </span>
                {validationErrors.dob && (
                  <span className="text-[10px] text-red-600 font-semibold">{validationErrors.dob}</span>
                )}
              </div>
              <div className={`w-44 rounded-lg ${validationErrors.dob ? "ring-2 ring-red-400 bg-red-50/20" : ""}`}>
                <DatePicker
                  value={interactiveDob || null}
                  format="dd,mmm,yyyy"
                  onChange={(_d, str) => {
                    setInteractiveDob(str);
                    if (str) setValidationErrors((prev) => { const n = { ...prev }; delete n.dob; return n; });
                    onUpdateItem?.({
                      ...item,
                      dob: str,
                      childAge: str ? `DOB: ${str}` : "",
                      childAgeDe: str ? `Geb.: ${str}` : "",
                    });
                  }}
                  locale={language}
                  placeholder={language === "de" ? "z.B. 15, Mai, 2024" : "e.g. 15, May, 2024"}
                  maxDate={new Date()}
                />
              </div>
            </div>

            {/* 2. Desired Start (Required) */}
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex flex-col">
                <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                  {d.desiredStart} <span className="text-[#A12D3A]">*</span>
                </span>
                {validationErrors.desiredStart && (
                  <span className="text-[10px] text-red-600 font-semibold">{validationErrors.desiredStart}</span>
                )}
              </div>
              <div className={`w-44 rounded-lg ${validationErrors.desiredStart ? "ring-2 ring-red-400 bg-red-50/20" : ""}`}>
                <DatePicker
                  value={interactiveDesiredStart || null}
                  format="mmm,yyyy"
                  onChange={(_d, str) => {
                    setInteractiveDesiredStart(str);
                    if (str) setValidationErrors((prev) => { const n = { ...prev }; delete n.desiredStart; return n; });
                    onUpdateItem?.({
                      ...item,
                      desiredStart: str,
                      desiredStartDe: str,
                      placementStart: str,
                      placementStartDe: str,
                    });
                  }}
                  locale={language}
                  placeholder={language === "de" ? "z.B. Jan, 2028" : "e.g. Jan, 2028"}
                />
              </div>
            </div>

            {/* 3. Est. Transition (Required) */}
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex flex-col">
                <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                  {d.estTransition} <span className="text-[#A12D3A]">*</span>
                </span>
                {validationErrors.estTransition && (
                  <span className="text-[10px] text-red-600 font-semibold">{validationErrors.estTransition}</span>
                )}
              </div>
              <div className={`w-44 rounded-lg ${validationErrors.estTransition ? "ring-2 ring-red-400 bg-red-50/20" : ""}`}>
                <DatePicker
                  value={interactiveTransition || null}
                  format="mmm,yyyy"
                  onChange={(_d, str) => {
                    setInteractiveTransition(str);
                    if (str) setValidationErrors((prev) => { const n = { ...prev }; delete n.estTransition; return n; });
                    onUpdateItem?.({
                      ...item,
                      estTransition: str,
                      estTransitionDe: str,
                      kindergartenTransition: str,
                      kindergartenTransitionDe: str,
                    });
                  }}
                  locale={language}
                  placeholder={language === "de" ? "z.B. Aug, 2029" : "e.g. Aug, 2029"}
                />
              </div>
            </div>

            {/* 4. Care Hours (Required) */}
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px] shrink-0">
                    {d.careHours} <span className="text-[#A12D3A]">*</span>
                  </span>
                  {validationErrors.dailyHours && (
                    <span className="text-[10px] text-red-600 font-semibold">{validationErrors.dailyHours}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-[100px] sm:w-[110px] shrink-0 relative z-20">
                    <TimePicker
                      value={careHoursFrom}
                      align="right"
                      onChange={(fromVal) => {
                        setCareHoursFrom(fromVal);
                        if (careHoursTo && fromVal >= careHoursTo) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            dailyHours: d.careHoursValidation || (language === "de" ? "Endzeit muss nach der Startzeit liegen." : "End time must be after start time."),
                          }));
                        } else {
                          setValidationErrors((prev) => { const n = { ...prev }; delete n.dailyHours; return n; });
                        }
                        const enFormatted = `Mon – Fri • ${fromVal} – ${careHoursTo}`;
                        const deFormatted = `Mo – Fr • ${fromVal} – ${careHoursTo}`;
                        setInteractiveHours(language === "de" ? deFormatted : enFormatted);
                        onUpdateItem?.({
                          ...item,
                          dailyHours: enFormatted,
                          dailyHoursDe: deFormatted,
                        });
                      }}
                      locale={language}
                      placeholder="08:00"
                    />
                  </div>
                  <span className="text-[#667085] text-xs shrink-0">–</span>
                  <div className="w-[100px] sm:w-[110px] shrink-0 relative z-10">
                    <TimePicker
                      value={careHoursTo}
                      align="right"
                      onChange={(toVal) => {
                        setCareHoursTo(toVal);
                        if (careHoursFrom && toVal <= careHoursFrom) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            dailyHours: d.careHoursValidation || (language === "de" ? "Endzeit muss nach der Startzeit liegen." : "End time must be after start time."),
                          }));
                        } else {
                          setValidationErrors((prev) => { const n = { ...prev }; delete n.dailyHours; return n; });
                        }
                        const enFormatted = `Mon – Fri • ${careHoursFrom} – ${toVal}`;
                        const deFormatted = `Mo – Fr • ${careHoursFrom} – ${toVal}`;
                        setInteractiveHours(language === "de" ? deFormatted : enFormatted);
                        onUpdateItem?.({
                          ...item,
                          dailyHours: enFormatted,
                          dailyHoursDe: deFormatted,
                        });
                      }}
                      locale={language}
                      placeholder="15:00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Preferences (Checkboxes) */}
            <div className="flex flex-col gap-1.5 py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.preferences}
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-1.5 text-xs text-[#344054] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={prefFemale}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPrefFemale(checked);
                      const updated = { female: checked, selfCooked: prefSelfCooked, petsOk: prefPetsOk };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-3.5 h-3.5 rounded text-[#A12D3A] focus:ring-[#A12D3A] border-[#D0D5DD] cursor-pointer"
                  />
                  <span className="font-medium">{d.preferenceFemale || (language === "de" ? "Weiblich" : "Female")}</span>
                </label>

                <label className="inline-flex items-center gap-1.5 text-xs text-[#344054] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={prefSelfCooked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPrefSelfCooked(checked);
                      const updated = { female: prefFemale, selfCooked: checked, petsOk: prefPetsOk };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-3.5 h-3.5 rounded text-[#A12D3A] focus:ring-[#A12D3A] border-[#D0D5DD] cursor-pointer"
                  />
                  <span className="font-medium">{d.preferenceSelfCooked || (language === "de" ? "Selbstgekocht" : "Self-cooked")}</span>
                </label>

                <label className="inline-flex items-center gap-1.5 text-xs text-[#344054] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={prefPetsOk}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPrefPetsOk(checked);
                      const updated = { female: prefFemale, selfCooked: prefSelfCooked, petsOk: checked };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-3.5 h-3.5 rounded text-[#A12D3A] focus:ring-[#A12D3A] border-[#D0D5DD] cursor-pointer"
                  />
                  <span className="font-medium">{d.preferencePetsOk || (language === "de" ? "Haustiere OK" : "Pets OK")}</span>
                </label>
              </div>
            </div>

            {/* 6. Location Search */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.locationSearch}
              </span>
              <span className="font-medium text-[#101828] text-[12px] text-right">
                {language === "de"
                  ? item.locationDistanceDe || d.locationSearchValue
                  : item.locationDistance || d.locationSearchValue}
              </span>
            </div>
          </div>

          {/* Parent Contact & Note Section (Figma node 580:1991 - Editable and Validated) */}
          <div className="space-y-2 pt-2 border-t border-[#F2F4F7]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085] uppercase tracking-wide">
              <span>{d.parentContactAndNote}</span>
              {(validationErrors.parentName || validationErrors.phone || validationErrors.email) && (
                <span className="text-red-600 font-bold normal-case">
                  {language === "de" ? "Kontaktdaten erforderlich" : "Contact details required"}
                </span>
              )}
            </div>
            <div className={`rounded-xl border p-3 space-y-2.5 transition-all ${(validationErrors.parentName || validationErrors.phone || validationErrors.email)
              ? "bg-red-50/30 border-red-300"
              : "bg-[#FAFBFC] border-[#EAECF0]"
              }`}>
              {/* Parent Name */}
              <div className="space-y-0.5">
                <input
                  type="text"
                  value={interactiveParents}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInteractiveParents(val);
                    if (val) setValidationErrors((prev) => { const n = { ...prev }; delete n.parentName; return n; });
                    onUpdateItem?.({
                      ...item,
                      parentContact: {
                        ...item.parentContact,
                        parents: val,
                      },
                    });
                  }}
                  placeholder={language === "de" ? "Name der Eltern eingeben *" : "Parent names *"}
                  className="w-full text-[13px] font-semibold text-[#101828] bg-transparent border-b border-transparent focus:border-[#D0D5DD] focus:outline-none placeholder-[#98A2B3]"
                />
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-xs text-[#344054]">
                <svg className="w-3.5 h-3.5 text-[#667085] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <input
                  type="tel"
                  value={interactivePhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInteractivePhone(val);
                    if (val) setValidationErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                    onUpdateItem?.({
                      ...item,
                      parentContact: {
                        ...item.parentContact,
                        phone: val,
                      },
                    });
                  }}
                  placeholder={language === "de" ? "Telefonnummer *" : "Phone number *"}
                  className="w-full text-xs text-[#344054] bg-transparent border-b border-transparent focus:border-[#D0D5DD] focus:outline-none font-mono placeholder-[#98A2B3]"
                />
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-xs text-[#344054]">
                <svg className="w-3.5 h-3.5 text-[#667085] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={interactiveEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInteractiveEmail(val);
                    if (val) setValidationErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                    onUpdateItem?.({
                      ...item,
                      parentContact: {
                        ...item.parentContact,
                        email: val,
                      },
                    });
                  }}
                  placeholder={language === "de" ? "E-Mail-Adresse *" : "Email address *"}
                  className="w-full text-xs text-[#344054] bg-transparent border-b border-transparent focus:border-[#D0D5DD] focus:outline-none placeholder-[#98A2B3]"
                />
              </div>

              {/* Parent Quote Note & Editable Caretaker Note */}
              <div className="pt-2 border-t border-[#EAECF0] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085]">
                  <span>{language === "de" ? "NOTIZ / ELTERNWUNSCH" : "PARENT NOTE & PREFERENCES"}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(!isEditingNote)}
                    className="text-[10px] text-[#A12D3A] hover:underline font-bold cursor-pointer"
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
                      className="w-full text-xs p-2 rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-hidden focus:border-[#A12D3A]"
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
                  <div className="text-xs text-[#344054] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EAECF0]">
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
        </div>
      ) : (
        /* For Enrolled Children / Active Spots: Display Child specs */
        <>
          {/* Properties Section */}
          <div className="space-y-2 sm:space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.childAge}
              </span>
              <span className="font-medium text-[#101828] text-[12px]">{childAgeDisplay}</span>
            </div>

            {/* Start Date */}
            <div className="flex items-center justify-between gap-2 py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.placementStart}
              </span>
              <div className="flex items-center gap-2 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
                <span>{placementStartDisplay}</span>
                <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>

            {/* Transition Date */}
            <div className="flex items-center justify-between gap-2 py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.kindergartenTransition}
              </span>
              <div className="flex items-center gap-2 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
                <span>{kindergartenTransitionDisplay}</span>
                <svg className="w-3.5 h-3.5 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>

            {/* Daily Hours */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.dailyHours}
              </span>
              <span className="font-medium text-[#101828] text-[12px]">{dailyHoursDisplay}</span>
            </div>
          </div>

          {/* Parent Contact & Note Section */}
          <div className="space-y-2 pt-2 border-t border-[#F2F4F7]">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wide">
              {d.parentContact}
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
            </div>
          </div>
        </>
      )}

      {/* Validation Errors Alert Banner */}
      {isInquiry && Object.keys(validationErrors).length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#D92D20] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              {language === "de"
                ? "Bitte alle Pflichtfelder für die Buchung ausfüllen:"
                : "All fields are required to confirm this booking:"}
            </span>
          </div>
          <ul className="list-disc list-inside text-[11px] pl-1 space-y-0.5">
            {Object.values(validationErrors).map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons (Figma node 580:2005) */}
      <div className="pt-2 flex flex-col sm:flex-row lg:flex-row items-center gap-2">
        {isInquiry ? (
          <>
            {/* Mark As Booked Button (Validates all required fields & persists to DB) */}
            <button
              type="button"
              onClick={handleConfirmBooking}
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
