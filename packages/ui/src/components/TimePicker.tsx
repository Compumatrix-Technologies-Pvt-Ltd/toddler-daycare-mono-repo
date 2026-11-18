"use client";

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from "react";

export interface TimePickerProps {
  value?: string | null | undefined; // "HH:MM" e.g. "08:00"
  onChange: (time: string) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  clearable?: boolean | undefined;
  minTime?: string | undefined;
  maxTime?: string | undefined;
  stepMinutes?: number | undefined; // default 15
  align?: "left" | "right" | "auto" | undefined;
  id?: string | undefined;
  locale?: "de" | "en" | undefined;
}

const DEFAULT_PRESETS = ["07:30", "08:00", "08:30", "09:00", "14:00", "15:00", "16:00", "17:00"];

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "--:--",
  error,
  className = "",
  disabled = false,
  required = false,
  clearable = true,
  minTime,
  maxTime,
  stepMinutes = 15,
  align: customAlign,
  id: customId,
  locale = "de",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [align, setAlign] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const genId = useId();
  const inputId = customId || genId;

  // Normalize HH:MM value
  const parsedTime = useMemo(() => {
    if (!value || typeof value !== "string") return null;
    const match = /(\d{1,2}):(\d{2})/.exec(value);
    if (match && match[1] && match[2]) {
      const h = match[1].padStart(2, "0");
      const m = match[2];
      return { hour: h, minute: m, raw: `${h}:${m}` };
    }
    return null;
  }, [value]);

  const selectedHour = parsedTime?.hour || "08";
  const selectedMinute = parsedTime?.minute || "00";

  // Parse min and max hour constraints
  const minHour = useMemo(() => {
    if (!minTime) return 6;
    const h = parseInt(minTime.split(":")[0] || "6", 10);
    return isNaN(h) ? 6 : h;
  }, [minTime]);

  const maxHour = useMemo(() => {
    if (!maxTime) return 21;
    const h = parseInt(maxTime.split(":")[0] || "21", 10);
    return isNaN(h) ? 21 : h;
  }, [maxTime]);

  // Generate available hours and minutes
  const hoursList = useMemo(() => {
    const list: string[] = [];
    const start = Math.max(0, Math.min(23, minHour));
    const end = Math.max(start, Math.min(23, maxHour));
    for (let h = start; h <= end; h++) {
      list.push(String(h).padStart(2, "0"));
    }
    return list;
  }, [minHour, maxHour]);

  const minutesList = useMemo(() => {
    const list: string[] = [];
    const step = Math.max(5, Math.min(30, stepMinutes));
    for (let m = 0; m < 60; m += step) {
      list.push(String(m).padStart(2, "0"));
    }
    return list;
  }, [stepMinutes]);

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

  // Calculate dynamic placement & horizontal alignment
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const popoverHeight = 310;
    const popoverWidth = 270;

    // Flip to top if overflowing below and enough room above
    const shouldShowTop =
      rect.bottom + popoverHeight > viewportHeight && rect.top > popoverHeight;
    setPlacement(shouldShowTop ? "top" : "bottom");

    if (customAlign && customAlign !== "auto") {
      setAlign(customAlign);
    } else {
      const shouldAlignRight =
        rect.left + popoverWidth > viewportWidth || rect.right > viewportWidth;
      setAlign(shouldAlignRight ? "right" : "left");
    }
  }, [customAlign]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  const handleSelectHour = (h: string) => {
    const nextTime = `${h}:${selectedMinute}`;
    onChange(nextTime);
  };

  const handleSelectMinute = (m: string) => {
    const nextTime = `${selectedHour}:${m}`;
    onChange(nextTime);
  };

  const handleSelectPreset = (preset: string) => {
    onChange(preset);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const displayValue = parsedTime?.raw || "";

  return (
    <div
      className={`relative flex flex-col gap-1.5 ${className}`}
      ref={containerRef}
      style={{
        position: "relative",
        zIndex: isOpen ? 9999 : 1,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#4E443B]"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div
        className="relative"
        style={{
          position: "relative",
          zIndex: isOpen ? 9999 : 1,
        }}
      >
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
          style={{
            backgroundColor: disabled ? "#FAF7F2" : "#FFFFFF",
            borderColor: error ? "#DC2626" : isOpen ? "#A12D3A" : "#E5DDD2",
            borderRadius: "12px",
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
          className={`w-full min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/15 focus:border-[#A12D3A] ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#A12D3A]/50"
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {/* Clock Vector SVG Icon */}
            <svg
              className="w-3.5 h-3.5 text-[#7A6E62] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>

            <span
              className={`truncate font-mono text-xs sm:text-[13px] ${
                displayValue ? "text-[#1E1B18] font-bold" : "text-[#9C8E7E]"
              }`}
            >
              {displayValue || placeholder}
            </span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {clearable && displayValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={locale === "de" ? "Zeit löschen" : "Clear time"}
                className="p-0.5 text-[#9C8E7E] hover:text-[#A12D3A] rounded-md transition-colors"
              >
                <svg
                  className="w-3 h-3"
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
              className={`w-3.5 h-3.5 text-[#7A6E62] transition-transform duration-200 ${
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
            ref={popoverRef}
            style={{
              position: "absolute",
              zIndex: 99999,
              width: "268px",
              maxWidth: "calc(100vw - 24px)",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5DDD2",
              borderRadius: "16px",
              boxShadow: "0 20px 30px -5px rgba(0, 0, 0, 0.22), 0 10px 15px -5px rgba(0, 0, 0, 0.12)",
              padding: "12px",
              ...(placement === "bottom"
                ? { top: "100%", marginTop: "6px" }
                : { bottom: "100%", marginBottom: "6px" }),
              ...(align === "left" ? { left: 0 } : { right: 0 }),
            }}
          >
            {/* Header: Clock and Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "8px",
                marginBottom: "8px",
                borderBottom: "1px solid #F2ECE3",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg
                  style={{ width: "14px", height: "14px", color: "#A12D3A" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#4B3E2F",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {locale === "de" ? "Schnellauswahl" : "Quick Select"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#A12D3A",
                  backgroundColor: "#FAF8F5",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  border: "1px solid #E5DDD2",
                }}
              >
                {displayValue || "--:--"}
              </span>
            </div>

            {/* Quick Presets Grid (4 columns x 2 rows) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "4px",
                marginBottom: "10px",
              }}
            >
              {DEFAULT_PRESETS.map((preset) => {
                const isActive = displayValue === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      height: "28px",
                      padding: "0 2px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      borderRadius: "6px",
                      border: isActive ? "1px solid #A12D3A" : "1px solid #E5DDD2",
                      cursor: "pointer",
                      textAlign: "center",
                      backgroundColor: isActive ? "#A12D3A" : "#FAF8F5",
                      color: isActive ? "#FFFFFF" : "#4B3E2F",
                      fontWeight: isActive ? 700 : 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Hours & Minutes Columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {/* Hours Column */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#7A6E62",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                    textAlign: "center",
                  }}
                >
                  {locale === "de" ? "Stunde" : "Hour"}
                </span>
                <div
                  style={{
                    height: "120px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid #E5DDD2",
                    backgroundColor: "#FAF8F5",
                    padding: "3px",
                  }}
                >
                  {hoursList.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelectHour(h)}
                        style={{
                          width: "100%",
                          padding: "3px 0",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          borderRadius: "4px",
                          border: "none",
                          textAlign: "center",
                          cursor: "pointer",
                          marginBottom: "2px",
                          backgroundColor: isSelected ? "#A12D3A" : "transparent",
                          color: isSelected ? "#FFFFFF" : "#1E1B18",
                          fontWeight: isSelected ? 700 : 500,
                          transition: "all 0.1s ease",
                        }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes Column */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#7A6E62",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                    textAlign: "center",
                  }}
                >
                  {locale === "de" ? "Minute" : "Minute"}
                </span>
                <div
                  style={{
                    height: "120px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid #E5DDD2",
                    backgroundColor: "#FAF8F5",
                    padding: "3px",
                  }}
                >
                  {minutesList.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        style={{
                          width: "100%",
                          padding: "3px 0",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          borderRadius: "4px",
                          border: "none",
                          textAlign: "center",
                          cursor: "pointer",
                          marginBottom: "2px",
                          backgroundColor: isSelected ? "#A12D3A" : "transparent",
                          color: isSelected ? "#FFFFFF" : "#1E1B18",
                          fontWeight: isSelected ? 700 : 500,
                          transition: "all 0.1s ease",
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions: Selected Summary & Apply Button */}
            <div
              style={{
                paddingTop: "8px",
                borderTop: "1px solid #F2ECE3",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "#7A6E62" }}>
                  {locale === "de" ? "Zeit:" : "Time:"}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#A12D3A",
                  }}
                >
                  {`${selectedHour}:${selectedMinute}`}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(`${selectedHour}:${selectedMinute}`);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "#A12D3A",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {locale === "de" ? "Übernehmen" : "Apply"}
                </button>
              </div>
            </div>
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

TimePicker.displayName = "TimePicker";
