"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

interface FilterModalProps {
  onClose: () => void;
}

export function FilterModal({ onClose }: FilterModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E7DDD0] relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h4 className="font-bold text-lg text-[#1E1B18] mb-4">
          {t.modals.filter.title}
        </h4>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#4E443B] mb-2">
              {t.modals.filter.maxDistance}
            </label>
            <div className="flex gap-2">
              {["1 km", "2 km", "5 km", "10 km"].map((dist, i) => (
                <button
                  key={i}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    i === 1
                      ? "bg-[#A12D3A] text-white border-[#A12D3A]"
                      : "border-[#D5C9B8] text-[#4E443B] hover:bg-[#F7F4EE]"
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4E443B] mb-2">
              {t.modals.filter.dietAndPerks}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#A12D3A] rounded w-4 h-4"
                />
                <span className="text-[#3E342B] text-xs">
                  {t.modals.filter.perks.bio}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#A12D3A] rounded w-4 h-4"
                />
                <span className="text-[#3E342B] text-xs">
                  {t.modals.filter.perks.pets}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#A12D3A] rounded w-4 h-4"
                />
                <span className="text-[#3E342B] text-xs">
                  {t.modals.filter.perks.garden}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#A12D3A] rounded w-4 h-4"
                />
                <span className="text-[#3E342B] text-xs">
                  {t.modals.filter.perks.bilingual}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#D5C9B8] text-sm font-semibold text-[#4E443B] rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            {t.modals.filter.reset}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#A12D3A] hover:bg-[#88222E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            {t.modals.filter.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
