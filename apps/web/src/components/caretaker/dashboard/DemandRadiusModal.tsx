"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

interface DemandRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRadius: number;
  onUpdateRadius: (newRadius: number) => void;
}

export function DemandRadiusModal({
  isOpen,
  onClose,
  currentRadius,
  onUpdateRadius,
}: DemandRadiusModalProps) {
  const { t, language } = useLanguage();
  const m = t.caretakerDashboard.modals.radius;

  const [radiusValue, setRadiusValue] = useState(currentRadius);

  if (!isOpen) return null;

  // Approximate inquiry simulation based on catchment area (π * r²)
  const simulatedLeads = Math.round(radiusValue * 4);

  const handleApply = () => {
    onUpdateRadius(radiusValue);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="radius-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-xl max-w-lg w-full p-4 sm:p-7 space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF] flex items-center justify-center text-[#175CD3] shrink-0">
              <svg className="w-5 h-5 text-[#175CD3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h2
                id="radius-modal-title"
                className="text-lg font-bold text-[#101828]"
                style={{ fontFamily: "var(--font-plus-jakarta, sans-serif)" }}
              >
                {m.title}
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">{m.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.close}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Radius Visual Slider */}
        <div className="space-y-4 bg-[#FAFBFC] p-4 rounded-xl border border-[#EAECF0]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#344054]">{m.radiusLabel}</span>
            <span className="text-sm font-bold text-[#175CD3] bg-[#EFF8FF] px-2.5 py-1 rounded-md border border-[#B2DDFF]">
              {m.radiusUnit.replace("{km}", String(radiusValue))}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={radiusValue}
            onChange={(e) => setRadiusValue(parseFloat(e.target.value))}
            className="w-full accent-[#7C5800] cursor-pointer"
          />

          <div className="flex justify-between gap-1 text-[10px] sm:text-[11px] text-[#98A2B3] font-medium">
            <span>{m.hyperLocal || "1 km (Hyper-local)"}</span>
            <span>{m.standardUrban || "3 km (Standard Urban)"}</span>
            <span>5 km</span>
            <span>{m.metro || "10 km (Metro)"}</span>
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE3D7] flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[#7A6E62] uppercase tracking-wide">
              {m.projectedLeads}
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#101828] mt-1">
              ~{simulatedLeads} {language === "de" ? "Familien im Umkreis" : "Matching families"}
            </div>
          </div>
          <div className="w-12 h-12 shrink-0 rounded-full bg-white border border-[#E5DDD2] flex items-center justify-center text-[#7C5800] text-lg font-bold shadow-2xs">
            {simulatedLeads}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D0D5DD] hover:bg-[#F8FAFC] text-xs font-semibold text-[#344054] transition-all cursor-pointer min-h-[44px]"
          >
            {m.close}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            {m.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
