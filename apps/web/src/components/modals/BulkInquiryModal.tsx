"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../i18n/LanguageContext";

export type BulkInquiryScope = "allMap" | "favorites" | "single";

export interface BulkInquiryModalProps {
  onClose: () => void;
  activeKitaName?: string;
  initialScope?: BulkInquiryScope;
  totalMapCount?: number;
  favoritesCount?: number;
}

export function BulkInquiryModal({
  onClose,
  activeKitaName,
  initialScope = "allMap",
  totalMapCount = 22,
  favoritesCount = 2,
}: BulkInquiryModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [scope, setScope] = useState<BulkInquiryScope>(initialScope);
  const [parentName, setParentName] = useState("Maximilian Schmidt");
  const [email, setEmail] = useState("max@example.com");
  const [message, setMessage] = useState(t.modals.enquiryForm.messageDefault);
  const [consent, setConsent] = useState(true);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    setMessage(t.modals.enquiryForm.messageDefault);
  }, [t.modals.enquiryForm.messageDefault]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();

    const contactedParam =
      scope === "single" && activeKitaName
        ? activeKitaName
        : scope === "allMap"
        ? `22 Tagespflegestellen`
        : `${favoritesCount} Favoriten`;

    router.push(
      `/confirm-enquiry?ref=REQ-2026-8492&contacted=${encodeURIComponent(
        contactedParam
      )}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-3xl border border-[#E5DDD2] w-full max-w-[760px] p-6 sm:p-8 relative my-auto max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-inquiry-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-[#F3ECE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#6B5E51] hover:text-[#1E1B18] transition-colors cursor-pointer"
          aria-label={t.modals.enquiryForm.close}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header: Title & Subtitle */}
        <div className="text-center space-y-1.5 mb-6 pr-8 sm:pr-0">
          <h2
            id="bulk-inquiry-modal-title"
            className="font-bold text-xl sm:text-2xl text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {scope === "single"
              ? (t.modals.enquiryForm as any).titleSingle || t.modals.enquiryForm.title
              : (t.modals.enquiryForm as any).titleBulk || t.modals.enquiryForm.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E62] leading-relaxed max-w-lg mx-auto">
            {t.modals.enquiryForm.subtitle}
          </p>
        </div>

        {/* Provider Scope Pills */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-2.5 mb-6">
          {activeKitaName && (
            <button
              type="button"
              onClick={() => setScope("single")}
              className={`py-2 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
                scope === "single"
                  ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                  : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] hover:border-[#D5C9B8] font-medium"
              }`}
            >
              <span>{t.modals.enquiryForm.tabs.single}</span>
              <span className="opacity-80 font-normal">({activeKitaName})</span>
            </button>
          )}

          {/* Option 2: alle Suchergebnisse */}
          <button
            type="button"
            onClick={() => setScope("allMap")}
            className={`py-2 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "allMap"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] hover:border-[#D5C9B8] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.allMap}</span>
            <span className="opacity-80 font-normal">({totalMapCount})</span>
          </button>

          {/* Option 3: alle Favoriten */}
          <button
            type="button"
            onClick={() => setScope("favorites")}
            className={`py-2 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "favorites"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] hover:border-[#D5C9B8] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.favorites}</span>
            <span className="opacity-80 font-normal">({favoritesCount})</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Row 1: Dein Name & Deine Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#4E443B]">
                {t.modals.enquiryForm.parentNameLabel}
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder={t.modals.enquiryForm.parentNamePlaceholder}
                className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#4E443B]">
                {t.modals.enquiryForm.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.modals.enquiryForm.emailPlaceholder}
                className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Deine Nachricht */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-[#4E443B]">
              {t.modals.enquiryForm.messageLabel}
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white border border-[#D5C9B8] rounded-xl p-3 text-xs sm:text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] resize-none leading-relaxed min-h-[110px] transition-colors"
            />
          </div>

          {/* Row 3: Checkbox 'Meine Suche soll für 30 Tage sichtbar bleiben.' + 'mehr erfahren...' */}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
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

          {/* Row 4: Submit Button 'Anfrage abschicken' */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-all shadow-xs shadow-[#A12D3A]/20 min-h-[48px] flex items-center justify-center active:scale-[0.99] cursor-pointer"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.modals.enquiryForm.submitButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
