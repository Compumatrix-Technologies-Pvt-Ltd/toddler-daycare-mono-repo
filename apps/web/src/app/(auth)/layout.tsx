import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      {/* Unified Header */}
      <Header />

      {/* Centered Auth Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
