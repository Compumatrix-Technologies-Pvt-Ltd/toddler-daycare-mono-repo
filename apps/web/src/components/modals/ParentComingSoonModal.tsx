"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../i18n/LanguageContext";

interface ParentComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParentComingSoonModal({
  isOpen,
  onClose,
}: ParentComingSoonModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-modal-title"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E7DDD0] relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-[#1E1B18]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - 44x44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center text-[#786C5E] hover:text-[#1E1B18] hover:bg-[#F3ECE2] transition-colors cursor-pointer"
          aria-label={t.nav.parentComingSoon.close}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header Icon & Tag */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF5E6] border border-[#FDE68A] flex items-center justify-center text-[#EAA000] shadow-xs">
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Family / Parent icon */}
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#A12D3A] text-white flex items-center justify-center shadow-xs">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            {t.nav.parentComingSoon.badge}
          </span>

          <h3
            id="parent-modal-title"
            className="text-xl sm:text-2xl font-bold text-[#1E1B18] tracking-tight mb-2"
          >
            {t.nav.parentComingSoon.title}
          </h3>

          <p className="text-sm text-[#6B5E51] leading-relaxed mb-6">
            {t.nav.parentComingSoon.description}
          </p>
        </div>

        {/* Feature Highlights Card */}
        <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#EBE3D7] mb-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8A775C]">
            {t.nav.parentComingSoon.featuresTitle}
          </div>

          <div className="space-y-2.5 text-xs sm:text-[13px] text-[#423223]">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="leading-snug">
                {t.nav.parentComingSoon.feature1}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="leading-snug">
                {t.nav.parentComingSoon.feature2}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="leading-snug">
                {t.nav.parentComingSoon.feature3}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full min-h-[46px] py-2.5 px-5 bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center cursor-pointer text-sm"
        >
          {t.nav.parentComingSoon.notifyMe}
        </button>
      </div>
    </div>,
    document.body
  );
}
