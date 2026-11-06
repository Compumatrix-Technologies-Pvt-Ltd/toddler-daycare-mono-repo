"use client";

import React, { useEffect, useRef } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchor?: "left" | "right";
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  anchor = "left",
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={[
          "absolute top-0 bottom-0 w-72 max-w-[85vw] bg-[#F9F3E1] shadow-xl",
          "flex flex-col overflow-y-auto",
          anchor === "left" ? "left-0" : "right-0",
          "animate-slide-in",
        ].join(" ")}
        style={{
          animation: `slideIn 0.2s ease-out forwards`,
        }}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4">{children}</div>
      </div>

      {/* Animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideIn {
              from {
                transform: ${anchor === "left" ? "translateX(-100%)" : "translateX(100%)"};
              }
              to {
                transform: translateX(0);
              }
            }
          `,
        }}
      />
    </div>
  );
};
