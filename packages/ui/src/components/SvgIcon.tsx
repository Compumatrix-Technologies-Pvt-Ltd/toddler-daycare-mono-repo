import React from "react";

export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
  /** The font size of the icon. Defaults to 'medium' */
  fontSize?: "small" | "medium" | "large" | "inherit";
  /** The color of the icon. Defaults to 'inherit' */
  color?: "inherit" | "primary" | "secondary" | "error" | "disabled" | "action";
  /** The SVG viewBox. Defaults to "0 0 24 24" */
  viewBox?: string;
  /** The SVG content (usually <path> elements) */
  children?: React.ReactNode;
}

const fontSizeMap = {
  small: "h-5 w-5",
  medium: "h-6 w-6",
  large: "h-9 w-9",
  inherit: "h-[1em] w-[1em]",
};

const colorMap = {
  inherit: "text-inherit",
  primary: "text-[#D4AF37]",
  secondary: "text-gray-600",
  error: "text-red-500",
  disabled: "text-gray-300",
  action: "text-gray-500",
};

/**
 * SvgIcon — A reusable icon wrapper that behaves like MUI SvgIcon.
 * Uses 'fill-current' so that it inherits color from the text color classes.
 */
export const SvgIcon: React.FC<SvgIconProps> = ({
  children,
  fontSize = "medium",
  color = "inherit",
  viewBox = "0 0 24 24",
  className = "",
  ...props
}) => {
  const sizeClass = fontSizeMap[fontSize] || fontSizeMap.medium;
  const colorClass = colorMap[color] || colorMap.inherit;

  return (
    <svg
      viewBox={viewBox}
      className={`inline-block shrink-0 fill-current transition-colors duration-200 ${sizeClass} ${colorClass} ${className}`}
      focusable="false"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
};

SvgIcon.displayName = "SvgIcon";
