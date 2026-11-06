"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem } from "../../../types/caretakerDashboard";

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking: (booking: BookingItem) => void;
}

export function AddBookingModal({ isOpen, onClose, onAddBooking }: AddBookingModalProps) {
  const { t, language } = useLanguage();
  const m = t.caretakerDashboard.modals.addBooking;

  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("2025-02-15");
  const [placementStart, setPlacementStart] = useState("2027-08-01");
  const [transitionDate, setTransitionDate] = useState("2029-06-30");
  const [dailyHours, setDailyHours] = useState("07:30 – 15:30");
  const [parentNames, setParentNames] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    const newBooking: BookingItem = {
      id: `booking-${Date.now()}`,
      childName: childName.trim(),
      childAge: `1.5 yrs (${childDob.slice(0, 7)})`,
      childAgeDe: `1,5 J. (${childDob.slice(0, 7)})`,
      placementStart: placementStart,
      placementStartDe: placementStart,
      kindergartenTransition: transitionDate,
      kindergartenTransitionDe: transitionDate,
      period: `${placementStart.slice(0, 7)} – ${transitionDate.slice(0, 7)}`,
      periodDe: `${placementStart.slice(0, 7)} – ${transitionDate.slice(0, 7)}`,
      startMonthIndex: 12, // Future or customized
      endMonthIndex: 21,
      dailyHours: `Mon – Fri • ${dailyHours}`,
      dailyHoursDe: `Mo. – Fr. • ${dailyHours} Uhr`,
      parentContact: {
        parents: parentNames.trim() || (language === "de" ? "Familie Schmidt" : "Schmidt Family"),
        phone: parentPhone.trim() || "+49 30 12345678",
        email: parentEmail.trim() || "family@example.de",
      },
      category: "future",
      isExtendingRight: true,
    };

    onAddBooking(newBooking);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-lg p-6 sm:p-7 max-h-[92vh] overflow-y-auto text-[#101828]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
          <div>
            <h2 id="add-booking-title" className="text-lg sm:text-xl font-bold text-[#101828]">
              {m.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-0.5">{m.subtitle}</p>
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

        {/* Success Alert */}
        {successToast && (
          <div className="mt-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{m.success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.childName} <span className="text-[#D92D20]">*</span>
            </label>
            <input
              type="text"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder={m.childNamePlaceholder}
              className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.childDob}
              </label>
              <input
                type="date"
                value={childDob}
                onChange={(e) => setChildDob(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.dailyHours}
              </label>
              <input
                type="text"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                placeholder={m.dailyHoursPlaceholder}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.placementStart}
              </label>
              <input
                type="date"
                value={placementStart}
                onChange={(e) => setPlacementStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.transitionDate}
              </label>
              <input
                type="date"
                value={transitionDate}
                onChange={(e) => setTransitionDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.parentNames}
            </label>
            <input
              type="text"
              value={parentNames}
              onChange={(e) => setParentNames(e.target.value)}
              placeholder={m.parentNamesPlaceholder}
              className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.parentPhone}
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder={m.parentPhonePlaceholder}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.parentEmail}
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder={m.parentEmailPlaceholder}
                className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={m.notesPlaceholder}
              className="w-full p-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAECF0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-all min-h-[42px] cursor-pointer"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-all shadow-xs min-h-[42px] cursor-pointer"
            >
              {m.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
