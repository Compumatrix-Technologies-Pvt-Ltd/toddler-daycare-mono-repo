"use client";

import React from "react";
import Link from "next/link";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { WorkPermitCard } from "../../../components/caretaker/WorkPermitCard";
import { Footer } from "../../../components/Footer";
import { useLanguage } from "../../../i18n/LanguageContext";

export default function CaretakerPermitsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      <CaretakerHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1
            className="text-[22px] sm:text-[26px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.caretakerProfile.nav.permitsVerification}
          </h1>
          <Link
            href="/caretaker/profile"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#A12D3A] hover:bg-[#FAF7F2] rounded-xl border border-[#E5DDD2] transition-colors"
          >
            ← {t.caretakerProfile.pageTitle}
          </Link>
        </div>

        <WorkPermitCard />
      </main>

      <Footer />
    </div>
  );
}
