"use client";

import React from "react";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { ProfileCompletionBanner } from "../../../components/caretaker/ProfileCompletionBanner";
import { PinLocationCard } from "../../../components/caretaker/PinLocationCard";
import { DaycareOperationsCard } from "../../../components/caretaker/DaycareOperationsCard";
import { WorkPermitCard } from "../../../components/caretaker/WorkPermitCard";
import { Footer } from "../../../components/Footer";
import { useLanguage } from "../../../i18n/LanguageContext";

export default function CaretakerProfilePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18] overflow-x-clip">
      {/* Caretaker Header */}
      <CaretakerHeader />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Page Title & Subtitle */}
        <div className="space-y-1">
          <h1
            className="text-[24px] sm:text-[28px] font-extrabold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.caretakerProfile.pageTitle}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-relaxed max-w-[900px]">
            {t.caretakerProfile.pageSubtitle}
          </p>
        </div>

        {/* Dynamic Profile Completion & Admin Approval Status Banner */}
        <ProfileCompletionBanner />

        {/* 1. Pin Your Location Card */}
        <PinLocationCard />

        {/* 2. Daycare Operations Profile Card */}
        <DaycareOperationsCard />

        {/* 3. Work Permit & Compliance Card */}
        <WorkPermitCard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
