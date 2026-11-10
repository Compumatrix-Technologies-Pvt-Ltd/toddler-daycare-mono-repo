"use client";

import React from "react";
import Image from "next/image";
import { Kita } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

interface KitaDetailProps {
  kita: Kita;
  selectedDateFilter: string;
  onSelectDateFilter: (date: string) => void;
  onOpenInquiry: () => void;
  onOpenGallery?: (initialIndex?: number) => void;
  catchmentRadius?: number;
}

export function KitaDetail({
  kita,
  selectedDateFilter,
  onSelectDateFilter,
  onOpenInquiry,
  onOpenGallery,
  catchmentRadius = 3,
}: KitaDetailProps) {
  const { t, language } = useLanguage();

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
        </div>

        <button
          onClick={onOpenInquiry}
          className="w-full sm:w-auto bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold px-8 py-2.5 rounded-lg text-sm shadow-xs transition-colors min-h-[42px]"
        >
          {t.detail.sendInquiry}
        </button>
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
                {kita.nextDate}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {kita.nextDay}
              </span>
            </div>
          </div>
        </div>

        <div className="sm:text-right flex items-center sm:block justify-between pt-1 sm:pt-0 border-t sm:border-0 border-[#DCFCE7]">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D] bg-white border border-[#DCFCE7] px-3 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            {kita.slots} {t.detail.spotsLeft}
          </div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-0.5 sm:mt-1 font-medium">
            {t.detail.secureSpot}
          </div>
        </div>
      </div>

      {/* Parents Catchment Reach Card - Dynamic from Admin Settings */}
      <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 text-[#A12D3A]"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#A12D3A] tracking-wider uppercase">
              {language === "de" ? "EINZUGSBEREICH & SICHTBARKEIT" : "VISIBILITY & REACH"}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1E1B18] leading-tight">
              {t.detail.parentsReach.replace("{radius}", String(catchmentRadius))}
            </div>
            <div className="text-[11px] text-[#7A6E62] mt-0.5 hidden sm:block truncate">
              {t.detail.catchmentDesc}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold whitespace-nowrap shadow-2xs">
            <span>📍</span>
            <span>{catchmentRadius} km</span>
          </span>
        </div>
      </div>

      {/* Date Selector */}
      {kita.nextDate && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#1E1B18] tracking-wide">
            {t.detail.otherDates}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1.5 scrollbar-none">
            <button
              onClick={() => onSelectDateFilter(kita.nextDate)}
              className="text-xs font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all shrink-0 min-h-[36px] bg-[#A12D3A] text-white border-[#A12D3A] shadow-xs"
            >
              {kita.nextDate}
            </button>
          </div>
        </div>
      )}

      {/* Key Details Row */}
      {(kita.hours || kita.ageRange || kita.distance) && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 border-y border-[#F0EAE1]">
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
                {kita.hours}
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
                {kita.ageRange}
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
                {kita.distance}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Bottom Feature Tags - renders raw daycare meal/pets details */}
      {(kita.mealsType || kita.petsPolicy) && (
        <div className="flex items-center gap-2 flex-wrap">
          {kita.mealsType && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#52463A] bg-[#F7F4EE] border border-[#E9E2D8] px-3 py-1.5 rounded-lg font-medium">
              <svg
                className="w-3.5 h-3.5 text-[#7A6E62] shrink-0"
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
              <span>{kita.mealsType}</span>
            </span>
          )}
          {kita.petsPolicy && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#52463A] bg-[#F7F4EE] border border-[#E9E2D8] px-3 py-1.5 rounded-lg font-medium">
              <svg
                className="w-3.5 h-3.5 text-[#7A6E62] shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>{kita.petsPolicy}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
