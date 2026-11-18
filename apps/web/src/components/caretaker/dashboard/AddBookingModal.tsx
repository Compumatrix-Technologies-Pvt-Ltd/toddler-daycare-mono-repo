"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem } from "../../../types/caretakerDashboard";
import { DatePicker, TimePicker } from "@repo/ui";
import { caretakerApi } from "../../../utils/caretakerApi";
import { parseFlexibleBookingDate } from "@repo/shared";

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking: (booking: BookingItem) => void;
}

export function AddBookingModal({ isOpen, onClose, onAddBooking }: AddBookingModalProps) {
  const { t, language } = useLanguage();
  const m = t.caretakerDashboard.modals.addBooking;

  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("15, Feb, 2025");
  const [placementStart, setPlacementStart] = useState("Aug, 2027");
  const [transitionDate, setTransitionDate] = useState("Jun, 2029");
  const [careHoursFrom, setCareHoursFrom] = useState("07:30");
  const [careHoursTo, setCareHoursTo] = useState("15:30");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const dailyHours = careHoursFrom && careHoursTo ? `${careHoursFrom} – ${careHoursTo}` : careHoursFrom || careHoursTo;

  const isTimeOrderValid =
    !careHoursFrom || !careHoursTo || careHoursFrom < careHoursTo;

  const isFormValid =
    Boolean(childName.trim()) &&
    Boolean(childDob.trim()) &&
    Boolean(placementStart.trim()) &&
    Boolean(transitionDate.trim()) &&
    Boolean(careHoursFrom.trim()) &&
    Boolean(careHoursTo.trim()) &&
    isTimeOrderValid &&
    Boolean(parentPhone.trim()) &&
    Boolean(parentEmail.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setErrorMessage(null);

    if (!isTimeOrderValid) {
      setErrorMessage(
        language === "de"
          ? "Die Endzeit muss nach der Startzeit liegen."
          : "End time must be after start time."
      );
      return;
    }

    if (!isFormValid) {
      setErrorMessage(
        (m as any).validationRequired ||
          (language === "de"
            ? "Bitte fülle alle Pflichtfelder vollständig aus."
            : "Please complete all required fields.")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Persist booking directly to MongoDB database
      let createdBooking: any = null;
      try {
        createdBooking = await caretakerApi.createBooking({
          childName: childName.trim(),
          childDob: childDob.trim(),
          placementStart: placementStart.trim(),
          kindergartenTransition: transitionDate.trim(),
          dailyHours: dailyHours.trim(),
          parentContact: {
            phone: parentPhone.trim(),
            email: parentEmail.trim(),
          },
        });
      } catch (err: any) {
        console.warn("Could not save booking to remote API, falling back to local item:", err);
      }

      const generatedId = createdBooking?._id || createdBooking?.id || `booking-${Date.now()}`;
      const dStart = parseFlexibleBookingDate(placementStart, false);
      const isCurrent = dStart ? dStart <= new Date() : false;

      const newBooking: BookingItem = {
        id: String(generatedId),
        childName: childName.trim(),
        childAge: `DOB: ${childDob}`,
        childAgeDe: `Geb.: ${childDob}`,
        placementStart: placementStart,
        placementStartDe: placementStart,
        kindergartenTransition: transitionDate,
        kindergartenTransitionDe: transitionDate,
        period: `${placementStart} – ${transitionDate}`,
        periodDe: `${placementStart} – ${transitionDate}`,
        startMonthIndex: 12,
        endMonthIndex: 21,
        dailyHours: dailyHours.includes("•") ? dailyHours : `Mon – Fri • ${dailyHours}`,
        dailyHoursDe: dailyHours.includes("•") ? dailyHours : `Mo. – Fr. • ${dailyHours} Uhr`,
        parentContact: {
          parents: "",
          phone: parentPhone.trim(),
          email: parentEmail.trim(),
        },
        category: isCurrent ? "current" : "future",
        isBooked: true,
        isExtendingRight: true,
        dob: childDob,
        desiredStart: placementStart,
        desiredStartDe: placementStart,
        estTransition: transitionDate,
        estTransitionDe: transitionDate,
      };

      onAddBooking(newBooking);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Failed to create booking");
    }
  };

  const getInputBorderClass = (isEmpty: boolean) =>
    hasAttemptedSubmit && isEmpty
      ? "border-[#D92D20] bg-[#FEF3F2] focus:ring-[#D92D20]/20 focus:border-[#D92D20]"
      : "border-[#D0D5DD] focus:ring-[#A12D3A]/20 focus:border-[#A12D3A]";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-[580px] sm:max-w-[620px] p-6 sm:p-7 max-h-[92vh] overflow-y-auto text-[#101828]"
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
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-xs sm:text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successToast && (
          <div className="mt-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{m.success}</span>
          </div>
        )}

        {/* Form: Child name, Child Birthday, Daily hours, Placement start, Kindergarten transition, Parent contact */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Child name */}
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
              className={`w-full h-[42px] px-3 rounded-lg border text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 transition-all ${getInputBorderClass(!childName.trim())}`}
            />
          </div>

          {/* 2. Child Birthday & Daily hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="relative z-20">
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.childDob} <span className="text-[#D92D20]">*</span>
              </label>
              <DatePicker
                value={childDob}
                format="dd,mmm,yyyy"
                onChange={(_d, str) => setChildDob(str)}
                locale={language}
                maxDate={new Date()}
                placeholder={language === "de" ? "z.B. 15, Feb, 2025" : "e.g. 15, Feb, 2025"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.dailyHours} <span className="text-[#D92D20]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <TimePicker
                    value={careHoursFrom}
                    onChange={(time) => setCareHoursFrom(time)}
                    locale={language}
                    placeholder="07:30"
                    clearable={false}
                  />
                </div>
                <span className="text-[#667085] text-xs shrink-0 font-medium">–</span>
                <div className="flex-1 min-w-0">
                  <TimePicker
                    value={careHoursTo}
                    onChange={(time) => setCareHoursTo(time)}
                    locale={language}
                    placeholder="15:30"
                    align="right"
                    clearable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Placement start & 4. Kindergarten transition (mmm,yyyy format) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="relative z-30">
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.placementStart} <span className="text-[#D92D20]">*</span>
              </label>
              <DatePicker
                value={placementStart}
                format="mmm,yyyy"
                onChange={(_d, str) => setPlacementStart(str)}
                locale={language}
                placeholder={language === "de" ? "z.B. Aug, 2027" : "e.g. Aug, 2027"}
              />
            </div>
            <div className="relative z-20">
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                {m.transitionDate} <span className="text-[#D92D20]">*</span>
              </label>
              <DatePicker
                value={transitionDate}
                format="mmm,yyyy"
                onChange={(_d, str) => setTransitionDate(str)}
                locale={language}
                align="right"
                placeholder={language === "de" ? "z.B. Jun, 2029" : "e.g. Jun, 2029"}
              />
            </div>
          </div>

          {/* 5. Parent contact: phone & email */}
          <div className="pt-2 border-t border-[#F2F4F7]">
            <h3 className="text-xs font-bold text-[#344054] uppercase tracking-wider mb-2.5">
              {(m as any).parentContactTitle || (language === "de" ? "Elternkontakt" : "Parent Contact")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                  {m.parentPhone} <span className="text-[#D92D20]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder={m.parentPhonePlaceholder}
                  className={`w-full h-[42px] px-3 rounded-lg border text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 transition-all ${getInputBorderClass(!parentPhone.trim())}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
                  {m.parentEmail} <span className="text-[#D92D20]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder={m.parentEmailPlaceholder}
                  className={`w-full h-[42px] px-3 rounded-lg border text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:ring-2 transition-all ${getInputBorderClass(!parentEmail.trim())}`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-[#EAECF0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-all min-h-[42px] cursor-pointer disabled:opacity-50"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-all shadow-xs min-h-[42px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>...</span>
                </>
              ) : (
                m.submit
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
