"use client";

import React, { useEffect, useId, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  menuAlign?: "left" | "right";
}

export function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  menuAlign = "left",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  const selectValue = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
      setFocusIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionValue: string, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectValue(optionValue);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((index + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((index - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusIndex(options.length - 1);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={buttonId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        className="w-full flex items-center justify-between gap-2 bg-white border border-[#D5C9B8] rounded-xl pl-3 pr-2.5 py-2 text-xs sm:text-sm font-medium text-[#1E1B18] hover:border-[#A12D3A]/50 focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] cursor-pointer min-h-[42px] transition-colors"
      >
        <span className="truncate">{selected?.label}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-[#7D7063] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className={`absolute z-30 mt-1.5 min-w-full w-max max-w-[240px] rounded-xl border border-[#E2D8CC] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] p-1 max-h-60 overflow-y-auto kita-scrollbar ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => selectValue(option.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, option.value, index)}
                onMouseEnter={() => setFocusIndex(index)}
                className={`flex items-center justify-between gap-2 px-3 rounded-lg text-xs sm:text-sm cursor-pointer min-h-[40px] transition-colors outline-none ${
                  isSelected
                    ? "bg-[#FFF4F2] text-[#A12D3A] font-semibold"
                    : isFocused
                      ? "bg-[#F7F4EE] text-[#1E1B18]"
                      : "text-[#1E1B18] hover:bg-[#F7F4EE]"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
