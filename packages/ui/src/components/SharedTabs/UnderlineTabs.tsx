import React, { useCallback, useId } from "react";
import { motion } from "framer-motion";
import type { TabItem, UnderlineTabsProps } from "./types";

const underlineTabClasses = {
  container: "flex overflow-x-auto scrollbar-none -mb-px gap-1 sm:gap-2",
  tab: {
    base: "relative flex items-center gap-1.5 whitespace-nowrap py-2 px-1 text-sm font-medium transition-colors duration-300 cursor-pointer focus:outline-none",
    active: "text-[#D4AF37]",
    inactive: "text-gray-500 hover:text-gray-700",
    disabled: "opacity-50 cursor-not-allowed text-gray-400",
  },
  label: "relative",
  badge:
    "ml-1.5 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-1.5 py-0.5 text-xs font-medium text-white",
};

export const UnderlineTabs: React.FC<UnderlineTabsProps> = ({
  tabs,
  value,
  onChange,
  className = "",
  fullWidth = false,
  activeClassName = "",
  inactiveClassName = "",
}) => {
  const tablistId = useId();
  const enabledTabs = tabs.filter((tab) => !tab.disabled);
  const activeTab = tabs.find((tab) => tab.id === value);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const currentTab = tabs[currentIndex];
      if (!currentTab) {
        return;
      }

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
    [tabs, enabledTabs, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label="Navigation tabs"
      aria-activedescendant={value ? `${tablistId}-tab-${value}` : undefined}
      className={[
        underlineTabClasses.container,
        fullWidth ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "",
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
              underlineTabClasses.tab.base,
              isActive
                ? underlineTabClasses.tab.active
                : underlineTabClasses.tab.inactive,
              isDisabled ? underlineTabClasses.tab.disabled : "",
              fullWidth ? "flex-1" : "",
              isActive ? activeClassName : inactiveClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isActive && (
              <motion.div
                layoutId={`${tablistId}-underline`}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.icon && (
              <span aria-hidden="true" className="h-4 w-4 shrink-0">
                {tab.icon}
              </span>
            )}
            <span className={underlineTabClasses.label}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={underlineTabClasses.badge}
                aria-label={`Badge: ${tab.badge}`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

UnderlineTabs.displayName = "UnderlineTabs";
