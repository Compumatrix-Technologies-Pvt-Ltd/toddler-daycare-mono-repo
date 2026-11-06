import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#D4AF37] text-white hover:bg-[#D4AF37] focus:ring-blue-500 border border-transparent",
  secondary:
    "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 border border-transparent",
  outline:
    "bg-transparent text-[#D4AF37] hover:bg-blue-50 focus:ring-blue-500 border border-[#D4AF37]",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-transparent",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      startIcon,
      endIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md font-medium h-10",
          "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          (startIcon || leftIcon) && (
            <span className="shrink-0">{startIcon || leftIcon}</span>
          )
        )}
        {children}
        {!loading && (endIcon || rightIcon) && (
          <span className="shrink-0">{endIcon || rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
