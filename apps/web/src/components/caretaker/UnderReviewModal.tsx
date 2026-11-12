"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "../../utils/caretakerApi";

export function UnderReviewModal() {
  const { t } = useLanguage();
  const { isUnderAdminReview, resetProfile, profile } = useCaretaker();

  if (!isUnderAdminReview) {
    return null;
  }

  const handleLogout = () => {
    caretakerApi.logout();
    resetProfile();
    window.location.href = "/login";
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#1E1B18]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="under-review-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-[24px] border border-[#E5DDD2] shadow-2xl my-auto max-h-[92vh] overflow-y-auto p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-150">
        {/* Amber Review Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shadow-xs">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* 100% Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span>{t.caretakerProfile.loginNotice.underReviewPopupBadge}</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-2.5">
          <h2
            id="under-review-modal-title"
            className="text-[20px] sm:text-[22px] font-extrabold text-[#1E1B18] tracking-tight leading-snug"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.caretakerProfile.loginNotice.underReviewPopupTitle}
          </h2>

          {profile.daycareName && (
            <p className="text-[13px] font-bold text-[#A12D3A]">
              {profile.daycareName}
            </p>
          )}

          <p className="text-[14px] text-[#7A6E62] leading-relaxed">
            {t.caretakerProfile.loginNotice.underReviewPopupDesc}
          </p>
        </div>

        {/* Logout CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-bold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t.caretakerProfile.loginNotice.underReviewPopupLogout}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

