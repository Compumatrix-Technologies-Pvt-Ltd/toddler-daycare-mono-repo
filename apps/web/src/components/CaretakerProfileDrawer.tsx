"use client";

import React, { useState } from "react";
import { Kita } from "../types";
import { MapSection } from "./MapSection";
import { KitaDetail } from "./KitaDetail";
import { useLanguage } from "../i18n/LanguageContext";

interface CaretakerProfileDrawerProps {
  kita: Kita | null;
  allKitas?: Kita[];
  isOpen: boolean;
  onClose: () => void;
  onSelectKita?: (id: string) => void;
  onSendInquiry: (kita: Kita) => void;
  onOpenGallery?: (initialIndex?: number) => void;
}

export function CaretakerProfileDrawer({
  kita,
  allKitas,
  isOpen,
  onClose,
  onSelectKita,
  onSendInquiry,
  onOpenGallery,
}: CaretakerProfileDrawerProps) {
  const { t } = useLanguage();
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("Oct 1, 2026");

  if (!isOpen || !kita) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${kita.name} Caretaker Profile`}
    >
      {/* Right-Side Drawer Panel */}
      <div
        className="w-full max-w-[660px] h-full bg-white shadow-[-6px_0px_24px_rgba(0,0,0,0.18)] p-5 sm:p-7 md:p-8 flex flex-col gap-5 sm:gap-6 overflow-y-auto animate-in slide-in-from-right duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Back Action Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-[#F0EDED]">
          <button
            onClick={onClose}
            className="text-[#AE2F34] hover:text-[#88222E] font-medium text-base hover:underline flex items-center gap-2 cursor-pointer group py-1"
          >
            <span>{t.favorites.backToFavorites}</span>
          </button>

          {/* Close X Button for Accessibility */}
          <button
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4] transition-colors"
            aria-label="Close drawer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 1. Interactive MapSection from page.tsx */}
        <div className="shrink-0">
          <MapSection
            kitas={allKitas && allKitas.length > 0 ? allKitas : [kita]}
            activeKita={kita}
            onSelectKita={(id) => onSelectKita && onSelectKita(id)}
          />
        </div>

        {/* 2. Interactive KitaDetail Showcase from page.tsx */}
        <div className="pt-1">
          <KitaDetail
            kita={kita}
            selectedDateFilter={selectedDateFilter}
            onSelectDateFilter={setSelectedDateFilter}
            onOpenInquiry={() => onSendInquiry(kita)}
            onOpenGallery={onOpenGallery}
          />
        </div>
      </div>
    </div>
  );
}
