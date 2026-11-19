"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Kita, AvailableDateOption } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { CutleryIcon, PawIcon, StarIcon, UserIcon } from "./icons/WebIcons";
import { caretakerApi } from "../utils/caretakerApi";
import { getSocket } from "../utils/socket";

interface KitaDetailProps {
  kita: Kita;
  selectedDateFilter: string;
  onSelectDateFilter: (date: string) => void;
  onOpenInquiry: () => void;
  onOpenGallery?: (initialIndex?: number) => void;
  catchmentRadius?: number;
  childrenCount?: number | string;
  filters?: any;
}

function formatMonthYear(dateStr?: string, lang: string = "de"): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  if (!trimmed) return "";

  // Immediate availability
  if (/sofort|immediate/i.test(trimmed)) {
    return lang === "de" ? "Ab sofort" : "Available immediately";
  }

  const deMonths = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const enMonths = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const targetMonths = lang === "de" ? deMonths : enMonths;

  let monthNum = 0;
  let yearStr = "";

  // 1) MM/YYYY or M/YYYY or MM.YYYY or MM-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\.-](\d{4})$/);
  if (slashMatch) {
    monthNum = parseInt(slashMatch[1], 10);
    yearStr = slashMatch[2];
  }

  // 2) DD.MM.YYYY or D.M.YYYY
  if (!monthNum) {
    const deDotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (deDotMatch) {
      monthNum = parseInt(deDotMatch[2], 10);
      yearStr = deDotMatch[3];
    }
  }

  // 3) YYYY-MM-DD or YYYY-MM
  if (!monthNum) {
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
    if (isoMatch) {
      yearStr = isoMatch[1];
      monthNum = parseInt(isoMatch[2], 10);
    }
  }

  // 4) Named month with year: e.g. 'Feb 10, 2027', 'Februar 2027', 'Feb, 2027', 'Feb,2027', 'Oktober 2025'
  if (!monthNum) {
    const monthsMap: Record<string, number> = {
      januar: 1, jan: 1, january: 1,
      februar: 2, feb: 2, february: 2,
      märz: 3, maerz: 3, mar: 3, march: 3, mär: 3,
      april: 4, apr: 4,
      mai: 5, may: 5,
      juni: 6, jun: 6, june: 6,
      juli: 7, jul: 7, july: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      oktober: 10, okt: 10, oct: 10, october: 10,
      november: 11, nov: 11,
      dezember: 12, dez: 12, dec: 12, december: 12,
    };

    const match = trimmed.match(/([a-zA-ZäöüÄÖÜ]+)[^\d]*(\d{4})/i);
    if (match) {
      const key = match[1].toLowerCase();
      monthNum = monthsMap[key] || monthsMap[key.slice(0, 3)] || 0;
      yearStr = match[2];
    }
  }

  // 5) Fallback native Date
  if (!monthNum) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      monthNum = parsed.getMonth() + 1;
      yearStr = String(parsed.getFullYear());
    }
  }

  if (monthNum >= 1 && monthNum <= 12 && yearStr) {
    return `${targetMonths[monthNum]}, ${yearStr}`;
  }

  return trimmed;
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

function getTranslatedGender(gender: string | undefined, t: any): string {
  if (!gender) return "";
  const detected = parseGender(gender);
  if (detected === "female") return t.detail?.genderFemale || "Weiblich";
  if (detected === "male") return t.detail?.genderMale || "Männlich";
  if (detected === "other") return t.detail?.genderOther || "Divers";
  return gender;
}

function getTranslatedMeals(
  meals: string | undefined,
  mealsDe: string | undefined,
  lang: string,
  t: any
): string {
  const raw = (meals || "").trim();
  if (!raw && !mealsDe) return "";

  const lower = (raw || mealsDe || "").toLowerCase();

  // Freshly cooked / self-cooked
  if (
    lower.includes("self") ||
    lower.includes("frisch") ||
    lower.includes("fresh") ||
    lower.includes("selbst") ||
    lower.includes("cook") ||
    lower.includes("gekocht")
  ) {
    return t.card?.freshCooking || (lang === "de" ? "Frisch gekocht" : "Freshly cooked");
  }

  // Delivered / Catering
  if (
    lower.includes("deliver") ||
    lower.includes("geliefert") ||
    lower.includes("cater") ||
    lower.includes("angeliefert")
  ) {
    return t.card?.deliveredCooking || (lang === "de" ? "Catering / Geliefert" : "Catered meals");
  }

  // Bio / Organic
  if (lower.includes("bio") || lower.includes("organic")) {
    return t.tags?.bioFood || (lang === "de" ? "Bio Food" : "Organic Food");
  }

  return lang === "de" && mealsDe ? mealsDe : raw;
}

