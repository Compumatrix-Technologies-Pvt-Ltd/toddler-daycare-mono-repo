import React, { useState } from "react";
import { CloseIcon, AlertCircleIcon } from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface RejectModalProps {
  application: DaycareApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (id: string, adminNotes?: string) => Promise<void> | void;
}

export function RejectModal({
  application,
  isOpen,
  onClose,
  onConfirmReject,
}: RejectModalProps) {
  const { t } = useLanguage();
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !application) return null;

  const copy = t.admin.dashboard.rejectModal || {
    title: "Kindertagespflege ablehnen",
    subtitle: "Möchten Sie diesen Antrag wirklich ablehnen? Sie können optional eine Begründung für die Tagespflegeperson hinterlegen.",
    reasonLabel: "Ablehnungsgrund / Prüfungshinweise (Optional)",
    reasonPlaceholder: "z. B. Unvollständige Unterlagen, Nachweis der Pflegeerlaubnis fehlt...",
    cancel: "Abbrechen",
    confirmReject: "Antrag ablehnen",
    rejecting: "Wird abgelehnt...",
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmReject(application.id, adminNotes.trim());
      onClose();
      setAdminNotes("");
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reject application.";
      setError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5DDD2] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-center justify-center text-[#DC2626] shrink-0">
              <AlertCircleIcon className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B18] leading-tight">
                {copy.title}
              </h3>
              <p className="text-xs text-[#7A6E62] mt-0.5">
                {application.caretakerName} — {application.daycareName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#E5DDD2]/40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm}>
          <div className="p-5 space-y-4">
            <p className="text-xs sm:text-sm text-[#5C4C3E] leading-relaxed">
              {copy.subtitle}
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="reject-notes-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4C3E]"
              >
                {copy.reasonLabel}
              </label>
              <textarea
                id="reject-notes-input"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={copy.reasonPlaceholder}
                className="w-full p-3 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold">
                {error}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#5C4C3E] transition-colors cursor-pointer min-h-[40px]"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{copy.rejecting}</span>
                </>
              ) : (
                <span>{copy.confirmReject}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
