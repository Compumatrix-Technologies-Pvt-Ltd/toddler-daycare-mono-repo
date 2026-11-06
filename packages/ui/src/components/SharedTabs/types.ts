// Shared Tabs Component Types

export interface TabItem {
  id: string;
  label: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export type TabVariant = "card" | "underline";

export interface SharedTabsProps {
  variant: TabVariant;
  tabs: TabItem[];
  value?: string | undefined;
  onChange?: ((tabId: string) => void) | undefined;
  className?: string | undefined;
  fullWidth?: boolean | undefined;
  activeClassName?: string | undefined;
  inactiveClassName?: string | undefined;
}

// Card Tabs specific props
export interface CardTabsProps extends Omit<SharedTabsProps, "variant"> {
  variant?: "card";
}

// Underline Tabs specific props
export interface UnderlineTabsProps extends Omit<SharedTabsProps, "variant"> {
  variant?: "underline";
}
