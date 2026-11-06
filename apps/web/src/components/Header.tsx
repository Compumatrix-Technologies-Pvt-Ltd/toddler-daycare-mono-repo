"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";
import { ParentComingSoonModal } from "./modals/ParentComingSoonModal";

export function Header() {
  const { t, language, setLanguage, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(event.target as Node)
      ) {
        setLoginDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLoginDropdownOpen(false);
      }
    }

    if (loginDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginDropdownOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBE3D7] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0">
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
            <div className="font-bold text-[#423223] text-base sm:text-lg leading-tight tracking-tight whitespace-nowrap">
              {t.brand.title}
            </div>
            <div className="text-[11px] sm:text-xs text-[#8A775C] tracking-wide whitespace-nowrap">
              {t.brand.subtitle}
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-[13px] xl:text-[14px] font-medium text-[#4B3E2F] whitespace-nowrap">
          <Link
            href="/"
            className="hover:text-[#A12D3A] transition-colors py-1"
          >
            {t.nav.findSpots}
          </Link>
          <Link
            href="/favorites"
            className="hover:text-[#A12D3A] transition-colors py-1 flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4 text-[#AE2F34] fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{t.nav.favorites}</span>
          </Link>
          <a
            href="#"
            className="hover:text-[#A12D3A] transition-colors py-1"
          >
            {t.nav.offerSpots}
          </a>
          <Link
            href="/how-it-works"
            className="hover:text-[#A12D3A] transition-colors py-1"
          >
            {t.nav.howItWorks}
          </Link>
          <Link
            href="/about"
            className="hover:text-[#A12D3A] transition-colors py-1"
          >
            {t.nav.aboutUs}
          </Link>
        </nav>

        {/* Right Section: Translate Button & Log In Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Enhanced Translate Button */}
          <div className="flex items-center bg-[#F3ECE2] border border-[#DDD3C4] rounded-full p-1 shadow-2xs">
            {/* Globe icon indicator */}
            <div className="pl-1.5 pr-1 text-[#786C5E] hidden sm:flex items-center">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>

            {/* German Button */}
            <button
              onClick={() => setLanguage("de")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${language === "de"
                ? "bg-white text-[#A12D3A] shadow-xs font-bold"
                : "text-[#6B5E51] hover:text-[#1E1B18] font-medium"
                }`}
              title="Deutsch (German)"
            >
              <span>DE</span>
            </button>

            {/* English Button */}
            <button
              onClick={() => setLanguage("en")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${language === "en"
                ? "bg-white text-[#A12D3A] shadow-xs font-bold"
                : "text-[#6B5E51] hover:text-[#1E1B18] font-medium"
                }`}
              title="English"
            >
              <span>EN</span>
            </button>
          </div>

          {/* Quick 1-click Toggle Translate Button (Icon button on mobile / extra convenience) */}
          <button
            onClick={toggleLanguage}
            className="flex sm:hidden items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#EFE8DD] text-[#4B3E2F] hover:bg-[#E2D8CC] transition-colors cursor-pointer"
            title={`Switch to ${language === "de" ? "English" : "Deutsch"}`}
            aria-label="Toggle language"
          >
            <span className="text-xs font-bold">
              {language === "de" ? "EN" : "DE"}
            </span>
          </button>

          {/* Desktop Log In Dropdown Trigger */}
          <div className="relative hidden sm:block" ref={loginDropdownRef}>
            <button
              type="button"
              onClick={() => setLoginDropdownOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 text-[13px] xl:text-[14px] font-medium transition-all px-3 py-1.5 rounded-lg whitespace-nowrap min-h-[40px] cursor-pointer ${
                loginDropdownOpen
                  ? "bg-[#F3ECE2] text-[#A12D3A]"
                  : "text-[#2B231B] hover:text-[#A12D3A] hover:bg-[#F3ECE2]"
              }`}
              aria-expanded={loginDropdownOpen}
              aria-haspopup="true"
            >
              <span>{t.nav.login}</span>
              <svg
                className={`w-3.5 h-3.5 text-[#7A6E62] transition-transform duration-200 ${
                  loginDropdownOpen ? "rotate-180 text-[#A12D3A]" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Desktop Dropdown Popover */}
            {loginDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E7DDD0] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Parent Option */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginDropdownOpen(false);
                    setIsParentModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-[#FAF7F2] transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5E6] border border-[#FDE68A] flex items-center justify-center text-[#EAA000] shrink-0 group-hover:scale-105 transition-transform">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                      />
                      <circle cx="9" cy="7" r="4" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M22 21v-2a4 4 0 0 0-3-3.87"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 3.13a4 4 0 0 1 0 7.75"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#1E1B18] group-hover:text-[#A12D3A] transition-colors leading-tight">
                      {t.nav.loginDropdown.parent}
                    </div>
                    <div className="text-[11px] text-[#7A6E62] truncate mt-0.5">
                      {t.nav.loginDropdown.parentSubtitle}
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#F3ECE2]" />

                {/* Caretaker Option */}
                <Link
                  href="/login"
                  onClick={() => setLoginDropdownOpen(false)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-[#FAF7F2] transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] border border-[#FECDD3] flex items-center justify-center text-[#A12D3A] shrink-0 group-hover:scale-105 transition-transform">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#1E1B18] group-hover:text-[#A12D3A] transition-colors leading-tight">
                      {t.nav.loginDropdown.caretaker}
                    </div>
                    <div className="text-[11px] text-[#7A6E62] truncate mt-0.5">
                      {t.nav.loginDropdown.caretakerSubtitle}
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button (44x44px safe touch target) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#4B3E2F] rounded-xl hover:bg-[#EFE8DD] active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-4 pb-2 border-t border-[#EBE3D7] mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2">
          {/* Mobile Language Switcher Row */}
          <div className="bg-[#F3ECE2] p-2.5 rounded-xl mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C5044] flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#7A6E62] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{language === "de" ? "Sprache wählen:" : "Select language:"}</span>
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setLanguage("de")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${language === "de"
                  ? "bg-white text-[#A12D3A] shadow-xs"
                  : "text-[#6B5E51]"
                  }`}
              >
                🇩🇪 Deutsch
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${language === "en"
                  ? "bg-white text-[#A12D3A] shadow-xs"
                  : "text-[#6B5E51]"
                  }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-3 py-2.5 text-sm font-semibold text-[#A12D3A] bg-[#FFF8F2] rounded-lg min-h-[44px]"
          >
            {t.nav.findSpots}
          </Link>
          <Link
            href="/favorites"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#4B3E2F] hover:bg-[#F3ECE2] rounded-lg min-h-[44px]"
          >
            <svg
              className="w-4 h-4 text-[#AE2F34] fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{t.nav.favorites}</span>
          </Link>
          <a
            href="#"
            className="flex items-center px-3 py-2.5 text-sm font-medium text-[#4B3E2F] hover:bg-[#F3ECE2] rounded-lg min-h-[44px]"
          >
            {t.nav.offerSpots}
          </a>
          <Link
            href="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-3 py-2.5 text-sm font-medium text-[#4B3E2F] hover:bg-[#F3ECE2] rounded-lg min-h-[44px]"
          >
            {t.nav.howItWorks}
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-3 py-2.5 text-sm font-medium text-[#4B3E2F] hover:bg-[#F3ECE2] rounded-lg min-h-[44px]"
          >
            {t.nav.aboutUs}
          </Link>

          {/* Mobile Login Dropdown Options */}
          <div className="pt-3 border-t border-[#EBE3D7] px-1 space-y-2">
            <div className="text-[11px] font-bold text-[#8A775C] uppercase tracking-wider px-2">
              {t.nav.login}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {/* Parent Option */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsParentModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#EBE3D7] hover:border-[#A12D3A] active:scale-[0.99] transition-all min-h-[44px] text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF5E6] border border-[#FDE68A] flex items-center justify-center text-[#EAA000] shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    />
                    <circle cx="9" cy="7" r="4" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 21v-2a4 4 0 0 0-3-3.87"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 3.13a4 4 0 0 1 0 7.75"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#1E1B18] leading-tight">
                    {t.nav.loginDropdown.parent}
                  </div>
                  <div className="text-xs text-[#7A6E62] truncate mt-0.5">
                    {t.nav.loginDropdown.parentSubtitle}
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-md shrink-0">
                  {t.nav.parentComingSoon.badge}
                </span>
              </button>

              {/* Caretaker Option */}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#EBE3D7] hover:border-[#A12D3A] active:scale-[0.99] transition-all min-h-[44px] cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF0F2] border border-[#FECDD3] flex items-center justify-center text-[#A12D3A] shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#1E1B18] leading-tight">
                    {t.nav.loginDropdown.caretaker}
                  </div>
                  <div className="text-xs text-[#7A6E62] truncate mt-0.5">
                    {t.nav.loginDropdown.caretakerSubtitle}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-[#A12D3A] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Parent Coming Soon Popup Modal */}
      <ParentComingSoonModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
      />
    </header>
  );
}
