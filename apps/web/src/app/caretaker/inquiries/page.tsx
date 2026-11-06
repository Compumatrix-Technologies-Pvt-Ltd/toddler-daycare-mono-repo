"use client";

import React from "react";
import Link from "next/link";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { Footer } from "../../../components/Footer";
import { useLanguage } from "../../../i18n/LanguageContext";

export default function CaretakerInquiriesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      <CaretakerHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-10 text-center max-w-[640px] mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mx-auto text-[#2563EB]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1
              className="text-[22px] sm:text-[26px] font-bold text-[#1E1B18] tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.caretakerProfile.nav.parentInquiries}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#7A6E62]">
              {t.caretakerProfile.pageSubtitle}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/caretaker/profile"
              className="w-full sm:w-auto px-5 h-[42px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold text-[14px] transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              {t.caretakerProfile.pageTitle}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
