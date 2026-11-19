"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem, InquiryStatus } from "../../../types/caretakerDashboard";
import { DatePicker, TimePicker } from "@repo/ui";
import { parseFlexibleBookingDate, calculateChildAge } from "@repo/shared";

interface BookingPreferencesState {
  gender: "female" | "male" | "";
  pets: "have_pets" | "no_pets" | "";
  food: "self_cooked" | "delivered" | "";
}

interface BookingDetailsPanelProps {
  item: BookingItem | null;
  onClose?: () => void;
  onOpenManageSlot: (item: BookingItem) => void;
  onOpenContactParents: (item: BookingItem) => void;
  onMarkAsBooked?: (item: BookingItem) => void;
  onUpdateInquiryStatus?: (id: string, status: InquiryStatus, reason?: string) => void;
  onUpdateItem?: (updated: BookingItem) => void;
}

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function formatToDdMmmYyyy(dateStr?: string | null, locale: "de" | "en" = "de"): string {
  if (!dateStr) return "";
  const d = parseFlexibleBookingDate(dateStr, false);
  if (!d) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const monthName = locale === "de" ? MONTH_NAMES_DE[d.getMonth()] : MONTH_NAMES_EN[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthName}, ${year}`;
}

function isDefaultInquiryPlaceholder(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  return (
    !trimmed ||
    /^Anfrage(\s+\d+)?$/i.test(trimmed) ||
    /^Inquiry(\s+\d+)?$/i.test(trimmed) ||
    trimmed === "Child" ||
    trimmed === "Kind" ||
    trimmed === "1 Kind" ||
    trimmed.startsWith("Familie ")
  );
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
  const parseCareHours = (raw?: string, isInq?: boolean): { from: string; to: string } => {
    if (isInq) return { from: "", to: "" };
    if (!raw || typeof raw !== "string") return { from: "", to: "" };
    const match = /(\d{1,2}:\d{2})\s*(?:–|-|to)\s*(\d{1,2}:\d{2})/i.exec(raw);
    if (match && match[1] && match[2]) {
      const from = match[1].length === 4 ? `0${match[1]}` : match[1];
      const to = match[2].length === 4 ? `0${match[2]}` : match[2];
      return { from, to };
    }
    return { from: "", to: "" };
  };

  const parsePreferences = (raw?: string): BookingPreferencesState => {
    if (!raw || typeof raw !== "string") {
      return { gender: "", pets: "", food: "" };
    }
    const lower = raw.toLowerCase();

    let gender: "female" | "male" | "" = "";
    if (lower.includes("female") || lower.includes("weiblich") || lower.includes("girl") || lower.includes("mädchen")) {
      gender = "female";
    } else if (lower.includes("male") || lower.includes("männlich") || lower.includes("junge") || lower.includes("boy")) {
      gender = "male";
    }

    let pets: "have_pets" | "no_pets" | "" = "";
    if (
      lower.includes("no pet") ||
      lower.includes("no_pet") ||
      lower.includes("not pet") ||
      lower.includes("keine tier") ||
      lower.includes("keine haustier") ||
      lower.includes("ohne tier")
    ) {
      pets = "no_pets";
    } else if (
      lower.includes("have pet") ||
      lower.includes("pets ok") ||
      lower.includes("pet") ||
      lower.includes("tier") ||
      lower.includes("dog") ||
      lower.includes("cat") ||
      lower.includes("hund") ||
      lower.includes("katze")
    ) {
      pets = "have_pets";
    }

    let food: "self_cooked" | "delivered" | "" = "";
    if (
      lower.includes("deliver") ||
      lower.includes("catering") ||
      lower.includes("geliefert") ||
      lower.includes("lieferung") ||
      lower.includes("brought")
    ) {
      food = "delivered";
    } else if (
      lower.includes("self") ||
      lower.includes("cook") ||
      lower.includes("koch") ||
      lower.includes("selbst") ||
      lower.includes("fresh") ||
      lower.includes("frisch")
    ) {
      food = "self_cooked";
    }

    return { gender, pets, food };
  };

  const formatPreferencesString = (
    prefs: BookingPreferencesState,
    lang: "de" | "en"
  ): string => {
    const parts: string[] = [];
    if (prefs.gender === "female") parts.push(lang === "de" ? "Weiblich" : "Female");
    if (prefs.gender === "male") parts.push(lang === "de" ? "Männlich" : "Male");
    if (prefs.pets === "have_pets") parts.push(lang === "de" ? "Haustiere vorhanden" : "Have pets");
    if (prefs.pets === "no_pets") parts.push(lang === "de" ? "Keine Haustiere" : "No pets");
    if (prefs.food === "self_cooked") parts.push(lang === "de" ? "Selbstgekocht" : "Self-cooked");
    if (prefs.food === "delivered") parts.push(lang === "de" ? "Geliefert / Catering" : "Delivered / Catering");
    return parts.join(" • ");
  };

  const resolveInitialChildName = (bookingItem: BookingItem | null) => {
    if (!bookingItem) return "";
    if (bookingItem.category === "inquiry" && isDefaultInquiryPlaceholder(bookingItem.childName)) {
      return "";
    }
    return bookingItem.childName || "";
  };

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [interactiveChildName, setInteractiveChildName] = useState(() => resolveInitialChildName(item));
  const [interactiveDob, setInteractiveDob] = useState(item?.dob || "");
  const [interactiveDesiredStart, setInteractiveDesiredStart] = useState(item?.desiredStart || item?.placementStart || "");
  const [interactiveTransition, setInteractiveTransition] = useState(item?.estTransition || item?.kindergartenTransition || "");

  const initialHours = parseCareHours(item?.dailyHours, item?.category === "inquiry");
  const [careHoursFrom, setCareHoursFrom] = useState(initialHours.from);
  const [careHoursTo, setCareHoursTo] = useState(initialHours.to);
  const [interactiveHours, setInteractiveHours] = useState(item?.category === "inquiry" ? "" : (item?.dailyHours || ""));

  const initialPrefs = parsePreferences(item?.preferences);
  const [prefGender, setPrefGender] = useState<"female" | "male" | "">(initialPrefs.gender);
  const [prefPets, setPrefPets] = useState<"have_pets" | "no_pets" | "">(initialPrefs.pets);
  const [prefFood, setPrefFood] = useState<"self_cooked" | "delivered" | "">(initialPrefs.food);
  const [interactivePreferences, setInteractivePreferences] = useState(item?.preferences || "");

  const [interactiveParents, setInteractiveParents] = useState(item?.parentContact?.parents || "");
  const [interactivePhone, setInteractivePhone] = useState(item?.parentContact?.phone || "");
  const [interactiveEmail, setInteractiveEmail] = useState(item?.parentContact?.email || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(item?.parentQuote || "");
  const [noteSavedAlert, setNoteSavedAlert] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Cancel Inquiry with Reason state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedPresetReason, setSelectedPresetReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Sync internal state when item changes
  React.useEffect(() => {
    setInteractiveChildName(resolveInitialChildName(item));
    setInteractiveDob(item?.dob || "");
    setInteractiveDesiredStart(item?.desiredStart || item?.placementStart || "");
    setInteractiveTransition(item?.estTransition || item?.kindergartenTransition || "");

    const hours = parseCareHours(item?.dailyHours, item?.category === "inquiry");
    setCareHoursFrom(hours.from);
    setCareHoursTo(hours.to);
    setInteractiveHours(item?.category === "inquiry" ? "" : (item?.dailyHours || ""));

    const prefs = parsePreferences(item?.preferences);
    setPrefGender(prefs.gender);
    setPrefPets(prefs.pets);
    setPrefFood(prefs.food);
    setInteractivePreferences(item?.preferences || "");

    setInteractiveParents(item?.parentContact?.parents || "");
    setInteractivePhone(item?.parentContact?.phone || "");
    setInteractiveEmail(item?.parentContact?.email || "");
    setNoteContent(item?.parentQuote || "");
    setIsEditingName(false);
    setIsEditingNote(false);
    setNoteSavedAlert(false);
    setValidationErrors({});
    setIsCancelModalOpen(false);
    setCancelReason("");
    setSelectedPresetReason("");
    setIsCancelling(false);
  }, [item?.id]);

  // Dynamic & functional match percentage (guaranteed responsive and never 0%)
  const currentMatchPercent = React.useMemo(() => {
    let score = 55;
    if (interactiveDesiredStart && interactiveDesiredStart.trim()) score += 20;
    if (interactiveHours && interactiveHours.trim()) score += 15;
    if (item?.locationDistance && !item.locationDistance.includes(">")) score += 10;
    return Math.min(95, Math.max(65, score));
  }, [interactiveDesiredStart, interactiveHours, item?.locationDistance]);

  const rawBirth = item?.dob || item?.childAge || item?.childAgeDe;
  const calculatedChildAge = React.useMemo(() => {
    return calculateChildAge(rawBirth, language);
  }, [rawBirth, language]);

  const dobDisplay = React.useMemo(() => {
    if (!rawBirth) return "";
    const cleaned = String(rawBirth).replace(/^(DOB|Geb\.?):?\s*/i, "").trim();
    return formatToDdMmmYyyy(cleaned, language) || cleaned;
  }, [rawBirth, language]);

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

    const enteredChildName = (interactiveChildName || "").trim();
    const finalName =
      enteredChildName && !isDefaultInquiryPlaceholder(enteredChildName)
        ? enteredChildName
        : (item.category !== "inquiry" && item.childName && !isDefaultInquiryPlaceholder(item.childName)
          ? item.childName.trim()
          : "");

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
      childAge: calculateChildAge(interactiveDob.trim(), "en"),
      childAgeDe: calculateChildAge(interactiveDob.trim(), "de"),
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
                    if (val.trim()) {
                      setValidationErrors((prev) => {
                        const n = { ...prev };
                        delete n.childName;
                        return n;
                      });
                    }
                    onUpdateItem?.({ ...item, childName: val });
                  }}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                  }}
                  placeholder={language === "de" ? "Name des Kindes eingeben" : "Enter child name"}
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
                  {interactiveChildName && !isDefaultInquiryPlaceholder(interactiveChildName) ? (
                    interactiveChildName
                  ) : !isInquiry && item.childName && !isDefaultInquiryPlaceholder(item.childName) ? (
                    item.childName
                  ) : (
                    <span className="text-[#98A2B3] font-normal italic">
                      {language === "de" ? "Name des Kindes eingeben" : "Enter child name"}
                    </span>
                  )}
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

          {validationErrors.childName && (
            <span className="text-[11px] text-red-600 font-semibold block pt-0.5">
              {validationErrors.childName}
            </span>
          )}

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
                {interactiveDob && calculateChildAge(interactiveDob, language) && (
                  <span className="text-[10px] text-[#15803D] font-semibold mt-0.5">
                    {calculateChildAge(interactiveDob, language)}
                  </span>
                )}
              </div>
              <div className={`w-44 rounded-lg ${validationErrors.dob ? "ring-2 ring-red-400 bg-red-50/20" : ""}`}>
                <DatePicker
                  value={interactiveDob || null}
                  format="dd mmm,yyyy"
                  onChange={(_d, str) => {
                    setInteractiveDob(str);
                    if (str) setValidationErrors((prev) => { const n = { ...prev }; delete n.dob; return n; });
                    const ageEn = calculateChildAge(str, "en");
                    const ageDe = calculateChildAge(str, "de");
                    onUpdateItem?.({
                      ...item,
                      dob: str,
                      childAge: ageEn,
                      childAgeDe: ageDe,
                    });
                  }}
                  locale={language}
                  placeholder={language === "de" ? "z.B. 15 Mai, 2024" : "e.g. 15 May, 2024"}
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
                  format="dd mmm,yyyy"
                  minDate={new Date()}
                  onChange={(_d, str) => {
                    setInteractiveDesiredStart(str);
                    if (str) setValidationErrors((prev) => { const n = { ...prev }; delete n.desiredStart; return n; });
                    if (interactiveTransition) {
                      const startD = parseFlexibleBookingDate(str, false);
                      const transD = parseFlexibleBookingDate(interactiveTransition, false);
                      if (startD && transD && transD < startD) {
                        setInteractiveTransition("");
                      }
                    }
                    onUpdateItem?.({
                      ...item,
                      desiredStart: str,
                      desiredStartDe: str,
                      placementStart: str,
                      placementStartDe: str,
                    });
                  }}
                  locale={language}
                  placeholder={language === "de" ? "z.B. 01 Jan, 2028" : "e.g. 01 Jan, 2028"}
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
                  format="dd mmm,yyyy"
                  minDate={parseFlexibleBookingDate(interactiveDesiredStart, false) || new Date()}
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
                  placeholder={language === "de" ? "z.B. 31 Jul, 2029" : "e.g. 31 Jul, 2029"}
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

            {/* 5. Preferences (Selection for Gender, Pets, and Meals) */}
            <div className="flex flex-col gap-2 py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.preferences}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 5a. Gender Selection: Male / Female */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                    {language === "de" ? "Geschlecht" : "Gender"}
                  </label>
                  <select
                    value={prefGender}
                    onChange={(e) => {
                      const nextGender = e.target.value as "female" | "male" | "";
                      setPrefGender(nextGender);
                      const updated = { gender: nextGender, pets: prefPets, food: prefFood };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-full h-[36px] px-2 text-xs font-medium text-[#101828] bg-[#F9FAFB] hover:bg-white rounded-lg border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all cursor-pointer"
                  >
                    <option value="">{language === "de" ? "— Beliebig —" : "— Any —"}</option>
                    <option value="male">{language === "de" ? "Männlich (Junge)" : "Male"}</option>
                    <option value="female">{language === "de" ? "Weiblich (Mädchen)" : "Female"}</option>
                  </select>
                </div>

                {/* 5b. Pets Selection: Have pets / No pets */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                    {language === "de" ? "Haustiere" : "Pets"}
                  </label>
                  <select
                    value={prefPets}
                    onChange={(e) => {
                      const nextPets = e.target.value as "have_pets" | "no_pets" | "";
                      setPrefPets(nextPets);
                      const updated = { gender: prefGender, pets: nextPets, food: prefFood };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-full h-[36px] px-2 text-xs font-medium text-[#101828] bg-[#F9FAFB] hover:bg-white rounded-lg border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all cursor-pointer"
                  >
                    <option value="">{language === "de" ? "— Beliebig —" : "— Any —"}</option>
                    <option value="have_pets">{language === "de" ? "Haustiere vorhanden" : "Have pets"}</option>
                    <option value="no_pets">{language === "de" ? "Keine Haustiere" : "No pets"}</option>
                  </select>
                </div>

                {/* 5c. Food Selection: Selfcooked / Delivered */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                    {language === "de" ? "Verpflegung" : "Meals"}
                  </label>
                  <select
                    value={prefFood}
                    onChange={(e) => {
                      const nextFood = e.target.value as "self_cooked" | "delivered" | "";
                      setPrefFood(nextFood);
                      const updated = { gender: prefGender, pets: prefPets, food: nextFood };
                      const enFormatted = formatPreferencesString(updated, "en");
                      const deFormatted = formatPreferencesString(updated, "de");
                      setInteractivePreferences(language === "de" ? deFormatted : enFormatted);
                      onUpdateItem?.({
                        ...item,
                        preferences: enFormatted,
                        preferencesDe: deFormatted,
                      });
                    }}
                    className="w-full h-[36px] px-2 text-xs font-medium text-[#101828] bg-[#F9FAFB] hover:bg-white rounded-lg border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all cursor-pointer"
                  >
                    <option value="">{language === "de" ? "— Beliebig —" : "— Any —"}</option>
                    <option value="self_cooked">{language === "de" ? "Selbstgekocht" : "Self-cooked"}</option>
                    <option value="delivered">{language === "de" ? "Geliefert / Catering" : "Delivered / Catering"}</option>
                  </select>
                </div>
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

                <div className="text-xs text-[#344054] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EAECF0]">
                  {noteContent}
                </div>


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
            {/* Child Age (Calculated from Date of Birth) */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.childAge}
              </span>
              <div className="flex flex-col items-end text-right">
                <span className="font-medium text-[#101828] text-[12px]">
                  {calculatedChildAge || childAgeDisplay}
                </span>
                {dobDisplay && dobDisplay !== calculatedChildAge && (
                  <span className="text-[10px] text-[#667085]">
                    {language === "de" ? `Geb.: ${dobDisplay}` : `DOB: ${dobDisplay}`}
                  </span>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-center justify-between gap-2 py-1">
              <span className="font-semibold text-[#667085] tracking-wide uppercase text-[11px]">
                {d.placementStart}
              </span>
              <div className="flex items-center gap-2 bg-[#F2F4F7] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#101828]">
                <span>{formatToDdMmmYyyy(placementStartDisplay, language) || placementStartDisplay}</span>
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
                <span>{formatToDdMmmYyyy(kindergartenTransitionDisplay, language) || kindergartenTransitionDisplay}</span>
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

            {/* Cancel / Decline Inquiry Button with Reason Popup */}
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full sm:w-auto h-[38px] px-3 rounded-lg bg-white border border-[#FDA29B] hover:bg-[#FEF3F2] text-[#B42318] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              title={language === "de" ? "Anfrage stornieren / ablehnen" : "Cancel / decline inquiry"}
            >
              <svg className="w-3.5 h-3.5 text-[#D92D20]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{language === "de" ? "Stornieren" : "Cancel"}</span>
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

      {/* Cancel Inquiry with Reason Modal / Popup */}
      {isCancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isCancelling && setIsCancelModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-[500px] p-5 sm:p-6 text-[#101828] space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FEF3F2] text-[#D92D20] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828]">
                    {language === "de" ? "Anfrage stornieren / ablehnen" : "Cancel / Decline Inquiry"}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {language === "de"
                      ? "Die Eltern erhalten eine automatische E-Mail mit dem Absagegrund."
                      : "Parents will receive an automated email with the cancellation reason."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isCancelling && setIsCancelModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Inquired Child info pill */}
            <div className="bg-[#FAF7F2] rounded-xl border border-[#E5DDD2] p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-[#7A6E62] font-semibold">{language === "de" ? "Kind / Anfrage:" : "Child / Inquiry:"} </span>
                <span className="font-bold text-[#1E1B18]">{item?.childName || "Anfrage"}</span>
              </div>
              <div className="text-[#7A6E62] text-[11px] font-mono">
                {item?.parentContact?.email}
              </div>
            </div>

            {/* Preset reasons chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054] uppercase tracking-wide">
                {language === "de" ? "Häufige Gründe wählen:" : "Choose a preset reason:"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    de: "Keine freien Plätze verfügbar",
                    en: "No available spots at this time",
                  },
                  {
                    de: "Altersgruppe passt derzeit leider nicht",
                    en: "Age group not fitting current cohort",
                  },
                  {
                    de: "Gewünschte Betreuungszeiten nicht möglich",
                    en: "Requested care hours cannot be accommodated",
                  },
                  {
                    de: "Betreuungsbeginn liegt außerhalb unserer Planung",
                    en: "Start date is outside our scheduling horizon",
                  },
                ].map((preset, idx) => {
                  const label = language === "de" ? preset.de : preset.en;
                  const isSelected = selectedPresetReason === label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPresetReason(label);
                        setCancelReason(label);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318] font-bold"
                          : "bg-white border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom reason textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054] uppercase tracking-wide">
                {language === "de" ? "Grund an die Eltern (E-Mail-Text):" : "Reason to parents (email text):"}
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={
                  language === "de"
                    ? "z.B. Leider haben wir im gewünschten Zeitraum keine freien Kapazitäten mehr..."
                    : "e.g. Unfortunately, we have no available capacity during the requested period..."
                }
                className="w-full text-xs text-[#101828] bg-white border border-[#D0D5DD] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20 focus:border-[#D92D20] transition-all resize-none placeholder-[#98A2B3]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#EAECF0]">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
              >
                {language === "de" ? "Abbrechen" : "Keep Inquiry"}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  if (!item) return;
                  setIsCancelling(true);
                  try {
                    const finalReason =
                      cancelReason.trim() ||
                      selectedPresetReason ||
                      (language === "de"
                        ? "Derzeit leider keine freien Kapazitäten verfügbar."
                        : "Unfortunately no spots available at this time.");
                    await onUpdateInquiryStatus?.(item.id, "Declined", finalReason);
                    setIsCancelModalOpen(false);
                    onClose?.();
                  } catch (err) {
                    console.error("Failed to cancel inquiry:", err);
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#D92D20] hover:bg-[#B42318] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-75 min-h-[38px]"
              >
                {isCancelling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === "de" ? "Wird storniert..." : "Cancelling..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{language === "de" ? "Anfrage stornieren & E-Mail senden" : "Decline & Send Email"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
