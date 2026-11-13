"use client";

import React, { useState, useMemo } from "react";

export interface CalendarProps {
  value?: Date | string | null | undefined;
  onChange?: ((date: Date, dateString: string) => void) | undefined;
  minDate?: Date | string | null | undefined;
  maxDate?: Date | string | null | undefined;
  locale?: "de" | "en" | undefined;
  className?: string | undefined;
  showQuickActions?: boolean | undefined;
}

type CalendarViewMode = "days" | "months" | "years";

const WEEKDAYS_DE = [
  { short: "Mo", full: "Montag" },
  { short: "Di", full: "Dienstag" },
  { short: "Mi", full: "Mittwoch" },
  { short: "Do", full: "Donnerstag" },
  { short: "Fr", full: "Freitag" },
  { short: "Sa", full: "Samstag" },
  { short: "So", full: "Sonntag" },
];

const WEEKDAYS_EN = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

const MONTH_NAMES_DE = [
  { full: "Januar", short: "Jan" },
  { full: "Februar", short: "Feb" },
  { full: "März", short: "Mär" },
  { full: "April", short: "Apr" },
  { full: "Mai", short: "Mai" },
  { full: "Juni", short: "Jun" },
  { full: "Juli", short: "Jul" },
  { full: "August", short: "Aug" },
  { full: "September", short: "Sep" },
  { full: "Oktober", short: "Okt" },
  { full: "November", short: "Nov" },
  { full: "Dezember", short: "Dez" },
];

const MONTH_NAMES_EN = [
  { full: "January", short: "Jan" },
  { full: "February", short: "Feb" },
  { full: "March", short: "Mar" },
  { full: "April", short: "Apr" },
  { full: "May", short: "May" },
  { full: "June", short: "Jun" },
  { full: "July", short: "Jul" },
  { full: "August", short: "Aug" },
  { full: "September", short: "Sep" },
  { full: "October", short: "Oct" },
  { full: "November", short: "Nov" },
  { full: "December", short: "Dec" },
];

