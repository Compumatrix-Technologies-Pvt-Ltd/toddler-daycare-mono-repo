"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";

export function ProfileAlertBanner() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const reason = searchParams.get("reason");

  const { t } = useLanguage();
  const {
    completionPercentage,
    approvalStatus,
    setApprovalStatus,
  } = useCaretaker();

  // If there are no query params and approval is approved, no alert needed
  if (!from && !reason && approvalStatus === "approved") {
    return null;
  }

  // 1. Redirected from login because of awaiting approval
  if (reason === "awaiting_approval" || (from === "login" && completionPercentage === 100 && approvalStatus !== "approved")) {
    return (
      <div className="bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-[17px] sm:text-[18px] font-bold text-[#92400E] leading-snug"
                  style={{ fontFamily: "var(--font-plus-jakarta)" }}
                >
                  {t.caretakerProfile.loginNotice.awaitingTitle}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDE68A] text-[#78350F] border border-[#F59E0B]/30">
                  100% {t.caretakerProfile.progress.completionTitle}
                </span>
              </div>
              <p className="text-[14px] text-[#92400E]/90 mt-1 leading-relaxed">
                {t.caretakerProfile.loginNotice.awaitingDesc}
              </p>
            </div>
          </div>

          {/* Interactive Admin Demo Button */}
          <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => setApprovalStatus("approved")}
              className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{t.caretakerProfile.loginNotice.approveButton}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Redirected from login because of incomplete profile (< 100%)
  if (reason === "incomplete" || (from === "login" && completionPercentage < 100)) {
    return (
      <div className="bg-[#FFF1F2] border-2 border-[#E11D48] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-[17px] sm:text-[18px] font-bold text-[#9F1239] leading-snug"
                  style={{ fontFamily: "var(--font-plus-jakarta)" }}
                >
                  {t.caretakerProfile.loginNotice.incompleteTitle}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FECDD3] text-[#9F1239] border border-[#FDA4AF]">
                  {completionPercentage}% / 100%
                </span>
              </div>
              <p className="text-[14px] text-[#9F1239]/90 mt-1 leading-relaxed">
                {t.caretakerProfile.loginNotice.incompleteDesc}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-[13px] font-semibold text-[#9F1239] hover:underline self-start sm:self-center shrink-0"
          >
            {t.caretakerProfile.loginNotice.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  // 3. Came from fresh registration
  if (from === "register") {
    return (
      <div className="bg-[#F0FDF4] border-2 border-[#16A34A] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3
              className="text-[17px] sm:text-[18px] font-bold text-[#14532D] leading-snug"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.caretakerProfile.loginNotice.registerWelcomeTitle}
            </h3>
            <p className="text-[14px] text-[#166534] mt-1 leading-relaxed">
              {t.caretakerProfile.loginNotice.registerWelcomeDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default awaiting state if not approved yet (even without query params)
  if (completionPercentage === 100 && approvalStatus === "pending") {
    return (
      <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#92400E]">
              {t.caretakerProfile.loginNotice.awaitingTitle}
            </p>
            <p className="text-[12px] text-[#92400E]/80">
              {t.caretakerProfile.loginNotice.awaitingDesc}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setApprovalStatus("approved")}
          className="px-3.5 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all cursor-pointer shrink-0 self-start sm:self-center"
        >
          {t.caretakerProfile.loginNotice.approveButton}
        </button>
      </div>
    );
  }

  return null;
}
