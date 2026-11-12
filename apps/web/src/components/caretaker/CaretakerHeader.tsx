"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "@/utils/caretakerApi";
import { fetchInquiries } from "@/utils/inquery";
import { getSocket } from "@/utils/socket";
import { UnderReviewModal } from "./UnderReviewModal";

function parseSlotCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Compute initials dynamically (e.g. "Priya Sharma" -> "PS", "Maria" -> "MA")
function getInitials(name: string): string {
  if (!name || !name.trim()) return "CW";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CaretakerHeader() {
  const { t, language, setLanguage } = useLanguage();
  const { profile, approvalStatus, resetProfile } = useCaretaker();
  const pathname = usePathname();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Dynamic caretaker display name & navigation counts
  const [displayName, setDisplayName] = useState(
    profile.caregiverName ||
      profile.daycareName ||
      (profile.email ? profile.email.split("@")[0] : "Caretaker")
  );
  const [slotsCount, setSlotsCount] = useState<number>(() =>
    parseSlotCount(profile.permitAuthorizedCapacity || profile.maxCapacity)
  );
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);

  // Sync with profile updates and backend daycare / inquiries records
  useEffect(() => {
    let cancelled = false;

    if (profile.caregiverName) {
      setDisplayName(profile.caregiverName);
    } else if (profile.daycareName) {
      setDisplayName(profile.daycareName);
    } else if (profile.email) {
      setDisplayName(profile.email.split("@")[0]);
    } else {
      setDisplayName("Caretaker");
    }

    const profileSlots = parseSlotCount(
      profile.permitAuthorizedCapacity || profile.maxCapacity
    );
    setSlotsCount(profileSlots);

    const token = caretakerApi.getToken();
    if (!token) return;

    const caretakerId = caretakerApi.getCaretakerId();

    const syncCounts = () => {
      caretakerApi
        .getDaycare()
        .then((data) => {
          if (cancelled) return;
          if (data.caregiverName) {
            setDisplayName(data.caregiverName);
          } else if (data.daycareName) {
            setDisplayName(data.daycareName);
          }
          const backendSlots = parseSlotCount(
            data.operations?.maxCapacity ??
              data.workPermit?.authorizedCapacity ??
              profile.permitAuthorizedCapacity ??
              profile.maxCapacity
          );
          setSlotsCount(backendSlots);
        })
        .catch(() => {});

      fetchInquiries({
        ...(caretakerId ? { caretakerId } : {}),
        token,
      })
        .then((list) => {
          if (cancelled) return;
          setInquiriesCount(Array.isArray(list) ? list.length : 0);
        })
        .catch(() => {});
    };

    syncCounts();

    const socket = getSocket();
    if (socket) {
      if (caretakerId) {
        socket.emit("join:caretaker", caretakerId);
      }
      socket.on("inquiry:created", syncCounts);
      socket.on("inquiry:updated", syncCounts);
      socket.on("daycare:updated", syncCounts);
    }

    return () => {
      cancelled = true;
      if (socket) {
        socket.off("inquiry:created", syncCounts);
        socket.off("inquiry:updated", syncCounts);
        socket.off("daycare:updated", syncCounts);
      }
    };
  }, [
    profile.caregiverName,
    profile.daycareName,
    profile.email,
    profile.maxCapacity,
    profile.permitAuthorizedCapacity,
  ]);

  const isApproved = approvalStatus === "approved";

  const navItems: { href: string; label: string; count?: number }[] = [
    { href: "/caretaker/dashboard", label: t.caretakerProfile.nav.dashboard },
    {
      href: "/caretaker/slots",
      label: t.caretakerProfile.nav.daycareSlots,
      count: slotsCount,
    },
    {
      href: "/caretaker/inquiries",
      label: t.caretakerProfile.nav.parentInquiries,
      count: inquiriesCount,
    },
  ];

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLockedNotice(t.caretakerProfile.nav.lockedTooltip);
    setTimeout(() => {
      setLockedNotice(null);
    }, 3500);
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b border-[#EBE3D7] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 pt-[max(0.625rem,env(safe-area-inset-top))] relative shadow-xs">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 shrink sm:shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative shrink-0">
            <svg
              viewBox="0 0 36 36"
              className="w-9 h-9 sm:w-10 sm:h-10 text-[#EAA000]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="18" r="9" fill="#FBBF24" />
              <path
                d="M18 3v4M18 29v4M3 18h4M29 18h4M7.4 7.4l2.8 2.8M25.8 25.8l2.8 2.8M7.4 28.6l2.8-2.8M25.8 10.2l2.8-2.8"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="15" cy="16" r="1.2" fill="#78350F" />
              <circle cx="21" cy="16" r="1.2" fill="#78350F" />
              <path
                d="M15 20c1 1.2 5 1.2 6 0"
                stroke="#78350F"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#423223] text-sm sm:text-lg leading-tight tracking-tight truncate sm:whitespace-nowrap">
              {t.brand.title}
            </div>
            <div className="text-[10px] sm:text-xs text-[#8A775C] tracking-wide truncate sm:whitespace-nowrap">
              {t.brand.subtitle}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-6 text-[13px] xl:text-[14px] font-medium text-[#514532] whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isClickable = item.href === "/caretaker/dashboard" || isApproved;

            if (isClickable) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-all py-1.5 cursor-pointer flex items-center gap-1.5 relative shrink-0 whitespace-nowrap ${isActive
                    ? "text-[#7C5800] font-semibold border-b-2 border-[#7C5800] pb-1"
                    : "text-[#514532] hover:text-[#7C5800]"
                    }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums ${
                        isActive
                          ? "bg-[#7C5800] text-white"
                          : "bg-[#F3ECE2] text-[#514532] border border-[#E5DDD2]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <button
                key={item.href}
                type="button"
                onClick={handleLockedClick}
                className="text-[#514532] hover:text-[#A12D3A] transition-colors py-1.5 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-[#A12D3A] bg-[#FEF2F2] px-1.5 py-0.5 rounded-sm shrink-0">
                  {t.caretakerProfile.nav.lockedBadge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Locked Notice Toast */}
        {lockedNotice && (
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#1E1B18] text-white text-[13px] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-2 border border-[#3E3832] max-w-[90vw]">
            <svg className="w-4 h-4 text-[#F5A623] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="font-medium">{lockedNotice}</span>
          </div>
        )}

        {/* Right Section: Language Toggle + User Profile + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector */}
          <div className="flex items-center bg-[#F3ECE2] border border-[#DDD3C4] rounded-full p-0.5 sm:p-1 text-xs">
            <button
              type="button"
              onClick={() => setLanguage("de")}
              aria-label="Deutsch"
              className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition-all min-h-[28px] sm:min-h-[30px] cursor-pointer text-xs ${language === "de"
                ? "bg-white text-[#A12D3A] shadow-xs"
                : "text-[#6B5E51] hover:text-[#1E1B18]"
                }`}
            >
              DE
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-label="English"
              className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition-all min-h-[28px] sm:min-h-[30px] cursor-pointer text-xs ${language === "en"
                ? "bg-white text-[#A12D3A] shadow-xs"
                : "text-[#6B5E51] hover:text-[#1E1B18]"
                }`}
            >
              EN
            </button>
          </div>

          {/* User Profile Dropdown Pill (Figma node 580:1276) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#E7E5E4] rounded-full pl-1 pr-2 sm:pr-3 py-1 shadow-xs hover:border-[#D5C9B8] transition-all cursor-pointer min-h-[38px] sm:min-h-[40px]"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#AE2F34] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {getInitials(displayName)}
              </div>
              <span className="text-[13px] xl:text-[14px] font-medium text-[#1C1917] hidden sm:inline-block max-w-[140px] truncate">
                {displayName}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-[#7A6E62] transition-transform ${userDropdownOpen ? "rotate-180" : ""
                  }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white border border-[#E5DDD2] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                {/* Profile Card Header */}
                <div className="px-4 py-2.5 border-b border-[#F2F4F7]">
                  <p className="text-[11px] font-semibold text-[#7A6E62] uppercase tracking-wider">
                    Caretaker
                  </p>
                  <p className="text-[14px] font-bold text-[#1E1B18] truncate mt-0.5">
                    {displayName}
                  </p>
                  {profile.daycareName && (
                    <p className="text-[12px] text-[#16A34A] font-medium truncate mt-0.5">
                      {profile.daycareName}
                    </p>
                  )}
                </div>

                <Link
                  href="/caretaker/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-[#1E1B18] hover:bg-[#FAF7F2] font-medium"
                >
                  {t.caretakerProfile.pageTitle}
                </Link>
                <Link
                  href="/caretaker/dashboard"
                  onClick={() => setUserDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm text-[#1E1B18] hover:bg-[#FAF7F2] font-medium"
                >
                  {t.caretakerProfile.nav.dashboard}
                </Link>
                <div className="border-t border-[#F2F4F7] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    caretakerApi.logout();
                    resetProfile();
                    window.location.href = "/login";
                  }}
                  className="w-full text-left block px-4 py-2.5 text-sm text-[#A12D3A] hover:bg-[#FEF2F2] font-semibold cursor-pointer transition-colors"
                >
                  {t.caretakerProfile.nav.logout}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden w-10 h-10 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-center text-[#514532] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-[#EBE3D7] flex flex-col gap-1 animate-in fade-in">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isClickable = item.href === "/caretaker/dashboard" || isApproved;

            if (isClickable) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] flex items-center justify-between ${isActive
                    ? "bg-[#FAF4ED] text-[#7C5800]"
                    : "text-[#514532] hover:bg-white"
                    }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full leading-none tabular-nums ${
                        isActive
                          ? "bg-[#7C5800] text-white"
                          : "bg-[#F3ECE2] text-[#514532] border border-[#E5DDD2]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <button
                key={item.href}
                type="button"
                onClick={(e) => {
                  handleLockedClick(e);
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 rounded-xl text-sm font-medium text-[#7A6E62] hover:bg-white transition-all min-h-[44px] flex items-center justify-between text-left"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-[#A12D3A] bg-[#FEF2F2] px-2 py-0.5 rounded-sm">
                  {t.caretakerProfile.nav.lockedBadge}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </header>
    <UnderReviewModal />
    </>
  );
}
