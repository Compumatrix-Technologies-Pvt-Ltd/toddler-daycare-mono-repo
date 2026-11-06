"use client";

import React, { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";

export function WorkPermitCard() {
  const { t } = useLanguage();
  const { profile, updateProfile, approvalStatus } = useCaretaker();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const isApproved = approvalStatus === "approved";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      updateProfile({
        hasUploadedPermit: true,
        permitFileName: selectedFile ? selectedFile.name : "Pflegeerlaubnis_Maria_Weber.pdf",
      });
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 800);
  };

  return (
    <>
      <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-7">
        {/* Header with Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h2
              className="text-[20px] sm:text-[22px] font-bold text-[#1E1B18] tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.caretakerProfile.compliance.title}
            </h2>
            <p className="text-[14px] text-[#7A6E62] mt-1.5 leading-relaxed">
              {t.caretakerProfile.compliance.subtitle}
            </p>
          </div>

          {/* Status Badge: Verified (thin green oval) vs Awaiting / Verification Needed */}
          {isApproved ? (
            <div className="self-start px-3.5 py-0.5 rounded-full border border-[#16A34A] text-[#15803D] text-[13px] font-medium tracking-wide shrink-0 bg-transparent">
              {t.caretakerProfile.compliance.verifiedBadge}
            </div>
          ) : profile.hasUploadedPermit ? (
            <div className="self-start px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold tracking-wide shrink-0">
              {t.caretakerProfile.loginNotice.awaitingTitle}
            </div>
          ) : (
            <div className="self-start px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold tracking-wide shrink-0">
              {t.caretakerProfile.compliance.verificationNeeded}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CASE 1: WORK PERMIT APPROVED (MATCHES FIGMA SCREENSHOT 1:1)   */}
        {/* ============================================================ */}
        {isApproved ? (
          <div className="space-y-5">
            {/* Mint Green License Card */}
            <div className="bg-[#F0FDF4] rounded-2xl p-5 sm:p-6 border border-[#DCFCE7] space-y-3.5 shadow-2xs">
              {/* Row 1: Shield with checkmark + License Number and Active Dot */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-5 h-5 text-[#16A34A] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span
                    className="text-[16px] sm:text-[17px] font-bold text-[#1E1B18]"
                    style={{ fontFamily: "var(--font-plus-jakarta)" }}
                  >
                    {t.caretakerProfile.compliance.licenseNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-[14px] font-semibold text-[#15803D]">
                    {t.caretakerProfile.compliance.activeStatus}
                  </span>
                </div>
              </div>

              {/* Row 2: Issued by Jugendamt */}
              <p className="text-[14px] text-[#5C5043]">
                {t.caretakerProfile.compliance.issuedBy}
              </p>

              {/* Row 3: Expiry Date and Days Remaining */}
              <div className="pt-0.5 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[14px] font-medium text-[#15803D]">
                  {t.caretakerProfile.compliance.expires}
                </span>
                <span className="text-[13px] sm:text-[14px] text-[#7A6E62]">
                  {t.caretakerProfile.compliance.daysRemaining}
                </span>
              </div>
            </div>

            {/* Bottom Full-Width CTA: View Verified Certificate (PDF) */}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="w-full h-[50px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-bold text-[15px] sm:text-[16px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              <span>{t.caretakerProfile.compliance.viewCertificate}</span>
            </button>
          </div>
        ) : profile.hasUploadedPermit ? (
          /* ============================================================ */
          /* CASE 2: Uploaded & Awaiting Approval                         */
          /* ============================================================ */
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0 shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#14532D]">
                    {profile.permitFileName || "Pflegeerlaubnis_Maria_Weber.pdf"}
                  </p>
                  <p className="text-[12px] text-[#166534] flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span>{t.caretakerProfile.loginNotice.uploadedOn}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[#BBF7D0] bg-white hover:bg-[#F0FDF4] text-[#15803D] text-[13px] font-semibold transition-all cursor-pointer"
                >
                  {t.caretakerProfile.compliance.viewCertificate}
                </button>
                <button
                  type="button"
                  onClick={() => updateProfile({ hasUploadedPermit: false, permitFileName: "" })}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C9B8] hover:border-[#DC2626] bg-white text-[#7A6E62] hover:text-[#DC2626] text-[13px] font-semibold transition-all cursor-pointer"
                >
                  {t.caretakerProfile.loginNotice.removePermit}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CASE 3: Not Uploaded (Dropzone)                              */
          /* ============================================================ */
          <form onSubmit={handleUpload} className="space-y-6">
            <label
              htmlFor="certificate-upload-input"
              className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#D5C9B8] hover:border-[#A12D3A] rounded-2xl p-8 sm:p-12 text-center bg-[#FAF8F5]/40 hover:bg-[#FAF8F5] transition-all cursor-pointer group"
            >
              <input
                id="certificate-upload-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
              />

              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#7A6E62] group-hover:text-[#A12D3A] group-hover:scale-110 transition-all mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <p className="text-[15px] font-semibold text-[#1E1B18]">
                {selectedFile ? (
                  <span className="text-[#16A34A]">{selectedFile.name}</span>
                ) : (
                  t.caretakerProfile.compliance.dropzoneTitle
                )}
              </p>
              <p className="text-[13px] text-[#7A6E62] mt-1">
                {t.caretakerProfile.compliance.dropzoneSubtitle}
              </p>
            </label>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full h-[50px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-bold text-[16px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {isUploading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : uploadSuccess ? (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t.caretakerProfile.compliance.uploadSuccess}</span>
                </>
              ) : (
                t.caretakerProfile.compliance.uploadButton
              )}
            </button>
          </form>
        )}
      </div>

      {/* ============================================================ */}
      {/* VERIFIED CERTIFICATE PDF PREVIEW MODAL                       */}
      {/* ============================================================ */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-[620px] w-full border border-[#E5DDD2] shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD2] bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1E1B18]" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    {t.caretakerProfile.compliance.title}
                  </h3>
                  <p className="text-[11px] text-[#7A6E62]">
                    {t.caretakerProfile.compliance.licenseNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EAE4DC] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Official Document Sheet */}
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <div className="border-2 border-[#D5C9B8] rounded-2xl p-6 bg-[#FCFBF9] relative overflow-hidden space-y-5">
                {/* Official Seal Watermark */}
                <div className="absolute right-4 bottom-4 w-28 h-28 rounded-full border-4 border-[#16A34A]/15 flex items-center justify-center rotate-12 pointer-events-none">
                  <span className="text-[10px] font-bold tracking-widest text-[#16A34A]/30 uppercase text-center leading-tight">
                    {t.caretakerProfile.compliance.modalWatermarkLine1}<br />
                    {t.caretakerProfile.compliance.modalWatermarkLine2}<br />
                    {t.caretakerProfile.compliance.modalWatermarkLine3}
                  </span>
                </div>

                {/* Document Header */}
                <div className="text-center border-b border-[#E5DDD2] pb-4 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold tracking-wide mb-1">
                    <svg className="w-3.5 h-3.5 text-[#15803D]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t.caretakerProfile.compliance.verifiedBadge}</span>
                  </div>
                  <h4 className="text-[18px] font-extrabold text-[#1E1B18] tracking-tight uppercase" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    {t.caretakerProfile.compliance.modalDocTitle}
                  </h4>
                  <p className="text-[12px] text-[#7A6E62]">
                    {t.caretakerProfile.compliance.issuedBy}
                  </p>
                </div>

                {/* Certificate Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalCaregiverLabel}
                    </span>
                    <span className="font-bold text-[#1E1B18]">
                      {profile.caregiverName || "Maria Weber"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalLicenseNumberLabel}
                    </span>
                    <span className="font-bold text-[#1E1B18] font-mono">
                      DE-84920-BER
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalDaycareLabel}
                    </span>
                    <span className="font-bold text-[#1E1B18]">
                      {profile.daycareName || "Kita Sonnenschein"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalMaxCapacityLabel}
                    </span>
                    <span className="font-bold text-[#1E1B18]">
                      {profile.maxCapacity || "5 children"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalStatusLabel}
                    </span>
                    <span className="font-bold text-[#16A34A] flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      {t.caretakerProfile.compliance.activeStatus}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#8A7C6C] uppercase">
                      {t.caretakerProfile.compliance.modalValidityLabel}
                    </span>
                    <span className="font-bold text-[#1E1B18]">
                      {t.caretakerProfile.compliance.expires}
                    </span>
                  </div>
                </div>

                {/* Footer Stamp Row */}
                <div className="pt-3 border-t border-[#E5DDD2] flex items-center justify-between text-[11px] text-[#8A7C6C]">
                  <span>{t.caretakerProfile.compliance.modalSignedBy}</span>
                  <span>{t.caretakerProfile.compliance.modalChecksum}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#D5C9B8] hover:bg-[#FAF8F5] text-[#5C5043] font-semibold text-[14px] transition-colors cursor-pointer"
                >
                  {t.caretakerProfile.compliance.modalCloseButton}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white font-bold text-[14px] transition-colors shadow-sm cursor-pointer"
                  style={{ fontFamily: "var(--font-plus-jakarta)" }}
                >
                  {t.caretakerProfile.compliance.modalDownloadButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
