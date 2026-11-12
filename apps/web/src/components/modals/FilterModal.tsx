"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { FilterState } from "../../types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  totalMatchesCount?: number;
}

const YEAR_OPTIONS = ["2026", "2027", "2028"];
const RADIUS_PRESETS = [1, 2, 3, 5, 10];

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  totalMatchesCount,
}: FilterModalProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<FilterState>(filters);

  // Sync draft whenever modal opens or filters change
  useEffect(() => {
    setDraft(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#E7DDD0] relative my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#F0E8DC] shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#1E1B18] leading-tight">
              {t.modals.filter.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#7A6E62] mt-0.5">
              {t.modals.filter.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 sm:space-y-5 pr-1">
          {/* 1. Catchment Radius */}
          <div className="space-y-2 p-3 sm:p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1B18] flex items-center gap-1.5">
                <span className="text-[#A12D3A]">📍</span>
                <span>{t.modals.filter.radius}</span>
              </label>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#A12D3A] text-white text-xs font-bold shadow-2xs">
                {draft.radiusKm} km
              </span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={draft.radiusKm}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  radiusKm: parseFloat(e.target.value) || 3,
                }))
              }
              className="w-full accent-[#A12D3A] cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, radiusKm: preset }))}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    draft.radiusKm === preset
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                      : "bg-white text-[#5C4C3E] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>
          </div>

          {/* 2. Number of Children */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.numberOfChildren}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { val: "", label: t.modals.filter.anyChildren || "Any" },
                { val: "1", label: t.search.children.one },
                { val: "2", label: t.search.children.two },
                { val: "3", label: t.search.children.threePlus },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, childrenCount: opt.val }))}
                  className={`py-2 px-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[38px] truncate ${
                    draft.childrenCount === opt.val
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                      : "bg-white text-[#4E443B] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Start Month & Year + Tolerance */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.startMonthYear}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={draft.startMonth}
                onChange={(e) => setDraft((prev) => ({ ...prev, startMonth: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] bg-white text-xs font-semibold text-[#1E1B18] shadow-2xs"
              >
                <option value="">{t.search.anyMonth || "Any month"}</option>
                {t.search.months.map((m, idx) => (
                  <option key={idx} value={String(idx)}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={draft.startYear}
                onChange={(e) => setDraft((prev) => ({ ...prev, startYear: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] bg-white text-xs font-semibold text-[#1E1B18] shadow-2xs"
              >
                <option value="">{t.search.anyYear || "Any year"}</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Tolerance Buttons */}
            <div>
              <div className="text-[11px] font-semibold text-[#7A6E62] mb-1">
                {t.modals.filter.monthTolerance}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { tol: 0, label: t.modals.filter.tolerances.exact },
                  { tol: 1, label: t.modals.filter.tolerances.oneMonth },
                  { tol: 2, label: t.modals.filter.tolerances.twoMonths },
                  { tol: 3, label: t.modals.filter.tolerances.threeMonths },
                ].map((item) => (
                  <button
                    key={item.tol}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, monthTolerance: item.tol }))}
                    className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold text-center transition-all cursor-pointer whitespace-nowrap ${
                      draft.monthTolerance === item.tol
                        ? "bg-[#1E1B18] text-white border-[#1E1B18] shadow-2xs"
                        : "bg-[#FAF7F2] text-[#5C4C3E] border-[#E5DDD2] hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Opening Hours (From / Until) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.openingHours}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#7A6E62] block mb-0.5">
                  {t.modals.filter.from}
                </span>
                <input
                  type="time"
                  value={draft.openingFrom}
                  onChange={(e) => setDraft((prev) => ({ ...prev, openingFrom: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] bg-white text-xs font-semibold text-[#1E1B18] shadow-2xs"
                  placeholder={t.modals.filter.hoursPlaceholderFrom}
                />
              </div>
              <div>
                <span className="text-[10px] text-[#7A6E62] block mb-0.5">
                  {t.modals.filter.until}
                </span>
                <input
                  type="time"
                  value={draft.openingUntil}
                  onChange={(e) => setDraft((prev) => ({ ...prev, openingUntil: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] bg-white text-xs font-semibold text-[#1E1B18] shadow-2xs"
                  placeholder={t.modals.filter.hoursPlaceholderUntil}
                />
              </div>
            </div>
          </div>

          {/* 5. Caretaker Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.caretakerGender}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: "all", label: t.modals.filter.genderOptions.all },
                { val: "female", label: `👩 ${t.modals.filter.genderOptions.female}` },
                { val: "male", label: `👨 ${t.modals.filter.genderOptions.male}` },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      caretakerGender: opt.val as any,
                    }))
                  }
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                    draft.caretakerGender === opt.val
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                      : "bg-white text-[#4E443B] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Food Preference */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.foodPreference}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: "any", label: t.modals.filter.foodOptions.any },
                { val: "self-cooked", label: `🍲 ${t.modals.filter.foodOptions.selfCooked}` },
                { val: "delivered", label: `📦 ${t.modals.filter.foodOptions.delivered}` },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      foodPreference: opt.val as any,
                    }))
                  }
                  className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[38px] truncate ${
                    draft.foodPreference === opt.val
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                      : "bg-white text-[#4E443B] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Pets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.modals.filter.pets}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: "any", label: t.modals.filter.petsOptions.any },
                { val: "allowed", label: `🐕 ${t.modals.filter.petsOptions.allowed}` },
                { val: "not-allowed", label: `🚫 ${t.modals.filter.petsOptions.notAllowed}` },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      pets: opt.val as any,
                    }))
                  }
                  className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[38px] truncate ${
                    draft.pets === opt.val
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                      : "bg-white text-[#4E443B] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-[#F0E8DC] shrink-0 bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] transition-colors cursor-pointer min-h-[42px]"
          >
            {t.modals.filter.reset}
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-5 py-2.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
          >
            <span>
              {totalMatchesCount !== undefined
                ? t.modals.filter.matchingDaycares.replace("{count}", String(totalMatchesCount))
                : t.modals.filter.apply}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
