import React, { useState, useRef, useEffect, ReactNode, useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  ariaLabel?: string;
  icon?: ReactNode | null;
  label?: string;
  id?: string;
}

const sizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
  small: "h-10  px-4 text-sm",
  medium: "h-14  px-5 text-[15px]",
  large: "h-16  px-6 text-base",
};

const iconSizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
  small: "h-5 w-5",
  medium: "h-6 w-6",
  large: "h-7 w-7",
};

const chevronSizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
  small: "h-4 w-4",
  medium: "h-5 w-5",
  large: "h-6 w-6",
};

const dropdownSpacingClasses: Record<
  NonNullable<SelectProps["size"]>,
  string
> = {
  small: "mt-1 rounded-xl",
  medium: "mt-2 rounded-2xl",
  large: "mt-2 rounded-2xl",
};

const DefaultIcon: React.FC<{ size: NonNullable<SelectProps["size"]> }> = ({
  size,
}) => (
  <svg
    className={`${iconSizeClasses[size]} shrink-0 text-[#8C8C8C]`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  size = "medium",
  className = "",
  ariaLabel,
  icon,
  label,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="inline-flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-start text-gray-700"
        >
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative inline-block">
        <button
          type="button"
          id={selectId}
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-[#ECECEC] font-medium text-slate-900 shadow-sm transition-colors hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${sizeClasses[size]} ${className}`}
          aria-label={ariaLabel ?? placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-3">
            {icon === null ? null : (icon ?? <DefaultIcon size={size} />)}
            <span className="truncate">
              {selected ? selected.label : placeholder}
            </span>
          </span>

          <svg
            className={`${chevronSizeClasses[size]} shrink-0 text-[#8C8C8C] transition-transform ${open ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div
            className={`absolute right-0 z-50 min-w-full overflow-hidden border border-gray-200 bg-white shadow-lg ${dropdownSpacingClasses[size]}`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-5 py-3 text-left text-sm transition-colors ${
                  option.value === value
                    ? "bg-[#D4AF37] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
