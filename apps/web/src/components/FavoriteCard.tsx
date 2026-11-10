"use client";

import React from "react";
import Image from "next/image";
import { Kita } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

interface FavoriteCardProps {
  kita: Kita;
  onSendInquiry: (kita: Kita) => void;
  onViewProfile: (kita: Kita) => void;
  onRemoveFavorite: (id: string) => void;
}

export function FavoriteCard({
  kita,
  onSendInquiry,
  onViewProfile,
  onRemoveFavorite,
}: FavoriteCardProps) {
  const { t, language } = useLanguage();

  const caretaker =
    language === "de" && kita.caretakerDe
      ? kita.caretakerDe
      : kita.caretaker || `${kita.name} Team`;

  const address = kita.address || `${kita.location} • ${kita.distance}`;

  const ratingLabel = (t.favorites.certifiedCaretaker || "★ {rating} • Certified Caretaker").replace(
    "{rating}",
    kita.rating.toFixed(1)
  );

  const maxPlacementLabel = (t.favorites.maxPlacement || "Max {count} Placement").replace(
    "{count}",
    String(kita.maxChildren || 5)
  );

  const mealsLabel =
    language === "de" && kita.mealsTypeDe
      ? kita.mealsTypeDe
      : kita.mealsType || (language === "de" ? "Frische Küche" : "Fresh Meals");

  const petsLabel =
    language === "de" && kita.petsPolicyDe
      ? kita.petsPolicyDe
      : kita.petsPolicy || (language === "de" ? "Tierfrei" : "Pet-Free");

  const vacancyDate =
    language === "de" && kita.vacancyDateDe
      ? kita.vacancyDateDe
      : kita.vacancyDate || (language === "de" ? "Okt. 2026" : "Oct 2026");

  const vacancyTemplate =
    kita.slots > 1
      ? t.favorites.vacancies || "{count} Vacancies from {date}"
      : t.favorites.vacancy || "{count} Vacancy from {date}";

  const vacancyLabel = vacancyTemplate
    .replace("{count}", String(kita.slots))
    .replace("{date}", vacancyDate);

  return (
    <article className="bg-white border border-[#E6DCCF] rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0px_4px_16px_rgba(28,25,23,0.04)] transition-all hover:shadow-[0px_6px_20px_rgba(28,25,23,0.07)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
      {/* Daycare Image Thumbnail with Saved Badge */}
      <div className="w-full sm:w-[140px] h-48 sm:h-[140px] shrink-0 rounded-xl overflow-hidden relative bg-[#F3EFEA] group">
        <Image
          src={kita.image}
          alt={kita.name}
          fill
          sizes="(max-width: 640px) 100vw, 140px"
          unoptimized={true}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Saved Badge */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-[0px_2px_6px_rgba(0,0,0,0.12)] flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-[#AE2F34] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-[11px] font-semibold text-[#1C1917] tracking-tight">
            {t.favorites.savedBadge}
          </span>
        </div>
      </div>

      {/* Middle Info Stack */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        {/* Title & Rating Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h2
            onClick={() => onViewProfile(kita)}
            className="text-lg sm:text-[20px] font-bold text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif] hover:text-[#AE2F34] transition-colors cursor-pointer truncate"
          >
            {kita.name}
          </h2>

          <div className="bg-[#FFFBEB] border border-amber-200/50 px-2.5 py-0.5 rounded-xl flex items-center gap-1 text-[11px] font-semibold text-[#91400D]">
            <span>{ratingLabel}</span>
          </div>
        </div>

        {/* Caretaker Info */}
        <p className="text-sm font-medium text-[#44403C] font-['DM_Sans',sans-serif]">
          {caretaker}
        </p>

        {/* Location & Distance */}
        <p className="text-[13px] text-[#78716C] flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 text-[#A8A29E] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{address}</span>
        </p>

        {/* Feature Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
          <span className="bg-[#F5F5F4] text-[#1C1917] text-xs px-2.5 py-1 rounded-md font-medium">
            {kita.hours}
          </span>
          <span className="bg-[#F5F5F4] text-[#1C1917] text-xs px-2.5 py-1 rounded-md font-medium">
            {maxPlacementLabel}
          </span>
          <span className="bg-[#F5F5F4] text-[#1C1917] text-xs px-2.5 py-1 rounded-md font-medium">
            {mealsLabel}
          </span>
          <span className="bg-[#F5F5F4] text-[#1C1917] text-xs px-2.5 py-1 rounded-md font-medium">
            {petsLabel}
          </span>
        </div>
      </div>

      {/* Right Actions Stack */}
      <div className="w-full sm:w-[180px] md:w-[220px] flex flex-col items-stretch sm:items-end gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F5F5F4]">
        {/* Vacancy Badge */}
        <div className="bg-[#F0FDF4] border border-green-200/60 px-3 py-1 rounded-md flex items-center justify-center sm:justify-start gap-1.5 self-stretch sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
          <span className="text-xs font-semibold text-[#166534]">
            {vacancyLabel}
          </span>
        </div>

        {/* Send Inquiry Button (height 38px, rounded 8px) */}
        <button
          onClick={() => onSendInquiry(kita)}
          className="w-full sm:w-[148px] h-[38px] min-h-[44px] bg-[#AE2F34] hover:bg-[#88222E] text-white font-medium text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98] focus:outline-hidden focus:ring-2 focus:ring-[#AE2F34]/30"
        >
          <span>{t.favorites.sendInquiry}</span>
        </button>

        {/* View Profile Button (height 34px, rounded 8px, border #D5C4AB) */}
        <button
          onClick={() => onViewProfile(kita)}
          className="w-full sm:w-[148px] h-[34px] min-h-[44px] bg-white hover:bg-[#FAF7F2] border border-[#D5C4AB] text-[#1C1917] font-medium text-sm rounded-lg transition-all flex items-center justify-center active:scale-[0.98] focus:outline-hidden focus:ring-2 focus:ring-[#D5C4AB]/50"
        >
          <span>{t.favorites.viewProfile}</span>
        </button>

        {/* Remove from Favorites Button */}
        <button
          onClick={() => onRemoveFavorite(kita.id)}
          className="text-xs text-[#78716C] hover:text-[#AE2F34] transition-colors py-1 cursor-pointer font-medium hover:underline text-center sm:text-right min-h-[32px] flex items-center justify-center sm:justify-end"
        >
          <span>{t.favorites.removeFromFavorites}</span>
        </button>
      </div>
    </article>
  );
}
