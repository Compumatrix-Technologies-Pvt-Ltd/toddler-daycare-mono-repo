"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../i18n/LanguageContext";
import { submitInquiry } from "../../utils/inquery";
import { addSessionFavorite, addMultipleSessionFavorites } from "../../utils/favoritesSession";
import {
  MailIcon,
  UserIcon,
  PhoneIcon,
  CloseIcon,
} from "../icons/WebIcons";

export type EnquiryScope = "single" | "allMap" | "favorites";

interface EnquiryModalProps {
  onClose: () => void;
  activeKitaName?: string;
  activeKitaId?: string;
  activeCaretakerId?: string;
  caretakerIds?: string[];
  initialScope?: EnquiryScope;
  totalMapCount?: number;
  favoritesCount?: number;
  daycareIds?: string[];
  daycareNames?: string[];
  searchLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
    address?: string;
  };
  currentLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
  };
  searchFilters?: {
    child?: number;
    month?: string;
    year?: string;
    tolerance?: string;
    hours?: string;
    food?: string;
    pet?: string;
    gender?: string;
  };
}

export function EnquiryModal({
  onClose,
  activeKitaName = "Kita Sunshine",
  activeKitaId,
  activeCaretakerId,
  caretakerIds = [],
  initialScope = "single",
  totalMapCount = 22,
  favoritesCount = 2,
  daycareIds = [],
  daycareNames = [],
  searchLocation,
  currentLocation,
  searchFilters,
}: EnquiryModalProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Scope selection
  const [scope, setScope] = useState<EnquiryScope>(initialScope);

  // Form Fields: Dein Name, Deine Email, Deine Phone, Deine Nachricht
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  // Consent & Learn More (30-day map visibility)
  const [consent, setConsent] = useState(true);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Parent Location resolution (GPS coordinates)
  const [resolvedCurrentLocation, setResolvedCurrentLocation] = useState(currentLocation);

  React.useEffect(() => {
    if (currentLocation?.lat && (currentLocation?.lng || currentLocation?.log)) {
      setResolvedCurrentLocation(currentLocation);
      return;
    }
    if (typeof window !== "undefined" && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setResolvedCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            area: "Current Location",
          });
        },
        (err) => {
          console.warn("[EnquiryModal] Geolocation unavailable:", err?.message);
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    }
  }, [currentLocation]);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Compute contacted names & IDs
    const finalDaycareIds =
      scope === "single"
        ? activeKitaId ? [activeKitaId] : []
        : daycareIds;

    const finalCaretakerIds =
      scope === "single"
        ? activeCaretakerId ? [activeCaretakerId] : []
        : caretakerIds;

    const finalDaycareNames =
      scope === "single"
        ? [activeKitaName]
        : daycareNames.length > 0
          ? daycareNames
          : [activeKitaName];

    try {
      const res = await submitInquiry({
        scope,
        caretakerId: activeCaretakerId,
        caretakerIds: finalCaretakerIds,
        daycareIds: finalDaycareIds,
        daycareNames: finalDaycareNames,
        childName: parentName.trim() ? `Familie ${parentName.trim()}` : "1 Kind",
        desiredStart: "Flexibel / Nach Absprache",
        estTransition: "2-4 Weeks",
        careHours: "Mo – Fr • 08:00 – 15:00",
        preferences: {
          gender: "Any",
          food: "Self-cooked",
          pets: "Pets OK",
        },
        parentName: parentName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
        consentMapVisibility: consent,
        searchLocation: searchLocation || resolvedCurrentLocation,
        currentLocation: resolvedCurrentLocation || currentLocation,
        searchFilters: searchFilters || {
          child: 1,
          hours: "Mo – Fr • 08:00 – 15:00",
          food: "Self-cooked",
          pet: "Pets OK",
          gender: "Any",
        },
      });

      const referenceId = res.meta?.referenceId || `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Automatically mark contacted daycare(s) as favorite
      if (activeKitaId) {
        addSessionFavorite(activeKitaId);
      }
      if (scope === "allMap" && Array.isArray(daycareIds) && daycareIds.length > 0) {
        addMultipleSessionFavorites(daycareIds);
      }

      const contactedParam =
        scope === "single"
          ? activeKitaName
          : scope === "allMap"
            ? `${activeKitaName} & ${Math.max(0, totalMapCount - 1)} Others`
            : `${favoritesCount} Saved Daycares`;

      onClose();

      router.push(
        `/confirm-enquiry?ref=${encodeURIComponent(referenceId)}&contacted=${encodeURIComponent(
          contactedParam
        )}&child=${encodeURIComponent(parentName.trim() || "1 Kind")}`
      );
    } catch (err: any) {
      console.error("[EnquiryModal] Submission error:", err);
      setErrorMessage(err.message || "Failed to submit inquiry. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#E5DDD2] w-full max-w-[620px] p-5 sm:p-8 relative my-auto max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-[#F3ECE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#6B5E51] hover:text-[#1E1B18] transition-colors cursor-pointer"
          aria-label={t.modals.enquiryForm.close}
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-5 pr-8 sm:pr-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-semibold text-[#A12D3A] mb-1">
            <MailIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
            <span>{t.modals.enquiryForm.titleSingle || "Anfrage senden"}</span>
          </div>
          <h2
            id="enquiry-modal-title"
            className="font-bold text-xl sm:text-2xl text-[#1E1B18] tracking-tight font-heading"
          >
            {scope === "single"
              ? (t.modals.enquiryForm as any).titleSingle || t.modals.enquiryForm.title
              : (t.modals.enquiryForm as any).titleBulk || t.modals.enquiryForm.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E62] leading-relaxed max-w-lg mx-auto">
            {t.modals.enquiryForm.subtitle}
          </p>
        </div>

        {/* Scope Selector Pills */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-2.5 mb-5">
          {/* Option 1: To This Provider Only */}
          <button
            type="button"
            onClick={() => setScope("single")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "single"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.single}</span>
            {activeKitaName && (
              <span className="opacity-80 font-normal">({activeKitaName})</span>
            )}
          </button>

          {/* Option 2: To All Map Results */}
          <button
            type="button"
            onClick={() => setScope("allMap")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "allMap"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.allMap}</span>
            <span className="opacity-80 font-normal">({totalMapCount})</span>
          </button>

          {/* Option 3: To All My Favourites */}
          <button
            type="button"
            onClick={() => setScope("favorites")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "favorites"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.favorites}</span>
            <span className="opacity-80 font-normal">({favoritesCount})</span>
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Simplified Inquiry Form: Dein Name, Deine Email, Deine Phone, Deine Nachricht */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-4">
            {/* 1. Dein Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#4E443B] uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
                <span>{t.modals.enquiryForm.parentNameLabel || "Dein Name"} *</span>
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder={t.modals.enquiryForm.parentNamePlaceholder || "z. B. Maximilian Schmidt"}
                className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[44px] transition-colors shadow-2xs"
              />
            </div>

            {/* 2. Deine Email & 3. Deine Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#4E443B] uppercase tracking-wider flex items-center gap-1.5">
                  <MailIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
                  <span>{t.modals.enquiryForm.emailLabel || "Deine Email"} *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.modals.enquiryForm.emailPlaceholder || "z. B. max@example.com"}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[44px] transition-colors shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#4E443B] uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
                  <span>{t.modals.enquiryForm.phoneLabel || "Deine Telefonnummer"} *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.modals.enquiryForm.phonePlaceholder || "+49 170 1234567"}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[44px] transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* 4. Deine Nachricht */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#4E443B] uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#A12D3A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{t.modals.enquiryForm.noteLabel || "Deine Nachricht"}</span>
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.modals.enquiryForm.notePlaceholder || "Schreibe Deine Nachricht an die Tagespflege..."}
                className="w-full bg-white border border-[#D5C9B8] rounded-xl p-3.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] resize-none leading-relaxed min-h-[105px] transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-0.5 space-y-2">
            <div className="flex items-start gap-3 select-none">
              <label className="flex items-center cursor-pointer mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    consent
                      ? "bg-[#A12D3A] text-white shadow-2xs"
                      : "border border-[#D5C9B8] bg-white hover:border-[#A12D3A]"
                  }`}
                >
                  {consent && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>

              <div className="text-xs sm:text-sm text-[#4E443B] leading-relaxed">
                <span>{t.modals.enquiryForm.consentLabel}</span>{" "}
                <button
                  type="button"
                  onClick={() => setShowLearnMore(!showLearnMore)}
                  className="text-[#A12D3A] hover:underline font-semibold cursor-pointer transition-colors inline-flex items-center gap-0.5"
                >
                  <span>{t.modals.enquiryForm.learnMoreLink}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showLearnMore ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expandable Learn More Box */}
            {showLearnMore && (
              <div className="ml-8 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs sm:text-[13px] text-[#5C5044] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[#A12D3A] shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p>{t.modals.enquiryForm.learnMoreComment}</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A12D3A] hover:bg-[#88222E] disabled:opacity-70 text-white font-semibold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-all shadow-xs shadow-[#A12D3A]/20 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.modals.enquiryForm.sending || "Anfrage wird gesendet..."}</span>
                </>
              ) : (
                <>
                  <MailIcon className="w-4 h-4 text-white" />
                  <span>{t.modals.enquiryForm.submitButton}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
