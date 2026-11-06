"use client";

import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

interface WorkPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkPermitModal({ isOpen, onClose }: WorkPermitModalProps) {
  const { t, language } = useLanguage();
  const m = t.caretakerDashboard.modals.permit;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-xl max-w-lg w-full p-6 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0">
              <svg className="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2
                id="permit-modal-title"
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
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Verification Status Pill */}
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-xs font-bold text-[#15803D]">
              {language === "de" ? "Amtlich verifiziert & aktuell" : "Officially Verified & Active"}
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#15803D] border border-[#BBF7D0]">
            #DE-84920-BER
          </span>
        </div>

        {/* Certificate Details Matrix */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7]">
            <span className="text-[#667085] font-medium">{m.permitNumber}</span>
            <span className="font-bold text-[#101828] font-mono">DE-84920-BER-2024</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7]">
            <span className="text-[#667085] font-medium">{m.authority}</span>
            <span className="font-semibold text-[#101828]">{m.authorityVal}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7]">
            <span className="text-[#667085] font-medium">{m.maxCapacity}</span>
            <span className="font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded-md">
              {m.maxCapacityVal}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7]">
            <span className="text-[#667085] font-medium">{m.insurance}</span>
            <span className="font-semibold text-[#101828] text-right">{m.insuranceVal}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7]">
            <span className="text-[#667085] font-medium">{m.firstAid}</span>
            <span className="font-semibold text-[#101828] text-right">{m.firstAidVal}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#667085] font-medium">{m.validUntil}</span>
            <span className="font-bold text-[#101828]">{m.validUntilVal}</span>
          </div>
        </div>

        {/* Legal Disclaimer & Footer */}
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE3D7] text-[11px] text-[#7A6E62] leading-relaxed">
          {language === "de"
            ? "Diese Pflegeerlaubnis berechtigt zur Kindertagespflege im Land Berlin gemäß § 43 Achtes Buch Sozialgesetzbuch (SGB VIII) und wird alle 5 Jahre amtlich rezertifiziert."
            : "This child care permit authorizes formal daycare operations in Berlin under § 43 German Social Code (SGB VIII), recertified every 5 years by the Youth Welfare Office."}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
          >
            {m.close}
          </button>
        </div>
      </div>
    </div>
  );
}
