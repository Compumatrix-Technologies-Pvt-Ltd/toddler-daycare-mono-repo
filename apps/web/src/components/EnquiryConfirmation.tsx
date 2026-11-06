"use client";

import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface EnquiryConfirmationProps {
  onBackToSearch?: () => void;
  onViewFavorites?: () => void;
  referenceId?: string;
  caretakersContacted?: string;
  mapVisibility?: string;
}

export function EnquiryConfirmation({
  onBackToSearch,
  onViewFavorites,
  referenceId,
  caretakersContacted,
  mapVisibility,
}: EnquiryConfirmationProps) {
  const { t } = useLanguage();

  const refId = referenceId || t.confirmEnquiry.referenceIdValue;
  const contacted =
    caretakersContacted || t.confirmEnquiry.caretakersContactedValue;
  const visibility = mapVisibility || t.confirmEnquiry.mapVisibilityValue;

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6">
      {/* Contact Form Card matching Figma node 183:2576 */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#D5C4AB] p-5 sm:p-8 shadow-[0px_12px_24px_0px_rgba(0,0,0,0.06)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Container */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Success Check Icon (56x56) */}
          <div className="w-14 h-14 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center text-2xl shadow-xs">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="font-bold text-2xl sm:text-[28px] text-[#1B1C1C] leading-tight font-heading">
            {t.confirmEnquiry.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-[#514532] whitespace-pre-line leading-relaxed max-w-[380px]">
            {t.confirmEnquiry.description}
          </p>
        </div>

        {/* Details Section with Dividers */}
        <div className="space-y-3 text-sm">
          {/* Row 1: Reference ID */}
          <div className="flex items-center justify-between py-1.5 px-1 gap-2">
            <span className="font-medium text-[#8C7C6D]">
              {t.confirmEnquiry.referenceIdLabel}
            </span>
            <span className="font-bold text-[#1B1C1C]">{refId}</span>
          </div>

          {/* Divider 1 */}
          <div className="border-t border-[#D5D5DD] w-full" />

          {/* Row 2: Caretakers Contacted */}
          <div className="flex items-center justify-between py-1.5 px-1 gap-2">
            <span className="font-medium text-[#8C7C6D] shrink-0">
              {t.confirmEnquiry.caretakersContactedLabel}
            </span>
            <span className="font-bold text-[#1B1C1C] text-right truncate">
              {contacted}
            </span>
          </div>

          {/* Divider 2 */}
          <div className="border-t border-[#D5D5DD] w-full" />

          {/* Row 3: 30-Day Map Visibility */}
          <div className="flex items-center justify-between py-1.5 px-1 gap-2">
            <span className="font-medium text-[#8C7C6D] shrink-0">
              {t.confirmEnquiry.mapVisibilityLabel}
            </span>
            <span className="font-bold text-[#1B1C1C] text-right">
              {visibility}
            </span>
          </div>
        </div>

        {/* Actions: Button & Link */}
        <div className="space-y-4 pt-2 text-center">
          {/* Send Message Button (Back to Vacancy Search) */}
          <button
            onClick={onBackToSearch}
            className="w-full bg-[#FFB800] hover:bg-[#EAA000] text-[#6B4C00] font-bold text-base py-3 px-6 rounded-xl shadow-xs transition-colors min-h-[46px] flex items-center justify-center active:scale-[0.99]"
          >
            {t.confirmEnquiry.backToSearch}
          </button>

          {/* Secondary Link: View in My Favorites */}
          <div className="text-sm font-medium text-[#514532]">
            <span>{t.confirmEnquiry.viewSavedPrefix}</span>
            <button
              onClick={onViewFavorites || onBackToSearch}
              className="font-bold text-[#AE2F34] underline hover:text-[#88222E] transition-colors"
            >
              {t.confirmEnquiry.myFavoritesLink}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
