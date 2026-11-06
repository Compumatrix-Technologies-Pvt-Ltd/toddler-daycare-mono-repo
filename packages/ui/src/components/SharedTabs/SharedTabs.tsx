import React from "react";
import type { SharedTabsProps } from "./types";
import { UnderlineTabs } from "./UnderlineTabs";
import { CardTabs } from "./CardTabs";

export const SharedTabs: React.FC<SharedTabsProps> = ({
  variant,
  tabs,
  value,
  onChange,
  className,
  fullWidth,
  activeClassName,
  inactiveClassName,
}) => {
  const sharedProps = {
    tabs,
    value,
    onChange,
    className,
    fullWidth,
    activeClassName,
    inactiveClassName,
  };

  switch (variant) {
    case "card":
      return <CardTabs {...sharedProps} />;
    case "underline":
      return <UnderlineTabs {...sharedProps} />;
    default:
      return null;
  }
};

SharedTabs.displayName = "SharedTabs";
