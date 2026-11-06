"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export function HowItWorksHero() {
  const { t } = useLanguage();
  const content = t.howItWorksPage;

  return (
    <section className="bg-[#FAF7F2] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-[900px] mx-auto text-center space-y-4 sm:space-y-5">
        <p className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#A12D3A] uppercase">
          {content.eyebrow}
        </p>
        <h1 className="font-extrabold text-[#1E1B18] tracking-tight leading-[1.05] text-[32px] sm:text-[44px] lg:text-[52px]">
          {content.title}
        </h1>
        <p className="text-[#5C5043] text-[15px] sm:text-[17px] leading-relaxed max-w-[760px] mx-auto">
          {content.subtitle}
        </p>
      </div>
    </section>
  );
}
