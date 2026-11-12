"use client";

import React from "react";
import Image from "next/image";
import { Kita } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

interface KitaCardProps {
  kita: Kita;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onOpenInquiry: (e: React.MouseEvent) => void;
  onOpenGallery?: (e: React.MouseEvent) => void;
  catchmentRadius?: number;
}

export function KitaCard({
  kita,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onOpenInquiry,
  onOpenGallery,
  catchmentRadius = 3,
}: KitaCardProps) {
  const { t } = useLanguage();

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all cursor-pointer border ${isSelected
          ? "border-2 border-[#A12D3A] bg-white shadow-xs"
          : "border border-[#E5DDD2] hover:border-[#D5C9B8] bg-white hover:shadow-xs"
        }`}
    >
      <div className="flex gap-3 sm:gap-3.5">
        {/* Thumbnail Image - click to open image modal */}
        <div
          onClick={(e) => {
            if (onOpenGallery) {
              e.stopPropagation();
              onOpenGallery(e);
            }
          }}
          className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-32 rounded-xl overflow-hidden bg-[#F3ECE2] shrink-0 cursor-pointer group/thumb"
          title={t.gallery.viewAllPhotos}
        >
          {kita.image ? (
            <Image
              src={kita.image}
              alt={kita.name}
              fill
              sizes="(max-width: 640px) 96px, 144px"
              unoptimized={true}
              className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7A6E62]">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-black/60 text-white rounded-full p-1.5 shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Info Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title and Favorite */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h2 className="font-bold text-[15px] sm:text-[17px] text-[#1E1B18] leading-tight truncate">
                {kita.name}
              </h2>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#7A6E62] mt-0.5">
                <svg
                  className="w-3.5 h-3.5 text-[#A12D3A] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate">{kita.location}</span>
              </div>
            </div>

            {/* Heart Icon Button */}
            <button
              onClick={onToggleFavorite}
              className="w-10 h-10 -mr-2 -mt-2 flex items-center justify-center rounded-full hover:bg-[#F3ECE2] transition-colors shrink-0"
              aria-label={
                isFavorite ? t.card.removeFavorite : t.card.saveFavorite
              }
            >
              <svg
                className={`w-5 h-5 transition-transform active:scale-125 ${isFavorite
                    ? "text-[#A12D3A] fill-[#A12D3A]"
                    : "text-[#A12D3A] hover:opacity-80"
                  }`}
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {/* Availability and Rating */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs flex-wrap my-1">
            <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              {kita.slots} {t.card.slotsAvailable}
            </span>
            <span className="text-[#C4B7A5]">•</span>
            <span className="bg-[#FEF3C7] text-[#78350F] font-bold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px]">
              {Number(kita.rating || 0).toFixed(1)} ★ ({Number(kita.reviewCount || 0)} {t.card.reviews})
            </span>
          </div>

          {/* Tag chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Catchment Radius Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-[#8A775C] bg-[#FAF7F2] border border-[#E5DDD2] px-2 py-0.5 rounded-md font-medium">
              <svg
                className="w-3 h-3 text-[#A12D3A] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>{t.card.reachRadius.replace("{radius}", String(catchmentRadius))}</span>
            </span>

            {kita.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-[#554A3D] bg-[#F7F4EE] border border-[#E9E2D8] px-2 py-0.5 rounded-md"
              >
                {tag.toLowerCase().includes("gekocht") ||
                  tag.toLowerCase().includes("food") ? (
                  <svg
                    className="w-3 h-3 text-[#7A6D60] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3 text-[#7A6D60] shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                )}
                <span className="truncate max-w-[110px] sm:max-w-[130px]">
                  {tag}
                </span>
              </span>
            ))}
          </div>

          {/* Send Inquiry Button */}
          <div className="pt-2">
            <button
              onClick={onOpenInquiry}
              className="w-full bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs min-h-[40px] flex items-center justify-center"
            >
              {t.card.sendInquiry}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
