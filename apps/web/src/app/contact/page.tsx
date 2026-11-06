"use client";

import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ContactFormCard } from "../../components/contact/ContactFormCard";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18] overflow-x-clip">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <ContactFormCard />
      </main>
      <Footer />
    </div>
  );
}
