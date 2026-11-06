"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { BookingItem } from "../../../types/caretakerDashboard";

interface ManageSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookingItem | null;
  onUpdateItem: (updated: BookingItem) => void;
  onReleaseItem: (id: string) => void;
}

export function ManageSlotModal({
  isOpen,
  onClose,
  item,
  onUpdateItem,
  onReleaseItem,
}: ManageSlotModalProps) {
  const { t, language } = useLanguage();
  const m = t.caretakerDashboard.modals.manageSlot;

  const [transitionDate, setTransitionDate] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [status, setStatus] = useState("active");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTransitionDate(item.kindergartenTransition);
      setDailyHours(item.dailyHours);
      setStatus(item.category === "current" ? "active" : "transitioning");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BookingItem = {
      ...item,
      kindergartenTransition: transitionDate,
      kindergartenTransitionDe: transitionDate,
      dailyHours: dailyHours,
      dailyHoursDe: dailyHours,
      category: status === "completed" ? "current" : item.category,
    };
    onUpdateItem(updated);
    setToastMsg(m.success);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 800);
  };

  const handleRelease = () => {
    onReleaseItem(item.id);
    setToastMsg(m.releasedSuccess);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-slot-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-md p-6 max-h-[92vh] overflow-y-auto text-[#101828]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
          <div>
            <h2 id="manage-slot-title" className="text-lg font-bold text-[#101828]">
              {m.title}
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              {m.child}: <span className="font-semibold text-[#101828]">{item.childName}</span>
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

        {toastMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.status}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
            >
              <option value="active">{m.statusActive}</option>
              <option value="transitioning">{m.statusTransitioning}</option>
              <option value="completed">{m.statusCompleted}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5 uppercase tracking-wide">
              {m.transitionDate}
            </label>
            <input
              type="text"
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
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
              className="w-full h-10 px-3 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
            />
          </div>

          <div className="pt-3 border-t border-[#EAECF0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRelease}
              className="w-full sm:w-auto text-xs font-semibold text-[#D92D20] hover:text-[#B42318] py-2 px-1 transition-colors cursor-pointer"
            >
              {m.releaseSlot}
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-all cursor-pointer"
              >
                {m.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {m.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
