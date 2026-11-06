import React from "react";

export interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  className = "",
  label = "Loading…",
}) => {
  return (
    <span
      role="status"
      aria-label={label}
      className={["inline-block", className].filter(Boolean).join(" ")}
    >
      <span
        className={[
          "block animate-spin rounded-full border-[#D4AF37] border-t-transparent",
          sizeClasses[size],
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};
