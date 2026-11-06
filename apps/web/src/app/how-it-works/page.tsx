"use client";

import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { HowItWorksHero } from "../../components/how-it-works/HowItWorksHero";
import { HowItWorksCards } from "../../components/how-it-works/HowItWorksCards";
import { HowItWorksCta } from "../../components/how-it-works/HowItWorksCta";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18] overflow-x-clip">
      <Header />
      <main className="flex-1 w-full">
        <HowItWorksHero />
        <HowItWorksCards />
        <HowItWorksCta />
      </main>
      <Footer />
    </div>
  );
}
