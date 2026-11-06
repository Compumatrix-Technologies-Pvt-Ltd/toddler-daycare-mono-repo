"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageContext";

export function HowItWorksCta() {
  const { t } = useLanguage();
  const content = t.howItWorksPage;

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-[1120px] mx-auto bg-[#0A4A3A] rounded-[24px] sm:rounded-[32px] px-6 sm:px-10 lg:px-12 py-8 sm:py-10 text-center shadow-[0_8px_24px_rgba(10,74,58,0.18)]">
        <h2 className="text-white font-bold tracking-tight text-[24px] sm:text-[32px] lg:text-[34px] leading-tight">
          {content.ctaTitle}
        </h2>
        <p className="mt-3 sm:mt-4 text-white/85 text-[14px] sm:text-[17px] leading-relaxed max-w-[720px] mx-auto">
          {content.ctaSubtitle}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center mt-7 sm:mt-9 min-h-[52px] px-7 sm:px-9 rounded-xl bg-[#F5B301] hover:bg-[#E0A400] active:scale-[0.98] transition-all text-[#5A3E00] font-bold text-[16px] sm:text-[19px] tracking-tight shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
        >
          {content.ctaButton}
        </Link>
      </div>
    </section>
  );
}
