import React, { useState, useEffect } from "react";
import { AdminContactMessage } from "../../types/admin";
import { adminContactService } from "../../services/adminContactService";
import { useLanguage } from "../../context/LanguageContext";
import {
  CloseIcon,
  SendIcon,
  MailIcon,
  ReplyIcon,
} from "../icons/AdminIcons";

interface ReplyContactModalProps {
  isOpen: boolean;
  message: AdminContactMessage | null;
  onClose: () => void;
  onSuccess: (updatedMessage: AdminContactMessage, recipientEmail: string) => void;
}

export function ReplyContactModal({
  isOpen,
  message,
  onClose,
  onSuccess,
}: ReplyContactModalProps) {
  const { t } = useLanguage();
  const cT = t.admin.contactMessages;

  const [subject, setSubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  // Initialize or reset form whenever target message changes
  useEffect(() => {
    if (message) {
      const defaultSub = message.subject.toLowerCase().startsWith("re:")
        ? message.subject
        : `Re: ${message.subject}`;
      setSubject(defaultSub);
      setReplyMessage("");
      setError(null);
      setShowOriginal(true);
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError(cT.replySubjectRequired || "Subject is required.");
      return;
    }
    if (!replyMessage.trim()) {
      setError(cT.replyMessageRequired || "Reply message cannot be empty.");
      return;
    }

    setIsSending(true);
    try {
      const res = await adminContactService.sendReply(
        message._id,
        subject.trim(),
        replyMessage.trim()
      );
      onSuccess(res.message, message.email);
      onClose();
    } catch (err: any) {
      console.error("Failed to send reply email:", err);
      setError(err.message || cT.replyErrorToast || "Failed to send email reply.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reply-modal-title"
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl border border-[#E5DDD2] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#F0EBE1] bg-[#FAF8F5]/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-[#A12D3A] flex items-center justify-center shrink-0">
              <ReplyIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="reply-modal-title"
                className="text-base sm:text-lg font-bold text-[#1E1B18] tracking-tight leading-tight truncate"
                style={{ fontFamily: "var(--font-plus-jakarta)" }}
              >
                {cT.replyModalTitle}
              </h2>
              <p className="text-xs text-[#7A6E62] mt-0.5 truncate">
                {cT.replyModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:bg-[#F0EBE1] hover:text-[#1E1B18] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" noValidate>
          <div className="p-4 sm:p-6 space-y-4 flex-1">
            {/* Recipient Display Pill */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#9E9080] mb-1.5">
                {cT.replyRecipientLabel}
              </span>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DDD2] text-xs sm:text-sm">
                <div className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#A12D3A] font-bold text-xs flex items-center justify-center shrink-0">
                  <MailIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-[#1E1B18] truncate">{message.fullName}</span>
                  <span className="text-[#7A6E62] truncate">&lt;{message.email}&gt;</span>
                </div>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label
                htmlFor="reply-subject"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#9E9080] mb-1.5"
              >
                {cT.replySubjectLabel} <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="reply-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={cT.replySubjectPlaceholder}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-xs sm:text-sm text-[#1E1B18] placeholder:text-[#9E9080] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>

            {/* Original Message Accordion Quote */}
            <div className="rounded-xl border border-[#E5DDD2] bg-[#FAF8F5] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-[#6E645A] hover:bg-[#F3ECE2] transition-colors cursor-pointer"
              >
                <span>{cT.replyOriginalMessage}: &ldquo;{message.subject}&rdquo;</span>
                <span className="text-[11px] text-[#A12D3A] font-bold">
                  {showOriginal ? "Hide ▲" : "Show ▼"}
                </span>
              </button>
              {showOriginal && (
                <div className="px-3.5 pb-3 pt-1 text-xs text-[#5C5043] leading-relaxed border-t border-[#F0EBE1] whitespace-pre-wrap max-h-36 overflow-y-auto italic bg-white/70">
                  {message.message}
                </div>
              )}
            </div>

            {/* Reply Message Textarea */}
            <div>
              <label
                htmlFor="reply-body"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#9E9080] mb-1.5"
              >
                {cT.replyMessageLabel} <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="reply-body"
                rows={6}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={cT.replyMessagePlaceholder}
                className="w-full min-h-[140px] p-3.5 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-xs sm:text-sm text-[#1E1B18] placeholder:text-[#9E9080] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all leading-relaxed resize-y"
              />
            </div>

            {/* Error Message Alert */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#A12D3A] text-xs font-medium flex items-center gap-2 animate-in fade-in"
              >
                <svg
                  className="w-4 h-4 shrink-0 text-[#A12D3A]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Modal Footer with Actions */}
          <div className="p-4 sm:p-5 border-t border-[#F0EBE1] bg-[#FAF8F5]/80 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 min-h-[44px] rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#F3ECE2] text-xs sm:text-sm font-semibold text-[#423223] transition-colors cursor-pointer"
            >
              {cT.replyCancelBtn}
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 min-h-[44px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] disabled:opacity-70 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{cT.sendingReplyBtn}</span>
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4 text-white" />
                  <span>{cT.sendReplyBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
