"use client";

import React, { useState, useRef, useEffect, ReactNode, useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode | undefined;
  disabled?: boolean | undefined;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string | undefined;
  size?: ("sm" | "md" | "lg") | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  icon?: ReactNode | undefined;
  label?: string | undefined;
  id?: string | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  menuAlign?: ("left" | "right") | undefined;
}

export const SELECT_CLASS =
  "w-full bg-white border border-[#E5DDD2] rounded-xl px-3.5 py-2 pr-9 text-xs sm:text-sm text-[#1E1B18] font-medium focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/15 focus:border-[#A12D3A] min-h-[42px] transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%237A6E62%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.6%22%20d%3D%22m5%207.5%205%205%205-5%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_10px_center] bg-no-repeat";

const sizeClasses = {
  sm: "min-h-[36px] py-1.5 px-3 text-xs",
  md: "min-h-[42px] py-2 px-3.5 text-xs sm:text-sm",
  lg: "min-h-[48px] py-2.5 px-4 text-sm sm:text-base",
};

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Bitte auswählen...",
  size = "md",
  className = "",
  ariaLabel,
  icon,
  label,
  id: customId,
  error,
  disabled = false,
  required = false,
  menuAlign = "left",
}) => {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const genId = useId();
  const selectId = customId || genId;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      setOpen((prev) => !prev);
      const currentIndex = options.findIndex((o) => o.value === value);
      setFocusIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#4E443B]"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={handleButtonKeyDown}
          aria-label={ariaLabel ?? label ?? placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white font-medium text-[#1E1B18] shadow-2xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/15 focus:border-[#A12D3A] ${
            sizeClasses[size]
          } ${
            error
              ? "border-[#DC2626]"
              : "border-[#E5DDD2] hover:border-[#A12D3A]/50"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-[#FAF7F2]" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {icon && <span className="shrink-0 text-[#7A6E62]">{icon}</span>}
            {selected?.icon && (
              <span className="shrink-0">{selected.icon}</span>
            )}
            <span
              className={`truncate ${
                selected ? "text-[#1E1B18] font-semibold" : "text-[#9C8E7E]"
              }`}
            >
              {selected ? selected.label : placeholder}
            </span>
          </span>

          <svg
            className={`w-4 h-4 shrink-0 text-[#7A6E62] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div
            className={`absolute z-[100] mt-1.5 w-full min-w-[200px] max-h-60 overflow-y-auto rounded-xl border border-[#E5DDD2] bg-white p-1 shadow-xl scrollbar-thin ${
              menuAlign === "right" ? "right-0" : "left-0"
            }`}
            style={{ backgroundColor: "#FFFFFF" }}
            role="listbox"
            tabIndex={-1}
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isFocused = idx === focusIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleOptionClick(option.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    option.disabled
                      ? "opacity-40 cursor-not-allowed text-[#9C8E7E]"
                      : isSelected
                        ? "bg-[#FAF7F2] text-[#A12D3A] font-bold"
                        : isFocused
                          ? "bg-[#FAF7F2] text-[#1E1B18]"
                          : "text-[#1E1B18] hover:bg-[#FAF7F2] hover:text-[#A12D3A]"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>

                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-[#A12D3A] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
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

Select.displayName = "Select";

/**
 * NativeSelect: Accessible wrapper for standard HTML select elements with custom SVG chevron & Toddler tokens
 */
export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  error?: string | undefined;
  options?: SelectOption[] | undefined;
  containerClassName?: string | undefined;
}

export const NativeSelect: React.FC<NativeSelectProps> = ({
  label,
  error,
  options,
  children,
  className = "",
  containerClassName = "",
  id: customId,
  required,
  ...rest
}) => {
  const genId = useId();
  const selectId = customId || genId;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#4E443B]"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <select
          id={selectId}
          required={required}
          className={`${SELECT_CLASS} ${
            error
              ? "!border-[#DC2626] focus:!border-[#DC2626] focus:!ring-[#DC2626]/15"
              : ""
          } ${className}`}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>

      {error && (
        <p className="text-xs text-[#DC2626] font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

NativeSelect.displayName = "NativeSelect";
