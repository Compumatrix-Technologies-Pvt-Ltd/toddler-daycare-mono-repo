"use client";

import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AboutHero } from "../../components/about/AboutHero";
import { VisionMission } from "../../components/about/VisionMission";
import { CoreValues } from "../../components/about/CoreValues";
import { OurStory } from "../../components/about/OurStory";
import { HowItWorksCta } from "../../components/how-it-works/HowItWorksCta";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18] overflow-x-clip">
      <Header />
      <main className="flex-1 w-full">
        <AboutHero />
        <div className="bg-white">
          <VisionMission />
          <CoreValues />
          <OurStory />
        </div>
        <HowItWorksCta />
      </main>
      <Footer />
    </div>
  );
}
