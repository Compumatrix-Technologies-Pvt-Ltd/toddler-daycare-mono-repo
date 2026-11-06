"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export function VisionMission() {
  const { t } = useLanguage();
  const content = t.aboutPage;

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
      <div className="max-w-[1360px] mx-auto">
        <div className="border-l-4 border-[#A12D3A] rounded-l-lg pl-5 sm:pl-8 py-2 sm:py-3">
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#A12D3A] uppercase">
            {content.visionEyebrow}
          </p>
          <p className="mt-3 sm:mt-4 text-[#1E1B18] font-medium text-[16px] sm:text-[19px] lg:text-[21px] leading-relaxed">
            {content.visionText}
          </p>
        </div>
      </div>
    </section>
  );
}
