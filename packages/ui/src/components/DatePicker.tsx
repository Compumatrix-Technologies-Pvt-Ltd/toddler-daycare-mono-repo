import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DatePickerProps {
  value?: Date | undefined;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  minDate?: Date | undefined;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select date...",
  error,
  className = "",
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [align, setAlign] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate placement and alignment when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const popoverHeight = 400; // Estimated height of the calendar popover
      const popoverWidth = 288; // 72 * 4 (w-72)

      // Vertical placement
      const shouldShowTop =
        rect.bottom + popoverHeight > viewportHeight &&
        rect.top > popoverHeight;
      setPlacement(shouldShowTop ? "top" : "bottom");

      // Horizontal alignment (ensure it doesn't cut off at the "end")
      const shouldAlignRight = rect.left + popoverWidth > viewportWidth;
      setAlign(shouldAlignRight ? "right" : "left");
    }
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selected);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    return (
      value &&
      value.getDate() === day &&
      value.getMonth() === viewDate.getMonth() &&
      value.getFullYear() === viewDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const isBeforeMinDate = (day: number) => {
    if (!minDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return (
      current <
      new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    );
  };

  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const year = viewDate.getFullYear();
  const days = Array.from(
    { length: daysInMonth(year, viewDate.getMonth()) },
    (_, i) => i + 1,
  );
  const blanks = Array.from(
    { length: firstDayOfMonth(year, viewDate.getMonth()) },
    (_, i) => i,
  );
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`flex flex-col gap-1.5  ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full !h-[56px] items-center justify-between gap-2 rounded-2xl border bg-[#ECECEC] px-4 py-3.5 text-left text-[15px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
            error ? "border-red-500" : "border-transparent"
          }`}
        >
          <span className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-[#8C8C8C] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={value ? "text-slate-900" : "text-gray-400"}>
              {value ? value.toLocaleDateString() : placeholder}
            </span>
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: placement === "bottom" ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: placement === "bottom" ? 10 : -10 }}
              className={`
                absolute z-[100] w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl
                ${placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"}
                ${align === "left" ? "left-0" : "right-0"}
              `}
              style={{
                transformOrigin: placement === "bottom" ? "top" : "bottom",
              }}
            >
              {/* Calendar Header */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-900">
                  {monthName} {year}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Weekdays */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {weekDays.map((wd) => (
                  <span
                    key={wd}
                    className="text-[10px] font-bold uppercase tracking-wider text-gray-400"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((b) => (
                  <div key={`blank-${b}`} />
                ))}
                {days.map((day) => {
                  const disabled = isBeforeMinDate(day);
                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDateSelect(day)}
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors
                        ${disabled ? "cursor-not-allowed text-gray-200" : "cursor-pointer"}
                        ${
                          selected
                            ? "bg-[#D4AF37] text-white"
                            : !disabled
                              ? "text-gray-700 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                              : ""
                        }
                        ${today && !selected ? "border border-[#D4AF37] text-[#D4AF37]" : ""}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange(new Date());
                    setIsOpen(false);
                  }}
                  className="text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  Go to Today
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

DatePicker.displayName = "DatePicker";
