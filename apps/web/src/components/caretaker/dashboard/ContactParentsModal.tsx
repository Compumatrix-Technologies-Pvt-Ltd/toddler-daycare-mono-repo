"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem } from "../../../types/caretakerDashboard";

interface ContactParentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookingItem | null;
}

export function ContactParentsModal({ isOpen, onClose, item }: ContactParentsModalProps) {
  const { t } = useLanguage();
  const m = t.caretakerDashboard.modals.contactParents;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage("");
      setSubject("");
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-parents-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto text-[#101828]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
          <div>
            <h2 id="contact-parents-title" className="text-lg font-bold text-[#101828]">
              {m.title}
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              {m.to}: <span className="font-semibold text-[#101828]">{item.parentContact.parents}</span> (
              {item.childName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.caretakerDashboard.details.close}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sentSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{m.success}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-[#FAFBFC] border border-[#EAECF0] text-xs text-[#475467] space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${item.parentContact.email}`} className="text-[#175CD3] hover:underline font-medium">
                {item.parentContact.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#667085]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${item.parentContact.phone}`} className="text-[#344054] hover:underline font-medium">
                {item.parentContact.phone}
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.subject}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={m.subjectPlaceholder}
              className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.message} <span className="text-[#D92D20]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={m.messagePlaceholder}
              className="w-full p-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-all cursor-pointer"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>{m.send}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
