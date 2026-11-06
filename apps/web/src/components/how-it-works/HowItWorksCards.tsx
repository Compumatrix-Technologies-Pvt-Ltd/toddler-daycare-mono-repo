"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

function InfoCard({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: readonly { title: string; text: string }[];
}) {
  return (
    <article className="bg-white rounded-2xl border border-[#D9CDBB] p-6 sm:p-8 lg:p-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col">
      <h2 className="text-[20px] sm:text-[22px] font-bold text-[#A12D3A] tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-[14px] sm:text-[15px] text-[#5C5043] leading-relaxed">
        {subtitle}
      </p>
      <hr className="my-6 border-t border-[#D9CDBB]" />
      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.title}>
            <h3 className="text-[15px] sm:text-base font-bold text-[#1E1B18]">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[13.5px] sm:text-[14.5px] text-[#5C5043] leading-relaxed">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function HowItWorksCards() {
  const { t } = useLanguage();
  const content = t.howItWorksPage;

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 items-stretch">
        <InfoCard
          title={content.parentsTitle}
          subtitle={content.parentsSubtitle}
          steps={content.parentsSteps}
        />
        <InfoCard
          title={content.caretakersTitle}
          subtitle={content.caretakersSubtitle}
          steps={content.caretakersSteps}
        />
      </div>
    </section>
  );
}
