"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export function OurStory() {
  const { t } = useLanguage();
  const content = t.aboutPage;
  const paragraphs = content.storyParagraphs as readonly string[];

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-2">
      <div className="max-w-[1360px] mx-auto">
        <h2 className="text-center font-bold text-[#1E1B18] tracking-tight text-[22px] sm:text-[28px]">
          {content.storyTitle}
        </h2>
        <div className="mt-6 sm:mt-9 grid grid-cols-1 lg:grid-cols-2 gap-x-10 xl:gap-x-16 gap-y-5 sm:gap-y-6">
          <div className="space-y-5 sm:space-y-6">
            {paragraphs.slice(0, 2).map((text, idx) => (
              <p
                key={idx}
                className="text-[13.5px] sm:text-[15px] text-[#5C5043] leading-relaxed"
              >
                {text}
              </p>
            ))}
          </div>
          <div className="space-y-5 sm:space-y-6">
            {paragraphs.slice(2).map((text, idx) => (
              <p
                key={idx}
                className="text-[13.5px] sm:text-[15px] text-[#5C5043] leading-relaxed"
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