function getTranslatedPets(
  pets: string | undefined,
  petsDe: string | undefined,
  lang: string,
  t: any
): string {
  const raw = (pets || "").trim();
  if (!raw && !petsDe) return "";

  const lower = (raw || petsDe || "").toLowerCase();

  // No pets / pet-free
  if (
    lower.includes("no-pet") ||
    lower.includes("not-allow") ||
    lower.includes("keine") ||
    lower.includes("free") ||
    lower.includes("frei") ||
    lower.includes("ohne") ||
    lower.includes("nein") ||
    lower === "no" ||
    lower === "no pets"
  ) {
    return t.card?.noPets || (lang === "de" ? "Keine Haustiere" : "No pets");
  }

  // Small Dog / Kleiner Hund
  if (lower.includes("small dog") || lower.includes("kleiner hund")) {
    return lang === "de" ? "Kleiner Hund" : "Small dog";
  }
  // Dog / Hund
  if (lower.includes("dog") || lower.includes("hund")) {
    return lang === "de" ? "Hund im Haushalt" : "Dog in home";
  }
  // Cat / Katze
  if (lower.includes("cat") || lower.includes("katze")) {
    return lang === "de" ? "Katze im Haushalt" : "Cat in home";
  }

  // Have pets / allowed
  if (
    lower.includes("have-pet") ||
    lower.includes("allow") ||
    lower.includes("erlaubt") ||
    lower.includes("vorhanden") ||
    lower.includes("pets ok") ||
    lower === "ja" ||
    lower === "yes"
  ) {
    return t.card?.hasPets || (lang === "de" ? "Haustiere vorhanden" : "Pets in home");
  }

  return lang === "de" && petsDe ? petsDe : raw;
}

function getTranslatedAgeRange(ageRange: string | undefined, lang: string): string {
  if (!ageRange) return "";
  const trimmed = ageRange.trim();
  if (lang === "de") {
    return trimmed
      .replace(/\byears?\b/gi, "Jahre")
      .replace(/\bto\b/gi, "bis")
      .replace(/\bfrom\b/gi, "ab")
      .replace(/\bmonths?\b/gi, "Monate");
  } else {
    return trimmed
      .replace(/\bJahre\b/gi, "years")
      .replace(/\bJahr\b/gi, "year")
      .replace(/\bbis\b/gi, "to")
      .replace(/\bab\b/gi, "from")
      .replace(/\bMonate\b/gi, "months")
      .replace(/\bMonat\b/gi, "month");
  }
}

function getTranslatedHours(hours: string | undefined, lang: string): string {
  if (!hours) return "";
  const trimmed = hours.trim();
  if (lang === "de") {
    return trimmed
      .replace(/Mon\s*-\s*Fri/gi, "Mo - Fr")
      .replace(/Mon\s*to\s*Fri/gi, "Mo bis Fr");
  } else {
    return trimmed
      .replace(/Mo\s*-\s*Fr/gi, "Mon - Fri")
      .replace(/Mo\s*bis\s*Fr/gi, "Mon to Fri")
      .replace(/\s*Uhr\b/gi, "");
  }
}

function getTranslatedDistance(distance: string | undefined, lang: string): string {
  if (!distance) return "";
  const trimmed = distance.trim();
  if (lang === "de") {
    return trimmed
      .replace(/\baway\b/gi, "entfernt")
      .replace(/\bwalk(ing)?\b/gi, "zu Fuß")
      .replace(/\bmins?\b/gi, "Min.");
  } else {
    return trimmed
      .replace(/\bentfernt\b/gi, "away")
      .replace(/\bzu Fuß\b/gi, "walking")
      .replace(/\bFußweg\b/gi, "walk")
      .replace(/\bMin\.\b/gi, "min");
  }
}

