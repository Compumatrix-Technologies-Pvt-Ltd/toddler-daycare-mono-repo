"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export function CoreValues() {
  const { t } = useLanguage();
  const content = t.aboutPage;

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      <div className="max-w-[1360px] mx-auto">
        <h2 className="text-center font-bold text-[#1E1B18] tracking-tight text-[22px] sm:text-[28px]">
          {content.valuesTitle}
        </h2>
        <div className="mt-6 sm:mt-9 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {content.values.map((value) => (
            <article
              key={value.title}
              className="bg-white rounded-2xl border border-[#D9CDBB] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <h3 className="text-[15px] sm:text-base font-bold text-[#A12D3A]">
                {value.title}
              </h3>
              <p className="mt-3 text-[13.5px] sm:text-[14.5px] text-[#5C5043] leading-relaxed">
                {value.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