function parseDateInput(d?: Date | string | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? null : d;
  }
  // Try YYYY-MM-DD
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (match && match[1] && match[2] && match[3]) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(d: Date, locale: "de" | "en"): string {
  const day = String(d.getDate()).padStart(2, "0");
  const months = locale === "de" ? MONTH_NAMES_DE : MONTH_NAMES_EN;
  const monthName = months[d.getMonth()]?.short || "";
  const year = d.getFullYear();
  return `${day}. ${monthName} ${year}`;
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  locale = "de",
  className = "",
  showQuickActions = true,
}) => {
  const selectedDate = useMemo(() => parseDateInput(value), [value]);
  const parsedMin = useMemo(() => parseDateInput(minDate), [minDate]);
  const parsedMax = useMemo(() => parseDateInput(maxDate), [maxDate]);

  // Current view year & month
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : new Date().getMonth();
  });

  // Decade anchor for year picker view
  const [decadeStart, setDecadeStart] = useState<number>(() => {
    const current = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
    return Math.floor(current / 12) * 12;
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>("days");

  const monthNames = locale === "de" ? MONTH_NAMES_DE : MONTH_NAMES_EN;
  const weekdays = locale === "de" ? WEEKDAYS_DE : WEEKDAYS_EN;

  const today = useMemo(() => new Date(), []);

  // Previous month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // Next month navigation
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Previous year navigation
  const handlePrevYear = () => {
    setViewYear((y) => y - 1);
  };

  // Next year navigation
  const handleNextYear = () => {
    setViewYear((y) => y + 1);
  };

  // Handle day click
  const handleSelectDay = (dayDate: Date) => {
    if (onChange) {
      onChange(dayDate, formatDateToIso(dayDate));
    }
    if (dayDate.getMonth() !== viewMonth) {
      setViewMonth(dayDate.getMonth());
      setViewYear(dayDate.getFullYear());
    }
  };

  // Jump to today
  const handleJumpToToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setViewMode("days");
    if (onChange) {
      onChange(today, formatDateToIso(today));
    }
  };

  // Clear date
  const handleClear = () => {
    if (onChange) {
      onChange(today, "");
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Monday as 0: (getDay() + 6) % 7
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

    const days: Array<{
      dayNumber: number;
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dayOfWeek = prevDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const isDisabled =
        (parsedMin
          ? prevDate < new Date(parsedMin.getFullYear(), parsedMin.getMonth(), parsedMin.getDate())
          : false) ||
        (parsedMax
          ? prevDate > new Date(parsedMax.getFullYear(), parsedMax.getMonth(), parsedMax.getDate())
          : false);

      const isSel = selectedDate
        ? selectedDate.getFullYear() === prevDate.getFullYear() &&
          selectedDate.getMonth() === prevDate.getMonth() &&
          selectedDate.getDate() === prevDate.getDate()
        : false;

      const isTod =
        today.getFullYear() === prevDate.getFullYear() &&
        today.getMonth() === prevDate.getMonth() &&
        today.getDate() === prevDate.getDate();

      days.push({
        dayNumber: dayNum,
        date: prevDate,
        isCurrentMonth: false,
        isDisabled,
        isSelected: isSel,
        isToday: isTod,
        isWeekend,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const thisDate = new Date(viewYear, viewMonth, dayNum);
      const dayOfWeek = thisDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const isDisabled =
        (parsedMin
          ? thisDate < new Date(parsedMin.getFullYear(), parsedMin.getMonth(), parsedMin.getDate())
          : false) ||
        (parsedMax
          ? thisDate > new Date(parsedMax.getFullYear(), parsedMax.getMonth(), parsedMax.getDate())
          : false);

      const isSel = selectedDate
        ? selectedDate.getFullYear() === thisDate.getFullYear() &&
          selectedDate.getMonth() === thisDate.getMonth() &&
          selectedDate.getDate() === thisDate.getDate()
        : false;

      const isTod =
        today.getFullYear() === thisDate.getFullYear() &&
        today.getMonth() === thisDate.getMonth() &&
        today.getDate() === thisDate.getDate();

      days.push({
        dayNumber: dayNum,
        date: thisDate,
        isCurrentMonth: true,
        isDisabled,
        isSelected: isSel,
        isToday: isTod,
        isWeekend,
      });
    }

    // Next month padding days to complete grid (multiples of 7, up to 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const dayOfWeek = nextDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const isDisabled =
        (parsedMin
          ? nextDate < new Date(parsedMin.getFullYear(), parsedMin.getMonth(), parsedMin.getDate())
          : false) ||
        (parsedMax
          ? nextDate > new Date(parsedMax.getFullYear(), parsedMax.getMonth(), parsedMax.getDate())
          : false);

      const isSel = selectedDate
        ? selectedDate.getFullYear() === nextDate.getFullYear() &&
          selectedDate.getMonth() === nextDate.getMonth() &&
          selectedDate.getDate() === nextDate.getDate()
        : false;

      const isTod =
        today.getFullYear() === nextDate.getFullYear() &&
        today.getMonth() === nextDate.getMonth() &&
        today.getDate() === nextDate.getDate();

      days.push({
        dayNumber: i,
        date: nextDate,
        isCurrentMonth: false,
        isDisabled,
        isSelected: isSel,
        isToday: isTod,
        isWeekend,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, parsedMin, parsedMax, today]);

  // 12 years in current decade
  const yearsGrid = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(decadeStart + i);
    }
    return years;
  }, [decadeStart]);

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5DDD2] p-3.5 sm:p-4 shadow-lg select-none max-w-sm w-full font-sans transition-all duration-150 ${className}`}
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1] gap-1.5">
        {/* Previous Month / Prev Year button */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={viewMode === "years" ? () => setDecadeStart((d) => d - 12) : handlePrevYear}
            title={locale === "de" ? "Vorheriges Jahr" : "Previous Year"}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>

          {viewMode === "days" && (
            <button
              type="button"
              onClick={handlePrevMonth}
              title={locale === "de" ? "Vorheriger Monat" : "Previous Month"}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* View Switchers: Month & Year Buttons */}
        <div className="flex items-center gap-1">
          {/* Month selector trigger */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "months" ? "days" : "months"))}
            className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              viewMode === "months"
                ? "bg-[#FAF7F2] text-[#A12D3A] ring-1 ring-[#A12D3A]/20"
                : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A]"
            }`}
          >
            {monthNames[viewMonth]?.full}
          </button>

          {/* Year selector trigger */}
          <button
            type="button"
            onClick={() => {
              setDecadeStart(Math.floor(viewYear / 12) * 12);
              setViewMode((m) => (m === "years" ? "days" : "years"));
            }}
            className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              viewMode === "years"
                ? "bg-[#FAF7F2] text-[#A12D3A] ring-1 ring-[#A12D3A]/20"
                : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A]"
            }`}
          >
            {viewMode === "years" ? `${decadeStart} – ${decadeStart + 11}` : viewYear}
          </button>
        </div>

        {/* Next Month / Next Year button */}
        <div className="flex items-center gap-0.5">
          {viewMode === "days" && (
            <button
              type="button"
              onClick={handleNextMonth}
              title={locale === "de" ? "Nächster Monat" : "Next Month"}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={viewMode === "years" ? () => setDecadeStart((d) => d + 12) : handleNextYear}
            title={locale === "de" ? "Nächstes Jahr" : "Next Year"}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* VIEW: MONTHS PICKER GRID */}
      {viewMode === "months" && (
        <div
          className="py-2.5 grid grid-cols-3 gap-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {monthNames.map((m, idx) => {
            const isCurrent = idx === viewMonth;
            const isThisMonth = idx === today.getMonth() && viewYear === today.getFullYear();

            return (
              <button
                key={m.full}
                type="button"
                onClick={() => {
                  setViewMonth(idx);
                  setViewMode("days");
                }}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isCurrent
                    ? "bg-[#A12D3A] text-white shadow-xs font-bold"
                    : isThisMonth
                      ? "bg-[#FAF7F2] text-[#A12D3A] border border-[#A12D3A]/40 font-bold hover:bg-[#A12D3A]/10"
                      : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A]"
                }`}
              >
                <span>{m.short}</span>
                <span className={`text-[10px] ${isCurrent ? "text-white/80" : "text-[#7A6E62]"}`}>
                  {m.full}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW: YEARS PICKER GRID */}
      {viewMode === "years" && (
        <div
          className="py-2.5 grid grid-cols-3 gap-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {yearsGrid.map((yr) => {
            const isCurrent = yr === viewYear;
            const isThisYear = yr === today.getFullYear();

            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setViewYear(yr);
                  setViewMode("days");
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#A12D3A] text-white shadow-xs font-bold"
                    : isThisYear
                      ? "bg-[#FAF7F2] text-[#A12D3A] border border-[#A12D3A]/40 font-bold hover:bg-[#A12D3A]/10"
                      : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A]"
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW: NORMAL DAYS GRID */}
      {viewMode === "days" && (
        <>
          {/* Weekday Labels */}
          <div
            className="grid grid-cols-7 pt-2 pb-1 text-center border-b border-[#F5EFE6]"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              textAlign: "center",
            }}
          >
            {weekdays.map((wd, idx) => {
              const isWeekend = idx === 5 || idx === 6;
              return (
                <span
                  key={wd.short}
                  title={wd.full}
                  className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                    isWeekend ? "text-[#B45309]" : "text-[#9C8E7E]"
                  }`}
                >
                  {wd.short}
                </span>
              );
            })}
          </div>

          {/* Days Grid */}
          <div
            className="grid grid-cols-7 gap-1 pt-1.5"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: "4px",
            }}
          >
            {calendarDays.map((item, idx) => {
              const { dayNumber, date, isCurrentMonth, isDisabled, isSelected, isToday, isWeekend } = item;

              let btnStyle =
                "relative w-full aspect-square flex items-center justify-center text-xs font-semibold rounded-xl transition-all cursor-pointer select-none ";

              if (isDisabled) {
                btnStyle += "text-[#D5C9B8] opacity-35 cursor-not-allowed pointer-events-none ";
              } else if (isSelected) {
                btnStyle += "bg-[#A12D3A] text-white font-bold shadow-md shadow-[#A12D3A]/25 scale-[1.05] z-10 ";
              } else if (isToday) {
                btnStyle +=
                  "border-1.5 border-[#A12D3A] text-[#A12D3A] font-bold bg-[#FAF7F2] hover:bg-[#A12D3A]/10 active:scale-95 ";
              } else if (isCurrentMonth) {
                btnStyle += isWeekend
                  ? "text-[#78350F] hover:bg-[#FAF7F2] hover:text-[#A12D3A] active:scale-95 "
                  : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A] active:scale-95 ";
              } else {
                // Adjacent month padding days
                btnStyle += "text-[#C4B7A6] hover:bg-[#FAF7F2]/80 hover:text-[#7A6E62] ";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(date)}
                  className={btnStyle}
                  style={{
                    aspectRatio: "1 / 1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={date.toDateString()}
                  aria-selected={isSelected}
                >
                  <span>{dayNumber}</span>
                  {/* Subtle small dot for today if not selected */}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#A12D3A]" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* FOOTER QUICK ACTIONS & SELECTED DATE DISPLAY */}
      {showQuickActions && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F0EAE1] text-xs">
          {/* Quick jump to Today */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="inline-flex items-center gap-1.5 font-bold text-[#A12D3A] hover:text-[#88222E] hover:underline cursor-pointer transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A12D3A]" />
            <span>{locale === "de" ? "Heute" : "Today"}</span>
          </button>

          {/* Current Selection / Clear Action */}
          <div className="flex items-center gap-2">
            {selectedDate ? (
              <>
                <span className="text-[11px] font-semibold text-[#7A6E62] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E5DDD2]">
                  {formatDisplayDate(selectedDate, locale)}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  title={locale === "de" ? "Datum zurücksetzen" : "Clear date"}
                  className="text-[#9C8E7E] hover:text-[#A12D3A] font-medium p-0.5 rounded-sm transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <span className="text-[11px] text-[#9C8E7E]">
                {locale === "de" ? "Kein Datum gewählt" : "No date selected"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Calendar.displayName = "Calendar";