export function KitaDetail({
  kita,
  selectedDateFilter,
  onSelectDateFilter,
  onOpenInquiry,
  onOpenGallery,
  catchmentRadius = 3,
  childrenCount,
  filters,
}: KitaDetailProps) {
  const { t, language } = useLanguage();

  const effectiveRadius =
    kita.catchmentRadiusKm || (kita.areaType === "rural" ? 10 : catchmentRadius || 3);
  const isRural = kita.areaType === "rural";

  const detectedGender = parseGender(kita.gender);
  const isMale = detectedGender === "male";
  const caretakerRole = kita.gender
    ? isMale
      ? (t.card?.tagesvater || "Tagesvater")
      : (t.card?.tagesmutter || "Tagesmutter")
    : "";
  const translatedGender = getTranslatedGender(kita.gender, t);

  const rawMeals =
    kita.mealsType ||
    kita.tags?.find((tag) => /gekocht|küche|essen|food|meal|cook|cater/i.test(tag)) ||
    "";
  const translatedMeals = getTranslatedMeals(rawMeals, kita.mealsTypeDe, language, t);

  const rawPets =
    kita.petsPolicy ||
    kita.tags?.find((tag) => /haustier|tier|pet|dog|cat|hund|katze/i.test(tag)) ||
    "";
  const translatedPets = getTranslatedPets(rawPets, kita.petsPolicyDe, language, t);

  const translatedHours = getTranslatedHours(kita.hours, language);
  const translatedAgeRange = getTranslatedAgeRange(kita.ageRange, language);
  const translatedDistance = getTranslatedDistance(kita.distance, language);

  // Minimum required slots from active children filter (e.g. "1" -> 1, "2" -> 2, "3+" -> 3)
  const requiredSlots = useMemo(() => {
    const raw = childrenCount ?? filters?.childrenCount;
    const num = parseInt(String(raw || "1").replace(/\D/g, ""), 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }, [childrenCount, filters?.childrenCount]);

  // Dynamic availability data state (synced with real caretaker bookings)
  const [liveAvailability, setLiveAvailability] = useState<{
    nextDate?: string;
    availableSlots?: number;
    totalSlots?: number;
    otherAvailableDates?: AvailableDateOption[];
  } | null>(null);

  // Local selection for other slot dates (does not trigger global search re-filtering)
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>("");

  useEffect(() => {
    setSelectedSlotDate("");
  }, [kita.id, requiredSlots]);

  // Fetch live availability on mount or when kita.id / requiredSlots change or on daycare:updated socket
  useEffect(() => {
    if (!kita.id) return;
    let isMounted = true;

    const fetchAvailability = async () => {
      try {
        const data = await caretakerApi.getDaycareAvailability(kita.id, requiredSlots);
        if (isMounted && data) {
          setLiveAvailability(data);
        }
      } catch (err) {
        console.warn("Could not fetch live daycare availability:", err);
      }
    };

    fetchAvailability();

    const socket = getSocket();
    const handleDaycareUpdate = (payload: any) => {
      if (!payload || payload.daycareId === kita.id || (payload.caretakerId && payload.caretakerId === kita.caretakerId)) {
        fetchAvailability();
      }
    };

    if (socket) {
      socket.on("daycare:updated", handleDaycareUpdate);
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.off("daycare:updated", handleDaycareUpdate);
      }
    };
  }, [kita.id, kita.caretakerId, requiredSlots]);

  // Only genuinely available dates matching the active children filter (max 4 options, availableSlots >= requiredSlots, non-past)
  const availableDates: AvailableDateOption[] = useMemo(() => {
    const list = liveAvailability?.otherAvailableDates || kita.otherAvailableDates || [];
    return list.filter((opt) => opt.availableSlots >= requiredSlots).slice(0, 4);
  }, [liveAvailability, kita.otherAvailableDates, requiredSlots]);

  const effectiveNextDate =
    selectedSlotDate ||
    (availableDates.length > 0 ? availableDates[0].date : null) ||
    liveAvailability?.nextDate ||
    kita.nextDate;

  const primaryAvailableSlots =
    liveAvailability?.availableSlots ??
    (availableDates.length > 0
      ? availableDates[0].availableSlots
      : (kita.availableSlots ?? kita.slots ?? 5));

  const primaryTotalSlots =
    liveAvailability?.totalSlots ??
    (availableDates.length > 0
      ? availableDates[0].totalSlots
      : (kita.totalSlots ?? kita.maxChildren ?? 5));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Photo Showcase - renders real daycare photos as they are */}
      {kita.photos && kita.photos.length > 1 ? (
        <div className="grid grid-cols-12 gap-2 sm:gap-3 h-[180px] sm:h-[220px]">
          {/* Main Large Photo */}
          <div
            onClick={() => onOpenGallery && onOpenGallery(0)}
            className="col-span-8 relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3ECE2] cursor-pointer group"
            title={t.gallery.viewAllPhotos}
          >
            {kita.image ? (
              <Image
                src={kita.image}
                alt={kita.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                unoptimized={true}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>{t.gallery.viewAllPhotos}</span>
              </span>
            </div>
          </div>

          {/* Stacked Photos */}
          <div className="col-span-4 flex flex-col gap-2 sm:gap-3">
            {/* Top Photo */}
            <div
              onClick={() => onOpenGallery && onOpenGallery(1)}
              className="relative flex-1 rounded-lg sm:rounded-xl overflow-hidden bg-[#F3ECE2] cursor-pointer group"
              title={t.gallery.viewAllPhotos}
            >
              <Image
                src={kita.photos[1]}
                alt={`${kita.name} photo 2`}
                fill
                sizes="(max-width: 1024px) 40vw, 25vw"
                unoptimized={true}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
            </div>

            {/* Bottom Photo (or +N Overlay) */}
            {kita.photos[2] && (
              <div
                onClick={() => onOpenGallery && onOpenGallery(2)}
                className="relative flex-1 rounded-lg sm:rounded-xl overflow-hidden bg-[#F3ECE2] group cursor-pointer"
                title={t.gallery.viewAllPhotos}
              >
                <Image
                  src={kita.photos[2]}
                  alt={`${kita.name} photo 3`}
                  fill
                  sizes="(max-width: 1024px) 40vw, 25vw"
                  unoptimized={true}
                  className="object-cover object-bottom group-hover:scale-105 transition-transform duration-300"
                />
                {kita.photos.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-base sm:text-lg group-hover:bg-black/55 transition-colors">
                    +{kita.photos.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : kita.image ? (
        <div
          onClick={() => onOpenGallery && onOpenGallery(0)}
          className="relative w-full h-[180px] sm:h-[220px] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3ECE2] cursor-pointer group"
          title={t.gallery.viewAllPhotos}
        >
          <Image
            src={kita.image}
            alt={kita.name}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            unoptimized={true}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>{t.gallery.viewAllPhotos}</span>
            </span>
          </div>
        </div>
      ) : null}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#1E1B18]">
            {kita.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-[#7A6E62] mt-0.5 sm:mt-1">
            <svg
              className="w-4 h-4 text-[#A12D3A] shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{kita.address || kita.location}</span>
            {(kita.caretaker || kita.caretakerDe) && (
              <>
                <span className="text-[#C4B7A5]">•</span>
                <span className="text-[#7A6E62]">
                  {language === "de"
                    ? kita.caretakerDe || kita.caretaker
                    : kita.caretaker || kita.caretakerDe}
                </span>
              </>
            )}
          </div>

          {/* Availability, Rating & Catchment Radius Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs flex-wrap mt-2">
            {kita.slots > 0 && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  {kita.slots} {t.card?.slotsAvailable || t.detail?.spotsLeft || "slots available"}
                </span>
                <span className="text-[#C4B7A5]">•</span>
              </>
            )}
            {kita.rating > 0 && (
              <>
                <span className="bg-[#FEF3C7] text-[#78350F] font-bold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] inline-flex items-center gap-1">
                  <span>{Number(kita.rating || 0).toFixed(1)}</span>
                  <StarIcon className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  <span>({Number(kita.reviewCount || 0)} {t.card?.reviews || "Reviews"})</span>
                </span>
                <span className="text-[#C4B7A5]">•</span>
              </>
            )}
            <span
              className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold border ${isRural
                ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                : "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isRural ? "bg-[#D97706]" : "bg-[#16A34A]"
                  }`}
              />
              <span>
                {isRural
                  ? t.card?.ruralBadge?.replace("{radius}", String(effectiveRadius)) || `Rural • ${effectiveRadius} km`
                  : t.card?.urbanBadge?.replace("{radius}", String(effectiveRadius)) || `Urban • ${effectiveRadius} km`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Next Available Highlight Card */}
      <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#D1FAE5] flex items-center justify-center text-[#16A34A] shrink-0 shadow-xs">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#15803D] tracking-wider uppercase">
              {t.detail.nextAvailable}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-2xl font-bold text-[#1E293B]">
                {formatMonthYear(effectiveNextDate, language)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-0 border-[#DCFCE7]">
          <div className="text-xs sm:text-sm font-semibold text-[#15803D]">
            {t.detail.secureSpot}
          </div>
          <button
            onClick={onOpenInquiry}
            className="w-full sm:w-auto bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors min-h-[40px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>{t.detail.sendInquiry}</span>
          </button>
        </div>
      </div>

      {/* Date Selector - Other Dates (Up to 4 genuinely available dates matching child filter) */}
      {availableDates.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#1E1B18] tracking-wide">
            {t.detail.otherDates}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1.5 scrollbar-none">
            {availableDates.map((opt, idx) => {
              const isSelected = selectedSlotDate
                ? selectedSlotDate === opt.date
                : (selectedDateFilter === opt.date || idx === 0);
              const formattedDate =
                formatMonthYear(opt.date, language) ||
                (language === "de" ? opt.labelDe || opt.label : opt.label);

              return (
                <button
                  key={opt.date || idx}
                  type="button"
                  onClick={() => {
                    setSelectedSlotDate(opt.date);
                    onSelectDateFilter?.(opt.date);
                  }}
                  className={`text-xs font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all shrink-0 min-h-[36px] cursor-pointer ${
                    isSelected
                      ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-xs font-semibold"
                      : "bg-white text-[#1E1B18] border-[#E5DDD2] hover:border-[#A12D3A]/40 hover:bg-[#FAF8F5]"
                  }`}
                >
                  {formattedDate}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Details Row */}
      {(kita.hours || kita.ageRange || kita.distance) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 py-3 border-y border-[#F0EAE1]">
          {/* Hours */}
          {kita.hours ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#F7F4EE] flex items-center justify-center text-[#7A6E62] shrink-0">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-[#1E1B18] truncate">
                {translatedHours}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Age */}
          {kita.ageRange ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-[#1E1B18] truncate">
                {translatedAgeRange}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Distance */}
          {kita.distance ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="4" r="2" />
                  <path d="M15 22v-5l2-3v-4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4l2 3v5h2v-5h2v5h2z" />
                </svg>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-[#1E1B18] truncate">
                {translatedDistance}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Caretaker Gender, Phone & Website */}
      {(kita.gender || kita.phone || kita.website || kita.email) && (
        <div className="flex flex-wrap items-start gap-3 sm:gap-4 py-3 border-b border-[#F0EAE1]">
          {kita.gender && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#F7F4EE] flex items-center justify-center text-[#7A6E62] shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-[#7A6E62] break-words">
                  {t.detail.caretakerGender}
                </div>
                <div className="text-xs font-semibold text-[#1E1B18] break-words">
                  {caretakerRole ? `${caretakerRole}` : ""}
                </div>
              </div>
            </div>
          )}

          {kita.phone && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#F7F4EE] flex items-center justify-center text-[#7A6E62] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-[#7A6E62] break-words">
                  {t.detail.phone}
                </div>
                <a
                  href={`tel:${kita.phone}`}
                  className="text-xs font-semibold text-[#A12D3A] hover:underline break-words block"
                >
                  {kita.phone}
                </a>
              </div>
            </div>
          )}

          {kita.email && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#F7F4EE] flex items-center justify-center text-[#7A6E62] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-[#7A6E62] break-words">
                  {language === "de" ? "E-Mail" : "Email"}
                </div>
                <a
                  href={`mailto:${kita.email}`}
                  className="text-xs font-semibold text-[#A12D3A] hover:underline break-words block"
                >
                  {kita.email}
                </a>
              </div>
            </div>
          )}

          {kita.website && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#F7F4EE] flex items-center justify-center text-[#7A6E62] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-[#7A6E62] break-words">
                  {t.detail.website}
                </div>
                <a
                  href={
                    kita.website.startsWith("http://") || kita.website.startsWith("https://")
                      ? kita.website
                      : `https://${kita.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#A12D3A] hover:underline break-words block"
                >
                  {kita.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Feature Tags - renders properly translated daycare meal/pets details */}
      {(translatedMeals || translatedPets) && (
        <div className="flex items-center gap-2 flex-wrap">
          {translatedMeals && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#52463A] bg-[#F7F4EE] border border-[#E9E2D8] px-3 py-1.5 rounded-lg font-medium shadow-2xs">
              <CutleryIcon className="w-3.5 h-3.5 text-[#855C1B] shrink-0" />
              <span>{translatedMeals}</span>
            </span>
          )}
          {translatedPets && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#52463A] bg-[#F7F4EE] border border-[#E9E2D8] px-3 py-1.5 rounded-lg font-medium shadow-2xs">
              <PawIcon className="w-3.5 h-3.5 text-[#6E6153] shrink-0" />
              <span>{translatedPets}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
