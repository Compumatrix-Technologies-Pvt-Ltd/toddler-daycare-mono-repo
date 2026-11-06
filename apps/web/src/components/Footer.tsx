"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-8 sm:mt-12 bg-[#ECE6DC] border-t border-[#DFD6C8] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-[#6D6154]">
      <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <svg
              viewBox="0 0 36 36"
              className="w-5 h-5 text-[#EAA000]"
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
            </svg>
            <span className="font-bold text-[#3B3024] text-base">
              {t.brand.title}
            </span>
          </div>
          <p className="text-xs text-[#807264]">{t.brand.tagline}</p>
          <p className="text-xs text-[#807264]">{t.brand.copyright}</p>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-[#5C5043] flex-wrap justify-center">
          <a href="#" className="hover:text-[#A12D3A] transition-colors">
            {t.footer.privacy}
          </a>
          <a href="#" className="hover:text-[#A12D3A] transition-colors">
            {t.footer.terms}
          </a>
          <a href="#" className="hover:text-[#A12D3A] transition-colors">
            {t.footer.cookies}
          </a>
          <Link href="/contact" className="hover:text-[#A12D3A] transition-colors">
            {t.footer.support}
          </Link>
          <a href="#" className="hover:text-[#A12D3A] transition-colors">
            {t.footer.guidelines}
          </a>
        </div>
      </div>
    </footer>
  );
}
