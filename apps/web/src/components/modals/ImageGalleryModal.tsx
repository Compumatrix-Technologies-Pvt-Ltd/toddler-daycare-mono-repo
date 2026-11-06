"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Kita } from "../../types";
import { useLanguage } from "../../i18n/LanguageContext";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  kita: Kita;
  initialIndex?: number;
  onOpenInquiry?: () => void;
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  kita,
  initialIndex = 0,
  onOpenInquiry,
}: ImageGalleryModalProps) {
  const { t } = useLanguage();
  const photos =
    kita.photos && kita.photos.length > 0
      ? kita.photos
      : [kita.image, "/assets/toys.png", "/assets/playground.png"];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen) return null;

  const currentPhotoText = t.gallery.photoOf
    .replace("{current}", (currentIndex + 1).toString())
    .replace("{total}", photos.length.toString());

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${kita.name} ${t.gallery.title}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between text-white pb-3 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 36 36"
              className="w-6 h-6 text-[#EAA000]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="18" r="9" fill="#FBBF24" />
              <path
                d="M18 3v4M18 29v4M3 18h4M29 18h4M7.4 7.4l2.8 2.8M25.8 25.8l2.8 2.8M7.4 28.6l2.8-2.8M25.8 10.2l2.8-2.8"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg leading-tight font-heading">
              {kita.name}
            </h3>
            <p className="text-xs text-white/70">{kita.location}</p>
          </div>
        </div>

        {/* Counter & Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <span className="text-xs sm:text-sm font-medium text-white/80 bg-white/10 px-3 py-1 rounded-full">
            {currentPhotoText}
          </span>

          {onOpenInquiry && (
            <button
              onClick={() => {
                onClose();
                onOpenInquiry();
              }}
              className="hidden sm:inline-flex bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors min-h-[38px] items-center"
            >
              {t.card.sendInquiry}
            </button>
          )}

          {/* Close button (44x44 safe touch area) */}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] active:scale-95"
            aria-label={t.gallery.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center py-2 sm:py-4 min-h-0">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-1 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 border border-white/10 shadow-lg min-w-[44px] min-h-[44px]"
          aria-label={t.gallery.prevPhoto}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Main Display Image */}
        <div className="relative w-full h-full max-w-4xl max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          <Image
            src={photos[currentIndex]}
            alt={`${kita.name} - ${currentPhotoText}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-1 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 border border-white/10 shadow-lg min-w-[44px] min-h-[44px]"
          aria-label={t.gallery.nextPhoto}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="pt-2 sm:pt-3 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none max-w-xl mx-auto">
          {photos.map((photo, index) => {
            const isSelected = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 transition-all ${
                  isSelected
                    ? "ring-2 ring-[#F3A712] scale-105 shadow-md"
                    : "opacity-60 hover:opacity-100 hover:scale-100"
                }`}
                aria-label={`${t.gallery.photoOf.replace("{current}", (index + 1).toString()).replace("{total}", photos.length.toString())}`}
              >
                <Image
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
