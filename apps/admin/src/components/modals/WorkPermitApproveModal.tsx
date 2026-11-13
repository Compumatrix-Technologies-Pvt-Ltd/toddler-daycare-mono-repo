import React, { useState, useEffect } from "react";
import mammoth from "mammoth";
import { CloseIcon, ShieldCheckIcon, BuildingIcon, CheckCircleIcon } from "../icons/AdminIcons";
import { DaycareApplication, WorkPermitDetails } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";
import { DatePicker } from "@repo/ui";

interface WorkPermitApproveModalProps {
  application: DaycareApplication | null;
  applications?: DaycareApplication[];
  onClose: () => void;
  onConfirmApprove: (id: string, details: WorkPermitDetails) => Promise<void> | void;
}

export function WorkPermitApproveModal({
  application,
  applications = [],
  onClose,
  onConfirmApprove,
}: WorkPermitApproveModalProps) {
  const { t, language } = useLanguage();
  const copy = t.admin.dashboard.approveModal;

  const [permitId, setPermitId] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [authorizedCapacity, setAuthorizedCapacity] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!application) return;
    const today = new Date();
    const defaultReg = application.registrationDate || today.toISOString().slice(0, 10);
    const twoYearsLater = new Date(today);
    twoYearsLater.setFullYear(today.getFullYear() + 2);
    const defaultExp = application.expirationDate || twoYearsLater.toISOString().slice(0, 10);

    setPermitId(application.permitId || "");
    setRegistrationDate(defaultReg);
    setExpirationDate(defaultExp);
    setIssuingAuthority(
      application.issuingAuthority ||
        (application.district ? `Jugendamt ${application.district}` : "")
    );
    setAuthorizedCapacity(
      String(application.authorizedCapacity ?? application.capacity ?? 5)
    );
    setAdminNotes(application.adminNotes || "");
    setError(null);
    setIsSubmitting(false);
  }, [application]);

  if (!application) return null;

  const docUrl = application.workPermitUrl || "";
  const docName = application.workPermitFileName || (docUrl ? docUrl.split("/").pop() || "work-permit" : "");
  const lowerUrl = (docUrl || docName).toLowerCase();
  const isPdf = lowerUrl.endsWith(".pdf");
  const isDocx = lowerUrl.endsWith(".docx");
  const isDoc = lowerUrl.endsWith(".doc");
  const isImage =
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".webp");

  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Load and convert .docx documents to formatted HTML using mammoth
  useEffect(() => {
    if (!docUrl || !isDocx) {
      setDocxHtml(null);
      setDocLoading(false);
      setDocError(null);
      return;
    }

    let isMounted = true;
    setDocLoading(true);
    setDocError(null);

    fetch(docUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.arrayBuffer();
      })
      .then(async (arrayBuffer) => {
        const result = await (mammoth as any).convertToHtml({ arrayBuffer });
        if (isMounted) {
          setDocxHtml(result.value);
          setDocLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Failed to parse docx document with mammoth:", err);
          setDocError("Could not render Word document preview inline.");
          setDocLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [docUrl, isDocx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!permitId.trim() || !registrationDate.trim() || !expirationDate.trim()) {
      setError(copy.validationRequired);
      return;
    }

    // Validation: Permit Number can not be duplicate / same across registered daycares
    const trimmedPermit = permitId.trim().toLowerCase();
    const isDuplicate = applications.some(
      (app) =>
        app.id !== application.id &&
        (app.permitId?.trim().toLowerCase() === trimmedPermit ||
          app.permitNumber?.trim().toLowerCase() === trimmedPermit)
    );

    if (isDuplicate) {
      setError(copy.validationPermitDuplicate || "This Permit Number is already assigned to another registered daycare.");
      return;
    }

    if (new Date(expirationDate) <= new Date(registrationDate)) {
      setError(copy.validationDateOrder);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: WorkPermitDetails = {
        permitId: permitId.trim(),
        registrationDate: registrationDate.trim(),
        expirationDate: expirationDate.trim(),
        issuingAuthority: issuingAuthority.trim(),
        adminNotes: adminNotes.trim(),
      };
      if (authorizedCapacity && !isNaN(Number(authorizedCapacity))) {
        payload.authorizedCapacity = Number(authorizedCapacity);
      }
      await onConfirmApprove(application.id, payload);
      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.permitId?.[0] ||
        err?.message ||
        "Failed to approve work permit.";
      setError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#E5DDD2] my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-permit-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#E5DDD2] flex items-center justify-between bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shadow-2xs shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <h2
                id="approve-permit-modal-title"
                className="text-sm sm:text-base font-bold text-[#1E1B18] leading-tight truncate"
              >
                {copy.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#7A6E62] truncate mt-0.5">
                {application.daycareName} • {application.caretakerName} — {copy.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer shrink-0 ml-2"
            aria-label={copy.cancel}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Two-Column Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left Column: Document Review (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#1E1B18] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#1E1B18] truncate">
                      {copy.documentPreview}
                    </h3>
                  </div>

                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={docName || undefined}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[11px] font-semibold text-[#A12D3A] transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>{copy.openInNewTab}</span>
                    </a>
                  )}
                </div>

                {/* Applicant Summary Strip */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <BuildingIcon className="w-4 h-4 text-[#8A775C] shrink-0" />
                    <span className="font-semibold text-[#1E1B18] truncate">
                      {application.daycareName}
                    </span>
                    <span className="text-[#7A6E62] truncate">• {application.location}</span>
                  </div>
                  {docName && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5DDD2] font-mono text-[10px] text-[#5C4C3E] truncate max-w-[220px]">
                      {docName}
                    </span>
                  )}
                </div>

                {/* Preview Box */}
                <div className="rounded-2xl border border-[#E5DDD2] bg-[#FAF7F2]/60 overflow-hidden flex-1 min-h-[280px] sm:min-h-[380px] flex flex-col">
                  {!docUrl ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-[#92400E]">
                        {copy.noDocumentUploaded}
                      </p>
                    </div>
                  ) : isPdf ? (
                    <iframe
                      src={`${docUrl}#view=FitH`}
                      title={docName || "Work Permit PDF"}
                      className="w-full h-[380px] sm:h-[460px] bg-white border-0"
                    />
                  ) : isDocx ? (
                    <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-[380px] sm:min-h-[460px]">
                      {docLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                          <div className="w-7 h-7 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-semibold text-[#7A6E62]">
                            {t.admin.dashboard.approveModal.renderingDoc || "Rendering Word Document..."}
                          </p>
                        </div>
                      ) : docError || !docxHtml ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-xs font-semibold text-[#92400E]">
                            {t.admin.dashboard.approveModal.docPreview || "Word Document Preview"}
                          </p>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={docName || undefined}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A12D3A] text-white text-xs font-semibold hover:bg-[#88222E]"
                          >
                            <span>{t.admin.dashboard.approveModal.downloadDocx || "Download / Open DOCX"}</span>
                          </a>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-[#1E1B18] leading-relaxed prose prose-sm max-w-none docx-preview-content">
                          <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
                        </div>
                      )}
                    </div>
                  ) : isDoc ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white">
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#2563EB] shadow-xs">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h4" />
                        </svg>
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <p className="text-xs sm:text-sm font-bold text-[#1E1B18] break-all">{docName}</p>
                        <p className="text-xs text-[#7A6E62]">
                          Legacy Microsoft Word (.doc) format. Open in Word or download to view.
                        </p>
                      </div>
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={docName || undefined}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{t.admin.dashboard.approveModal.downloadView || "Download & View Document"}</span>
                      </a>
                    </div>
                  ) : isImage ? (
                    <div className="flex-1 flex items-center justify-center p-4 bg-[#1E1B18]/5">
                      <img
                        src={docUrl}
                        alt={docName || "Work Permit Document"}
                        className="max-h-[400px] w-auto object-contain rounded-xl shadow-sm border border-[#E5DDD2] bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shadow-xs">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <p className="text-xs sm:text-sm font-bold text-[#1E1B18] break-all">
                          {docName}
                        </p>
                        <p className="text-xs text-[#7A6E62] leading-relaxed">
                          {copy.unsupportedPreview}
                        </p>
                      </div>
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={docName || undefined}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{copy.openInNewTab}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Official Permit Details Form (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col space-y-4 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1E1B18]">
                    {copy.formTitle}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5DDD2] bg-[#FAF7F2]/50 space-y-3.5">
                  {/* Work Permit ID */}
                  <div className="space-y-1">
                    <label
                      htmlFor="permit-id-input"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4C3E]"
                    >
                      {copy.permitId} <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="permit-id-input"
                      type="text"
                      required
                      value={permitId}
                      onChange={(e) => setPermitId(e.target.value)}
                      placeholder={copy.permitIdPlaceholder}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm font-mono font-semibold text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden"
                    />
                  </div>

                  {/* Registration Date & Expiration Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DatePicker
                      id="permit-reg-date"
                      label={copy.registrationDate}
                      required
                      value={registrationDate}
                      onChange={(_d, dateStr) => setRegistrationDate(dateStr)}
                      locale={language}
                    />

                    <DatePicker
                      id="permit-exp-date"
                      label={copy.expirationDate}
                      required
                      value={expirationDate}
                      onChange={(_d, dateStr) => setExpirationDate(dateStr)}
                      locale={language}
                      minDate={registrationDate}
                    />
                  </div>

                  {/* Issuing Authority & Authorized Capacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label
                        htmlFor="permit-authority"
                        className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4C3E]"
                      >
                        {copy.issuingAuthority}
                      </label>
                      <input
                        id="permit-authority"
                        type="text"
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                        placeholder={copy.issuingAuthorityPlaceholder}
                        className="w-full h-[42px] px-3.5 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="permit-capacity"
                        className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4C3E]"
                      >
                        {copy.authorizedCapacity}
                      </label>
                      <input
                        id="permit-capacity"
                        type="number"
                        min={1}
                        max={20}
                        value={authorizedCapacity}
                        onChange={(e) => setAuthorizedCapacity(e.target.value)}
                        className="w-full h-[42px] px-3.5 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm font-semibold text-[#1E1B18] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Verification Notes */}
                  <div className="space-y-1">
                    <label
                      htmlFor="permit-notes"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4C3E]"
                    >
                      {copy.adminNotes}
                    </label>
                    <textarea
                      id="permit-notes"
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={copy.adminNotesPlaceholder}
                      className="w-full p-3 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-[#E5DDD2] bg-[#FAF7F2] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#5C4C3E] transition-colors cursor-pointer min-h-[44px]"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
            >
              <CheckCircleIcon className="w-4 h-4 text-white" />
              <span>{isSubmitting ? copy.submitting : copy.submitApprove}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
