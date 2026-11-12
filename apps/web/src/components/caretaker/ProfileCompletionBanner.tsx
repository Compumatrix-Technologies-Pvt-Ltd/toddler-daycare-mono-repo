"use client";

import React, { useState } from "react";
import { useCaretaker } from "../../context/CaretakerContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { caretakerApi } from "../../utils/caretakerApi";

export function ProfileCompletionBanner() {
  const { t } = useLanguage();
  const {
    profile,
    completionPercentage,
    sections,
    approvalStatus,
    syncFromBackendDaycare,
  } = useCaretaker();

  const [isResubmitting, setIsResubmitting] = useState(false);

  const is100Percent = completionPercentage === 100;
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const isAwaitingApproval = is100Percent && approvalStatus === "pending";

  const handleResubmit = async () => {
    setIsResubmitting(true);
    try {
      const formData = new FormData();
      formData.append("resubmitForReview", "true");
      const updated = await caretakerApi.updateDaycare(formData);
      if (updated) {
        syncFromBackendDaycare(updated, { preservePinState: true });
      }
    } catch {
      // ignore if fails
    } finally {
      setIsResubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-5">
      {/* Top Row: Title, Percentage, and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Progress Ring / Percentage Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[17px] shrink-0 border ${isApproved
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"
                : isRejected
                  ? "bg-[#FFF1F2] border-[#FECDD3] text-[#E11D48]"
                  : isAwaitingApproval
                    ? "bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]"
                    : "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
              }`}
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {completionPercentage}%
          </div>
          <div>
            <h2
              className="text-[18px] sm:text-[20px] font-bold text-[#1E1B18] tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.caretakerProfile.progress.completionTitle}: {completionPercentage}%
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#7A6E62] mt-0.5">
              {isApproved
                ? t.caretakerProfile.progress.approvedDesc
                : isRejected
                  ? t.caretakerProfile.progress.rejectedDesc
                  : isAwaitingApproval
                    ? t.caretakerProfile.progress.awaitingApprovalDesc
                    : t.caretakerProfile.progress.incompleteDesc}
            </p>
          </div>
        </div>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border shadow-2xs ${isApproved
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"
                : isRejected
                  ? "bg-[#FFF1F2] border-[#FECDD3] text-[#E11D48]"
                  : isAwaitingApproval
                    ? "bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]"
                    : "bg-[#FFF1F2] border-[#FECDD3] text-[#E11D48]"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isApproved
                  ? "bg-[#16A34A] animate-pulse"
                  : isRejected
                    ? "bg-[#E11D48]"
                    : isAwaitingApproval
                      ? "bg-[#F59E0B] animate-pulse"
                      : "bg-[#E11D48]"
                }`}
            />
            {isApproved
              ? t.caretakerProfile.progress.approvedBadge
              : isRejected
                ? t.caretakerProfile.progress.rejectedBadge
                : isAwaitingApproval
                  ? t.caretakerProfile.progress.awaitingApprovalBadge
                  : t.caretakerProfile.progress.incompleteBadge}
          </span>

          {isRejected && is100Percent && (
            <button
              type="button"
              onClick={handleResubmit}
              disabled={isResubmitting}
              className="px-3.5 py-1.5 rounded-full bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 min-h-[34px]"
            >
              {isResubmitting
                ? t.caretakerProfile.progress.resubmitting
                : t.caretakerProfile.progress.resubmitButton}
            </button>
          )}
        </div>
      </div>

      {/* Rejection Notes Callout */}
      {isRejected && profile.permitAdminNotes && (
        <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] text-[#9F1239]">
          <span className="font-bold">{t.caretakerProfile.compliance.adminNotesLabel}: </span>
          <span>{profile.permitAdminNotes}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-[#F3ECE2] h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 rounded-full ${isApproved
              ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A]"
              : is100Percent
                ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
                : "bg-gradient-to-r from-[#F59E0B] to-[#EA580C]"
            }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* 1. Location */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-colors ${sections.location
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#FAF8F5] border-[#E5DDD2] text-[#8A7C6C]"
            }`}
        >
          {sections.location ? (
            <svg className="w-4 h-4 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-[#B0A494] shrink-0" />
          )}
          <span className="truncate">{t.caretakerProfile.progress.sectionLocation} (25%)</span>
        </div>

        {/* 2. Operations */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-colors ${sections.operations
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#FAF8F5] border-[#E5DDD2] text-[#8A7C6C]"
            }`}
        >
          {sections.operations ? (
            <svg className="w-4 h-4 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-[#B0A494] shrink-0" />
          )}
          <span className="truncate">{t.caretakerProfile.progress.sectionOperations} (25%)</span>
        </div>

        {/* 3. Contact & Photos */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-colors ${sections.contactPhotos
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#FAF8F5] border-[#E5DDD2] text-[#8A7C6C]"
            }`}
        >
          {sections.contactPhotos ? (
            <svg className="w-4 h-4 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-[#B0A494] shrink-0" />
          )}
          <span className="truncate">{t.caretakerProfile.progress.sectionContactPhotos} (25%)</span>
        </div>

        {/* 4. Work Permit */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-colors ${sections.permit
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#FAF8F5] border-[#E5DDD2] text-[#8A7C6C]"
            }`}
        >
          {sections.permit ? (
            <svg className="w-4 h-4 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-[#B0A494] shrink-0" />
          )}
          <span className="truncate">{t.caretakerProfile.progress.sectionPermit} (25%)</span>
        </div>
      </div>
    </div>
  );
}
