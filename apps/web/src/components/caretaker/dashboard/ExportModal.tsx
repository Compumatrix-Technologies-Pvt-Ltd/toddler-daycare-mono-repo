"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem } from "../../../types/caretakerDashboard";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingItem[];
}

export function ExportModal({ isOpen, onClose, bookings }: ExportModalProps) {
  const { t } = useLanguage();
  const m = t.caretakerDashboard.modals.export;
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    setDownloading("csv");
    const headers = "Child,Category,Period,Start,Transition,Daily Hours,Parents,Phone,Email\n";
    const rows = bookings
      .map(
        (b) =>
          `"${b.childName}","${b.category}","${b.period}","${b.placementStart}","${b.kindergartenTransition}","${b.dailyHours}","${b.parentContact.parents}","${b.parentContact.phone}","${b.parentContact.email}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daycare_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setDownloading(null);
      onClose();
    }, 600);
  };

  const handleExportPdf = () => {
    setDownloading("pdf");
    window.print();
    setDownloading(null);
    onClose();
  };

  const handleExportIcs = () => {
    setDownloading("ics");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kindertagespflege Finden//Toddler Daycare//EN",
      ...bookings.map(
        (b) =>
          `BEGIN:VEVENT\nSUMMARY:Daycare Placement: ${b.childName}\nDESCRIPTION:Parents: ${b.parentContact.parents} (${b.parentContact.phone})\nSTATUS:CONFIRMED\nEND:VEVENT`
      ),
      "END:VCALENDAR",
    ].join("\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daycare_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setDownloading(null);
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-md p-6 max-h-[92vh] overflow-y-auto text-[#101828]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
          <div>
            <h2 id="export-modal-title" className="text-lg font-bold text-[#101828]">
              {m.title}
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">{m.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.close}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* CSV Option */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={downloading !== null}
            className="w-full text-left p-3.5 rounded-xl border border-[#EAECF0] hover:border-[#101828] hover:bg-[#F8FAFC] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EFF8FF] text-[#175CD3] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#101828]">{m.csvTitle}</div>
                <div className="text-xs text-[#667085] leading-relaxed">{m.csvDesc}</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#175CD3] group-hover:translate-x-0.5 transition-transform">
              ↓
            </span>
          </button>

          {/* PDF Option */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={downloading !== null}
            className="w-full text-left p-3.5 rounded-xl border border-[#EAECF0] hover:border-[#101828] hover:bg-[#F8FAFC] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FEF3F2] text-[#B42318] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#101828]">{m.pdfTitle}</div>
                <div className="text-xs text-[#667085] leading-relaxed">{m.pdfDesc}</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#B42318] group-hover:translate-x-0.5 transition-transform">
              ↓
            </span>
          </button>

          {/* iCal Option */}
          <button
            type="button"
            onClick={handleExportIcs}
            disabled={downloading !== null}
            className="w-full text-left p-3.5 rounded-xl border border-[#EAECF0] hover:border-[#101828] hover:bg-[#F8FAFC] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F4F3FF] text-[#5925DC] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#101828]">{m.icalTitle}</div>
                <div className="text-xs text-[#667085] leading-relaxed">{m.icalDesc}</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#5925DC] group-hover:translate-x-0.5 transition-transform">
              ↓
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
