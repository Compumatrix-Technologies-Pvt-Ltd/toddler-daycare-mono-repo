"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { Calendar } from "./Calendar";

export interface DatePickerProps {
  value?: Date | string | null | undefined;
  onChange: (date: Date | null, dateString: string) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  minDate?: Date | string | null | undefined;
  maxDate?: Date | string | null | undefined;
  locale?: "de" | "en" | undefined;
  format?: "default" | "dd,mmm,yyyy" | "dd mmm,yyyy" | "dd mmm, yyyy" | "YYYY-MM-DD" | "DD.MM.YYYY" | "mmm,yyyy" | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  clearable?: boolean | undefined;
  align?: "left" | "right" | "auto" | undefined;
}

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function parseDateInput(d?: Date | string | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof d !== "string") return null;
  const trimmed = d.trim();

  // 1. ISO YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // 2. German DD.MM.YYYY
  const deMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(trimmed);
  if (deMatch && deMatch[1] && deMatch[2] && deMatch[3]) {
    const day = parseInt(deMatch[1], 10);
    const month = parseInt(deMatch[2], 10) - 1;
    const year = parseInt(deMatch[3], 10);
    return new Date(year, month, day);
  }

  // 3. dd,mmm,yyyy (e.g. "18, Nov, 2026" or "18, Mär, 2026" or "18 Nov 2026")
  const mmmMatch = /^(\d{1,2})[\s,]+([a-zA-ZäöüÄÖÜ]+)[\s,]+(\d{4})/.exec(trimmed);
  if (mmmMatch && mmmMatch[1] && mmmMatch[2] && mmmMatch[3]) {
    const day = parseInt(mmmMatch[1], 10);
    const mStr = mmmMatch[2].toLowerCase();
    const year = parseInt(mmmMatch[3], 10);

    const enIdx = MONTH_NAMES_EN.findIndex(
      (m) => m.toLowerCase() === mStr || mStr.startsWith(m.toLowerCase())
    );
    if (enIdx !== -1) return new Date(year, enIdx, day);

    const deIdx = MONTH_NAMES_DE.findIndex(
      (m) => m.toLowerCase() === mStr || mStr.startsWith(m.toLowerCase())
    );
    if (deIdx !== -1) return new Date(year, deIdx, day);
  }

  // 4. mmm,yyyy or mmm yyyy (e.g. "Dec, 2026", "Dec,2026", "Feb 2027", "März 2027")
  const mmmYearMatch = /^([a-zA-ZäöüÄÖÜ]+)[\s,.-]+(\d{4})/.exec(trimmed);
  if (mmmYearMatch && mmmYearMatch[1] && mmmYearMatch[2]) {
    const mStr = mmmYearMatch[1].toLowerCase();
    const year = parseInt(mmmYearMatch[2], 10);
    const enIdx = MONTH_NAMES_EN.findIndex(
      (m) => m.toLowerCase() === mStr || mStr.startsWith(m.toLowerCase())
    );
    if (enIdx !== -1) return new Date(year, enIdx, 1);
    const deIdx = MONTH_NAMES_DE.findIndex(
      (m) => m.toLowerCase() === mStr || mStr.startsWith(m.toLowerCase())
    );
    if (deIdx !== -1) return new Date(year, deIdx, 1);
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateDisplay(d: Date, locale: "de" | "en", format?: string): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (format === "mmm,yyyy") {
    const monthName = locale === "de" ? MONTH_NAMES_DE[d.getMonth()] : MONTH_NAMES_EN[d.getMonth()];
    return `${monthName}, ${year}`;
  }

  if (format === "dd mmm,yyyy" || format === "dd mmm, yyyy" || format === "dd,mmm,yyyy") {
    const monthName = locale === "de" ? MONTH_NAMES_DE[d.getMonth()] : MONTH_NAMES_EN[d.getMonth()];
    return `${day} ${monthName}, ${year}`;
  }

  if (locale === "de") {
    return `${day}.${month}.${year}`;
  }
  return `${year}-${month}-${day}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  className = "",
  minDate,
  maxDate,
  locale = "de",
  format,
  id: customId,
  disabled = false,
  required = false,
  clearable = true,
  align: customAlign,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [align, setAlign] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);
  const genId = useId();
  const inputId = customId || genId;

  const parsedDate = useMemo(() => parseDateInput(value), [value]);

  const defaultPlaceholder =
    placeholder || (locale === "de" ? "Datum auswählen..." : "Select date...");

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Position calculation
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const popoverHeight = 360;
      const popoverWidth = 320;

      const shouldShowTop =
        rect.bottom + popoverHeight > viewportHeight && rect.top > popoverHeight;
      setPlacement(shouldShowTop ? "top" : "bottom");

      if (customAlign && customAlign !== "auto") {
        setAlign(customAlign);
      } else {
        const shouldAlignRight = rect.left + popoverWidth > viewportWidth || rect.right > viewportWidth;
        setAlign(shouldAlignRight ? "right" : "left");
      }
    }
  }, [isOpen, customAlign]);

  const handleCalendarChange = (selectedDate: Date, isoStr: string) => {
    const formatted = format ? formatDateDisplay(selectedDate, locale, format) : isoStr;
    onChange(selectedDate, formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, "");
  };

  const displayValue = parsedDate
    ? formatDateDisplay(parsedDate, locale, format)
    : "";

  return (
    <div className={`flex flex-col gap-1.5 ${className} ${isOpen ? "relative z-[80]" : ""}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#4E443B]"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div className={`relative ${isOpen ? "z-[80]" : ""}`}>
        <div
          id={inputId}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-white flex items-center justify-between gap-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/15 focus:border-[#A12D3A] ${
            error
              ? "border-[#DC2626]"
              : "border-[#E5DDD2] hover:border-[#A12D3A]/50"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-[#FAF7F2]" : ""}`}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            {/* Calendar Vector SVG Icon */}
            <svg
              className="w-4 h-4 text-[#7A6E62] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>

            <span
              className={`truncate ${
                displayValue ? "text-[#1E1B18] font-semibold" : "text-[#9C8E7E]"
              }`}
            >
              {displayValue || defaultPlaceholder}
            </span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {clearable && displayValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={locale === "de" ? "Datum löschen" : "Clear date"}
                className="p-1 text-[#9C8E7E] hover:text-[#A12D3A] rounded-md transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <svg
              className={`w-3.5 h-3.5 text-[#7A6E62] transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className={`absolute z-[100] w-80 bg-white rounded-2xl border border-[#E5DDD2] shadow-2xl ${
              placement === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            } ${align === "left" ? "left-0" : "right-0"}`}
            style={{
              width: "320px",
              maxWidth: "calc(100vw - 32px)",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5DDD2",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              zIndex: 99999,
              ...(align === "left" ? { left: 0 } : { right: 0 }),
            }}
          >
            <Calendar
              value={parsedDate}
              onChange={handleCalendarChange}
              minDate={minDate}
              maxDate={maxDate}
              locale={locale}
              showQuickActions={true}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#DC2626] font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

DatePicker.displayName = "DatePicker";
