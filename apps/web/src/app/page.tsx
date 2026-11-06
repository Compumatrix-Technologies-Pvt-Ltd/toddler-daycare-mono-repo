"use client";

import React, { useState } from "react";
import { KITAS } from "../data/kitas";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { ResultsHeader } from "../components/ResultsHeader";
import { KitaList } from "../components/KitaList";
import { MapSection } from "../components/MapSection";
import { KitaDetail } from "../components/KitaDetail";
import { Footer } from "../components/Footer";
import { EnquiryModal, EnquiryScope } from "../components/modals/EnquiryModal";
import { FilterModal } from "../components/modals/FilterModal";
import { ImageGalleryModal } from "../components/modals/ImageGalleryModal";
import { useLanguage } from "../i18n/LanguageContext";
import { useSessionFavorites } from "../utils/favoritesSession";
import { Kita } from "../types";

export default function ToddlerLandingPage() {
  const { t } = useLanguage();
  const [selectedKitaId, setSelectedKitaId] = useState<string>("1");
  const { favorites, toggleFavorite } = useSessionFavorites();

  // Search matrix state (stable option values: children "1" | "2" | "3+", month 0-11 index, year)
  const [childrenCount, setChildrenCount] = useState("1");
  const [selectedMonth, setSelectedMonth] = useState("7");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedDateFilter, setSelectedDateFilter] = useState("Oct 1, 2026");

  // Mobile View state: "list" or "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  // Modals state
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryScope, setEnquiryScope] = useState<EnquiryScope>("single");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryKita, setGalleryKita] = useState<Kita | null>(null);

  // Active Kita
  const activeKita = KITAS.find((k) => k.id === selectedKitaId) || KITAS[0];


  const handleOpenSingleInquiry = (id?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id) setSelectedKitaId(id);
    setEnquiryScope("single");
    setEnquiryModalOpen(true);
  };

  const handleOpenBulkInquiry = () => {
    setEnquiryScope("allMap");
    setEnquiryModalOpen(true);
  };

  const handleOpenGallery = (kita: Kita, initialIndex = 0) => {
    setGalleryKita(kita);
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      {/* 1. Header / Navbar with Language Switcher */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* 2. Top Filter & Search Matrix */}
        <SearchBar
          childrenCount={childrenCount}
          setChildrenCount={setChildrenCount}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onOpenFilterModal={() => setFilterModalOpen(true)}
        />

        {/* 3. Main Results Board Container */}
        <div className="bg-white rounded-3xl border border-[#E5DDD2] p-3.5 sm:p-5 lg:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {/* Header Row: Result counter & "Alle anfragen" */}
          <ResultsHeader
            childrenCount={childrenCount}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            mobileView={mobileView}
            setMobileView={setMobileView}
            onOpenBulkModal={handleOpenBulkInquiry}
          />

          {/* Grid Layout: Left List + Right Detail & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pt-4 sm:pt-6 items-start">
            {/* Left Column: Kita Cards List */}
            <div
              className={`lg:col-span-5 ${mobileView === "detail" ? "hidden lg:block" : "block"
                }`}
            >
              <KitaList
                kitas={KITAS}
                selectedKitaId={selectedKitaId}
                favorites={favorites}
                onSelectKita={(id) => {
                  setSelectedKitaId(id);
                  // On mobile, auto-switch to detail view so user immediately sees the selected Kita details
                  if (window.innerWidth < 1024) {
                    setMobileView("detail");
                  }
                }}
                onToggleFavorite={toggleFavorite}
                onOpenInquiry={(id, e) => handleOpenSingleInquiry(id, e)}
                onOpenGallery={(k) => handleOpenGallery(k, 0)}
              />
            </div>

            {/* Right Column: Interactive Map & Detail Showcase */}
            <div
              className={`lg:col-span-7 space-y-5 ${mobileView === "list" ? "hidden lg:block" : "block"
                }`}
            >
              {/* Back to list button on mobile */}
              <div className="lg:hidden pb-1">
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#A12D3A] bg-[#FFF8F2] px-3.5 py-2 rounded-lg border border-[#F3E2D5] min-h-[40px] active:scale-95 transition-all"
                >
                  <span>{t.results.backToList}</span>
                </button>
              </div>

              {/* Map Section */}
              <MapSection
                kitas={KITAS}
                activeKita={activeKita}
                onSelectKita={(id) => setSelectedKitaId(id)}
              />

              {/* Daycare Detail Showcase - image clicks open gallery modal */}
              <KitaDetail
                kita={activeKita}
                selectedDateFilter={selectedDateFilter}
                onSelectDateFilter={setSelectedDateFilter}
                onOpenInquiry={() => handleOpenSingleInquiry(activeKita.id)}
                onOpenGallery={(idx) => handleOpenGallery(activeKita, idx || 0)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Modals */}
      {enquiryModalOpen && (
        <EnquiryModal
          activeKitaName={activeKita.name}
          initialScope={enquiryScope}
          totalMapCount={22}
          favoritesCount={Object.values(favorites).filter(Boolean).length}
          onClose={() => setEnquiryModalOpen(false)}
        />
      )}

      {filterModalOpen && (
        <FilterModal onClose={() => setFilterModalOpen(false)} />
      )}

      {/* 6. Image Gallery Lightbox Modal */}
      <ImageGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        kita={galleryKita || activeKita}
        initialIndex={galleryInitialIndex}
        onOpenInquiry={() =>
          handleOpenSingleInquiry((galleryKita || activeKita).id)
        }
      />
    </div>
  );
}
