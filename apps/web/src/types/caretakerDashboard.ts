export type BookingCategory = "current" | "future" | "inquiry";

export interface ParentContact {
  parents: string;
  phone: string;
  email: string;
}

export interface RecommendedAllocation {
  slotText: string;
  slotTextDe: string;
  vacantMonthsText: string;
  vacantMonthsTextDe: string;
  note: string;
  noteDe: string;
}

export type InquiryStatus = "New" | "Reviewing" | "Invited" | "Accepted" | "Declined";

export interface BookingItem {
  id: string;
  childName: string;
  childAge: string;
  childAgeDe: string;
  placementStart: string;
  placementStartDe: string;
  kindergartenTransition: string;
  kindergartenTransitionDe: string;
  period: string;
  periodDe: string;
  startMonthIndex: number; // 0 = Aug 2026
  endMonthIndex: number; // inclusive
  dailyHours: string;
  dailyHoursDe: string;
  parentContact: ParentContact;
  category: BookingCategory;
  matchPercent?: number; // e.g. 65 for Hans
  flexibility?: string; // e.g. "±1 mo"
  isExtendingRight?: boolean; // Fritz & Gustav extending to 2029
  isBooked?: boolean;
  inquiryStatus?: InquiryStatus;
  recommendedAllocation?: RecommendedAllocation;
  dob?: string;
  desiredStart?: string;
  desiredStartDe?: string;
  estTransition?: string;
  estTransitionDe?: string;
  preferences?: string;
  preferencesDe?: string;
  locationDistance?: string;
  locationDistanceDe?: string;
  parentQuote?: string;
  parentQuoteDe?: string;
}

export interface GanttMonth {
  id: string; // e.g. "2026-08"
  year: number;
  shortName: string; // e.g. "AUG"
  fullLabel: string; // e.g. "AUG 26"
  isCurrentMonth?: boolean; // Today column
}

export interface YearGroup {
  year: number;
  monthsCount: number;
}
