import React, { useCallback, useId } from "react";
import { motion } from "framer-motion";
import type { TabItem, CardTabsProps } from "./types";

const cardTabClasses = {
  tab: {
    base: "relative flex flex-col sm:flex-row lg:flex-row items-center bg-[#F8FAFC] justify-center gap-4  p-4 transition-all duration-300 cursor-pointer text-gray-900 overflow-hidden",
    active: "border-[#D4AF37] shadow-sm",
    inactive: "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
    disabled: "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400",
    fullWidth: "flex-1 min-w-0",
  },
  icon: "h-6 w-6 shrink-0 text-gray-500",
  iconActive: "text-[#D4AF37]",
  title: "text-sm font-bold text-cnter sm:text-left",
  description:
    "text-[10px] text-[#64748B] font-normal text-center sm:text-left line-clamp-2",
};

export const CardTabs: React.FC<CardTabsProps> = ({
  tabs,
  value,
  onChange,
  className = "",
  fullWidth = true,
  activeClassName = "",
  inactiveClassName = "",
}) => {
  const tablistId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const currentTab = tabs[currentIndex];
      if (!currentTab) {
        return;
      }

      const enabledTabs = tabs.filter((tab) => !tab.disabled);
      const currentEnabledIndex = enabledTabs.findIndex(
        (tab) => tab.id === currentTab.id,
      );

      let nextIndex: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentEnabledIndex + 1) % enabledTabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex =
          (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = enabledTabs.length - 1;
      }

      if (nextIndex !== null) {
        const nextTab = enabledTabs[nextIndex];
        if (nextTab) {
          onChange?.(nextTab.id);
        }
      }
    },
    [tabs, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label="Service tabs"
      aria-activedescendant={value ? `${tablistId}-tab-${value}` : undefined}
      className={[
        "flex flex-wrap",
        fullWidth ? "grid grid-cols-3 w-full" : "flex",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === value;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            id={`${tablistId}-tab-${tab.id}`}
            role="tab"
            type="button"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            aria-disabled={isDisabled}
            aria-controls={`${tablistId}-panel-${tab.id}`}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange?.(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              cardTabClasses.tab.base,
              isActive
                ? cardTabClasses.tab.active
                : cardTabClasses.tab.inactive,
              isDisabled ? cardTabClasses.tab.disabled : "",
              fullWidth ? cardTabClasses.tab.fullWidth : "",
              isActive ? activeClassName : inactiveClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isActive && (
              <motion.div
                layoutId={`${tablistId}-active-pill`}
                className="absolute inset-0 bg-[#D4AF37]/10 -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            {tab.badge !== undefined && (
              <span
                className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-2 py-0.5 text-xs font-medium text-white"
                aria-label={`Badge: ${tab.badge}`}
              >
                {tab.badge}
              </span>
            )}
            {tab.icon && (
              <span
                className={[
                  cardTabClasses.icon,
                  isActive ? cardTabClasses.iconActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
              >
                {tab.icon}
              </span>
            )}
            <div className="flex flex-col items-center sm:items-start gap-1">
              {tab.title ? (
                <span className={cardTabClasses.title}>{tab.title}</span>
              ) : (
                <span className={cardTabClasses.title}>{tab.label}</span>
              )}
              {tab.description && (
                <span className={cardTabClasses.description}>
                  {tab.description}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

CardTabs.displayName = "CardTabs";
