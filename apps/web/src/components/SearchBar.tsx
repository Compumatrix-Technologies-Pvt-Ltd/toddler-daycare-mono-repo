"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { Dropdown } from "./ui/Dropdown";
import { FilterState } from "../types";

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchBarProps {
  locationQuery: string;
  setLocationQuery: (val: string) => void;
  onSelectLocation: (coords: { lat: number; lng: number }, label: string) => void;
  onSearchLocation: (query: string) => void;
  onClearLocation: () => void;
  isSearchingLocation?: boolean;
  locationError?: string | null;
  childrenCount: string;
  setChildrenCount: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  onOpenFilterModal: () => void;
  filters?: FilterState;
  activeFiltersCount?: number;
}

const YEAR_OPTIONS = ["2026", "2027", "2028"];

export function SearchBar({
  locationQuery,
  setLocationQuery,
  onSelectLocation,
  onSearchLocation,
  onClearLocation,
  isSearchingLocation = false,
  locationError = null,
  childrenCount,
  setChildrenCount,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onOpenFilterModal,
  activeFiltersCount = 0,
}: SearchBarProps) {
  const { t, language } = useLanguage();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const locationBoxRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationBoxRef.current && !locationBoxRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = locationQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            trimmed
          )}&limit=5&addressdetails=1`,
          {
            headers: { "Accept-Language": language === "de" ? "de,en" : "en,de" },
            signal: controller.signal,
          }
        );
        if (!res.ok) return;
        const data = (await res.json()) as LocationSuggestion[];
        if (Array.isArray(data)) {
          setSuggestions(data);
        }
      } catch {
        // Ignore abort / network errors during typing
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, language]);

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsSuggestionsOpen(false);
      if (locationQuery.trim()) {
        onSearchLocation(locationQuery);
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
    }
  };

  const handleSearchClick = () => {
    setIsSuggestionsOpen(false);
    if (locationQuery.trim()) {
      onSearchLocation(locationQuery);
    } else {
      locationInputRef.current?.focus();
    }
  };

  const childrenOptions = useMemo(
    () => [
      { value: "", label: t.search.children.any },
      { value: "1", label: t.search.children.one },
      { value: "2", label: t.search.children.two },
      { value: "3", label: t.search.children.threePlus },
    ],
    [t]
  );

  const monthOptions = useMemo(
    () => [
      { value: "", label: t.search.anyMonth },
      ...t.search.months.map((label, index) => ({ value: String(index), label })),
    ],
    [t]
  );

  const yearOptions = useMemo(
    () => [
      { value: "", label: t.search.anyYear },
      ...YEAR_OPTIONS.map((year) => ({ value: year, label: year })),
    ],
    [t]
  );

  return (
    <section className="bg-white rounded-2xl border border-[#E2D8CC] p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
        {/* Location Search Input + Left Filters Group */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 text-sm text-[#4E443B] flex-1 min-w-0">
          {/* Location Search Bar */}
          <div ref={locationBoxRef} className="relative w-full lg:w-[250px] xl:w-[270px] shrink-0">
            <div className="relative flex items-center">
              <svg
                className="w-4 h-4 text-[#A12D3A] absolute left-3 pointer-events-none shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
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

              <input
                ref={locationInputRef}
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setIsSuggestionsOpen(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setIsSuggestionsOpen(true);
                }}
                onKeyDown={handleLocationKeyDown}
                placeholder={t.search.locationPlaceholder}
                aria-label={t.search.locationAriaLabel}
                className="w-full min-h-[42px] pl-9 pr-9 py-2 rounded-xl border border-[#D5C9B8] bg-[#FAF8F5]/70 text-xs sm:text-sm text-[#1E1B18] placeholder:text-[#8E8173] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
              />

              {isSearchingLocation ? (
                <span className="absolute right-3 w-4 h-4 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
              ) : locationQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSuggestions([]);
                    setIsSuggestionsOpen(false);
                    onClearLocation();
                  }}
                  aria-label={t.search.clearLocation}
                  className="absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>

            {locationError && (
              <p className="text-[11px] font-medium text-[#A12D3A] mt-1 px-1">{locationError}</p>
            )}

            {isSuggestionsOpen && suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-[#E2D8CC] shadow-lg max-h-60 overflow-y-auto py-1"
              >
                {suggestions.map((item) => {
                  const lat = Number.parseFloat(item.lat);
                  const lng = Number.parseFloat(item.lon);
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                  return (
                    <li key={item.place_id}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSuggestionsOpen(false);
                          onSelectLocation({ lat, lng }, item.display_name);
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs text-[#1E1B18] hover:bg-[#FAF7F2] flex items-start gap-2 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-[#A12D3A] mt-0.5 shrink-0"
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
                        <span className="line-clamp-2 leading-snug">{item.display_name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="font-normal text-[#1E1B18] text-[14px] hidden xl:inline shrink-0">
              {t.search.lookingFor}
            </span>

            <Dropdown
              value={childrenCount}
              options={childrenOptions}
              onChange={setChildrenCount}
              ariaLabel={t.search.lookingFor}
              placeholder={t.search.selectChildren}
              className="w-full sm:w-auto sm:min-w-[125px]"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-[#6D6154] font-medium text-xs sm:text-sm shrink-0">
                {t.search.from}
              </span>

              <Dropdown
                value={selectedMonth}
                options={monthOptions}
                onChange={setSelectedMonth}
                ariaLabel={t.search.from}
                placeholder={t.search.selectMonth}
                className="flex-1 min-w-0 sm:flex-none sm:min-w-[130px]"
              />

              <Dropdown
                value={selectedYear}
                options={yearOptions}
                onChange={setSelectedYear}
                ariaLabel={selectedYear}
                placeholder={t.search.selectYear}
                className="w-[90px] shrink-0 sm:w-auto sm:min-w-[96px]"
                menuAlign="right"
              />
            </div>
          </div>
        </div>

        {/* Right Actions Group */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenFilterModal}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-2.5 sm:py-2 rounded-xl border transition-all cursor-pointer shadow-2xs min-h-[42px] ${
              activeFiltersCount > 0
                ? "bg-[#FAF7F2] border-[#A12D3A] text-[#A12D3A] shadow-xs"
                : "border-[#D5C9B8] text-[#3D3328] hover:border-[#A12D3A]/50 bg-white"
            }`}
          >
            <svg
              className={`w-4 h-4 ${activeFiltersCount > 0 ? "text-[#A12D3A]" : "text-[#7A6E62]"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="whitespace-nowrap">{t.search.moreFilters}</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#A12D3A] text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSearchClick}
            className="flex-1 sm:flex-initial bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold px-6 sm:px-7 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs shadow-[#A12D3A]/20 min-h-[42px] cursor-pointer"
          >
            {t.search.searchButton}
          </button>
        </div>
      </div>
    </section>
  );
}
