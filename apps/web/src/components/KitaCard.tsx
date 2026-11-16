"use client";

import React from "react";
import Image from "next/image";
import { Kita } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { StarIcon, CutleryIcon, PawIcon, UserIcon } from "./icons/WebIcons";

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

function parseGender(genderStr?: string): "female" | "male" | "other" {
  if (!genderStr) return "female";
  const g = genderStr.trim().toLowerCase();

  // Check female first to prevent substring collision ("female".includes("male") is true!)
  if (
    g === "female" ||
    g === "f" ||
    g === "w" ||
    g.includes("weib") ||
    g.includes("frau") ||
    g.includes("mutter")
  ) {
    return "female";
  }

  // Check male (exact "male", "m", or German roots)
  if (
    g === "male" ||
    g === "m" ||
    g.includes("männ") ||
    g.includes("herr") ||
    g.includes("vater")
  ) {
    return "male";
  }

  if (g === "other" || g.includes("divers") || g === "d") {
    return "other";
  }

  return "female";
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
  const { t, language } = useLanguage();
  const effectiveRadius =
    kita.catchmentRadiusKm || (kita.areaType === "rural" ? 10 : catchmentRadius || 3);
  const isRural = kita.areaType === "rural";

  // 1. Gender label (accurately distinguishes female vs male without substring collisions)
  const detectedGender = parseGender(kita.gender);
  const isMale = detectedGender === "male";
  const genderLabel = isMale
    ? (t.card?.tagesvater || "Male")
    : (t.card?.tagesmutter || "Female");

  // 2. Cooking / Fresh meals label
  const rawCooking = (
    kita.mealsType ||
    (language === "de" && kita.mealsTypeDe ? kita.mealsTypeDe : "") ||
    kita.tags?.find((tag) => /gekocht|küche|essen|food|meal|cook|cater/i.test(tag)) ||
    ""
  ).trim();
  const lowerCooking = rawCooking.toLowerCase();
  const cookingLabel =
    !rawCooking ||
    lowerCooking.includes("self") ||
    lowerCooking.includes("frisch") ||
    lowerCooking.includes("fresh") ||
    lowerCooking.includes("cook") ||
    lowerCooking.includes("gekocht") ||
    lowerCooking.includes("bio")
      ? (t.card.freshCooking || (language === "de" ? "Frisch gekocht" : "Freshly cooked"))
      : lowerCooking.includes("deliver") ||
        lowerCooking.includes("geliefert") ||
        lowerCooking.includes("cater") ||
        lowerCooking.includes("angeliefert")
      ? (t.card.deliveredCooking || (language === "de" ? "Catering / Geliefert" : "Catered meals"))
      : (language === "de" && kita.mealsTypeDe ? kita.mealsTypeDe : rawCooking);

  // 3. Pets policy label
  const rawPets = (
    kita.petsPolicy ||
    (language === "de" && kita.petsPolicyDe ? kita.petsPolicyDe : "") ||
    kita.tags?.find((tag) => /haustier|tier|pet|dog|cat|hund|katze/i.test(tag)) ||
    ""
  ).trim();
  const lowerPets = rawPets.toLowerCase();
  const petsLabel =
    !rawPets ||
    lowerPets.includes("no-pet") ||
    lowerPets.includes("not-allow") ||
    lowerPets.includes("keine") ||
    lowerPets.includes("free") ||
    lowerPets.includes("frei") ||
    lowerPets.includes("ohne") ||
    lowerPets.includes("nein") ||
    lowerPets === "no" ||
    lowerPets === "no pets"
      ? (t.card.noPets || (language === "de" ? "Keine Haustiere" : "No pets"))
      : lowerPets.includes("have-pet") ||
        lowerPets.includes("allow") ||
        lowerPets.includes("erlaubt") ||
        lowerPets.includes("vorhanden") ||
        lowerPets.includes("pets ok") ||
        lowerPets === "ja" ||
        lowerPets === "yes"
      ? (t.card.hasPets || (language === "de" ? "Haustiere vorhanden" : "Pets in home"))
      : (language === "de" && kita.petsPolicyDe ? kita.petsPolicyDe : rawPets);

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
          className="relative w-28 sm:w-36 md:w-40 self-stretch min-h-[130px] sm:min-h-[150px] rounded-xl overflow-hidden bg-[#F3ECE2] shrink-0 cursor-pointer group/thumb"
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
        <div className="flex-1 min-w-0 flex flex-col justify-start">
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

          {/* Availability, Rating & Catchment Radius Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs flex-wrap my-1.5">
            <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              {kita.slots} {t.card.slotsAvailable}
            </span>
            <span className="bg-[#FEF3C7] text-[#78350F] font-bold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] inline-flex items-center gap-1 shrink-0">
              <span>{Number(kita.rating || 0).toFixed(1)}</span>
              <StarIcon className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              <span>({Number(kita.reviewCount || 0)} {t.card.reviews})</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                isRural
                  ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                  : "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRural ? "bg-[#D97706]" : "bg-[#16A34A]"
                }`}
              />
              <span>
                {isRural
                  ? t.card.ruralBadge.replace("{radius}", String(effectiveRadius))
                  : t.card.urbanBadge.replace("{radius}", String(effectiveRadius))}
              </span>
            </span>
          </div>

          {/* Caretaker Attributes: Chips wrapping naturally */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 my-2">
            {/* 1. Caretaker Gender: Tagesmutter OR Tagesvater */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD3] text-xs shrink-0 shadow-2xs">
              <span className="w-4.5 h-4.5 rounded-full bg-white border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shrink-0">
                <UserIcon className="w-2.5 h-2.5 text-[#A12D3A]" />
              </span>
              <span className="font-bold text-[#1E1B18] tracking-tight">{genderLabel}</span>
            </div>

            {/* 2. Cooking / Fresh Meals */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD3] text-xs text-[#3D332A] shrink-0 shadow-2xs">
              <span className="w-4.5 h-4.5 rounded-full bg-white border border-[#E5DDD2] flex items-center justify-center text-[#855C1B] shrink-0">
                <CutleryIcon className="w-2.5 h-2.5 text-[#855C1B]" />
              </span>
              <span className="font-semibold text-[#3D332A]">{cookingLabel}</span>
            </div>

            {/* 3. Pets Policy */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD3] text-xs text-[#3D332A] shrink-0 shadow-2xs">
              <span className="w-4.5 h-4.5 rounded-full bg-white border border-[#E5DDD2] flex items-center justify-center text-[#6E6153] shrink-0">
                <PawIcon className="w-2.5 h-2.5 text-[#6E6153]" />
              </span>
              <span className="font-semibold text-[#3D332A]">{petsLabel}</span>
            </div>
          </div>

          {/* Send Inquiry Button */}
          <div className="pt-2 mt-auto">
            <button
              onClick={onOpenInquiry}
              className="w-full bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors shadow-xs min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              {t.card.sendInquiry}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
