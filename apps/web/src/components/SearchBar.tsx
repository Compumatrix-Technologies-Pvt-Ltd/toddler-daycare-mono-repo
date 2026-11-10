"use client";

import React, { useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { Dropdown } from "./ui/Dropdown";
import { FilterState } from "../types";

interface SearchBarProps {
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
  childrenCount,
  setChildrenCount,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onOpenFilterModal,
  activeFiltersCount = 0,
}: SearchBarProps) {
  const { t } = useLanguage();

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left Filters Group */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-[#4E443B] w-full lg:w-auto">
          <span className="font-normal text-[#1E1B18] text-[14px] sm:text-[15px] hidden md:inline shrink-0">
            {t.search.lookingFor}
          </span>

          <Dropdown
            value={childrenCount}
            options={childrenOptions}
            onChange={setChildrenCount}
            ariaLabel={t.search.lookingFor}
            placeholder={t.search.selectChildren}
            className="flex-1 sm:flex-none sm:min-w-[130px] min-w-[110px]"
          />

          <span className="text-[#6D6154] font-medium text-xs sm:text-sm shrink-0">
            {t.search.from}
          </span>

          <Dropdown
            value={selectedMonth}
            options={monthOptions}
            onChange={setSelectedMonth}
            ariaLabel={t.search.from}
            placeholder={t.search.selectMonth}
            className="flex-1 sm:flex-none sm:min-w-[140px] min-w-[120px]"
          />

          <Dropdown
            value={selectedYear}
            options={yearOptions}
            onChange={setSelectedYear}
            ariaLabel={selectedYear}
            placeholder={t.search.selectYear}
            className="flex-1 sm:flex-none sm:min-w-[100px] min-w-[90px]"
            menuAlign="right"
          />
        </div>

        {/* Right Actions Group */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
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
            onClick={onOpenFilterModal}
            className="flex-1 sm:flex-initial bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold px-6 sm:px-7 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs shadow-[#A12D3A]/20 min-h-[42px] cursor-pointer"
          >
            {t.search.searchButton}
          </button>
        </div>
      </div>
    </section>
  );
}
