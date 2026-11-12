"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { FavoriteCard } from "../../components/FavoriteCard";
import { CaretakerProfileDrawer } from "../../components/CaretakerProfileDrawer";
import { EnquiryModal, EnquiryScope } from "../../components/modals/EnquiryModal";
import { ImageGalleryModal } from "../../components/modals/ImageGalleryModal";
import { Kita } from "../../types";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSessionFavorites } from "../../utils/favoritesSession";
import { caretakerApi } from "../../utils/caretakerApi";
import { mapDaycareToKita } from "../../utils/daycareMapper";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { favorites, removeFavorite, clearFavorites } = useSessionFavorites();
  const [allKitas, setAllKitas] = useState<Kita[]>([]);
  const [catchmentRadius, setCatchmentRadius] = useState<number>(3);

  useEffect(() => {
    let isMounted = true;
    async function loadDaycares() {
      try {
        const [daycares, settings] = await Promise.all([
          caretakerApi.getAllDaycares(),
          caretakerApi.getSettings(),
        ]);
        if (isMounted) {
          if (settings?.defaultCatchmentRadiusKm) {
            setCatchmentRadius(settings.defaultCatchmentRadiusKm);
          }
          if (Array.isArray(daycares)) {
            // Strictly show only active daycares approved by admin
            const mapped = daycares
              .filter((d: any) => d.status === "approved")
              .map(mapDaycareToKita);
            setAllKitas(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load backend daycares or settings:", err);
      }
    }
    loadDaycares();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically load favorited daycares from browser session & allKitas
  const favoriteList = useMemo(() => {
    return allKitas.filter((k) => favorites[k.id]);
  }, [allKitas, favorites]);

  // Inquiry Modal State
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [activeKitaForInquiry, setActiveKitaForInquiry] = useState<Kita | null>(
    null
  );
  const [inquiryScope, setInquiryScope] = useState<EnquiryScope>("favorites");

  // Caretaker Profile Drawer State (Figma node 213:1120)
  const [drawerKita, setDrawerKita] = useState<Kita | null>(null);

  // Lightbox Photo Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryKita, setGalleryKita] = useState<Kita | null>(null);

  // Handlers
  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
    if (drawerKita?.id === id) {
      setDrawerKita(null);
    }
  };

  const handleClearShortlist = () => {
    clearFavorites();
    setDrawerKita(null);
  };

  const handleSingleInquiry = (kita: Kita) => {
    setActiveKitaForInquiry(kita);
    setInquiryScope("single");
    setEnquiryModalOpen(true);
  };

  const handleBulkInquiry = () => {
    setActiveKitaForInquiry(favoriteList[0] || null);
    setInquiryScope("favorites");
    setEnquiryModalOpen(true);
  };

  const handleViewProfile = (kita: Kita) => {
    // Opens the dedicated Right Side Caretaker Profile Drawer with Map & Kita data showcase
    setDrawerKita(kita);
  };

  const handleOpenGallery = (kita: Kita, initialIndex = 0) => {
    setGalleryKita(kita);
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  const countBadgeText = (t.favorites.countSaved || "{count} Saved").replace(
    "{count}",
    String(favoriteList.length)
  );

  const bulkInquiryText = (
    t.favorites.bulkInquiry || "Send Bulk Inquiry to All ({count})"
  ).replace("{count}", String(favoriteList.length));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="max-w-[1240px] mx-auto w-full flex flex-col gap-5 sm:gap-6">
          {/* Guest Session Warning Banner */}
          <section
            aria-label="Guest session notice"
            className="bg-[#FFFDF5] border border-amber-400/40 rounded-xl p-3.5 sm:p-4 md:px-5 md:py-3.5 shadow-[0px_2px_8px_rgba(148,110,26,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="bg-[#FEF3C7] text-[#91400D] text-[11px] font-bold px-2.5 py-0.5 rounded-md tracking-wider shrink-0 uppercase mt-0.5 sm:mt-0">
                {t.favorites.banner.badge}
              </span>
              <p className="text-[#1C1917] text-sm leading-relaxed font-normal">
                {t.favorites.banner.text}
              </p>
            </div>
            <button
              onClick={() => alert(t.nav.login)}
              className="text-[#AE2F34] hover:text-[#88222E] font-medium text-sm hover:underline shrink-0 flex items-center gap-1 self-start sm:self-auto cursor-pointer min-h-[36px]"
            >
              <span>{t.favorites.banner.createAccount}</span>
            </button>
          </section>

          {/* Favorites Header Action Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2">
            {/* Header Text Stack */}
            <div className="flex flex-col gap-1.5 max-w-[640px]">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-[32px] font-bold text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                  {t.favorites.title}
                </h1>
                <span className="bg-[#FDF2F2] text-[#AE2F34] text-[13px] font-semibold px-3 py-0.5 rounded-full">
                  {countBadgeText}
                </span>
              </div>
              <p className="text-[#57534E] text-sm sm:text-[15px] leading-relaxed">
                {t.favorites.subtitle}
              </p>
            </div>

            {/* Actions Stack */}
            {favoriteList.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
                {/* Clear Shortlist Button */}
                <button
                  onClick={handleClearShortlist}
                  className="flex-1 sm:flex-initial bg-white hover:bg-stone-50 border border-[#D5C4AB] text-[#1C1917] font-medium text-sm px-4 py-2.5 rounded-lg min-h-[44px] transition-all flex items-center justify-center text-center active:scale-[0.98] cursor-pointer"
                >
                  {t.favorites.clearShortlist}
                </button>

                {/* Bulk Inquiry Button */}
                <button
                  onClick={handleBulkInquiry}
                  className="flex-1 sm:flex-initial bg-[#AE2F34] hover:bg-[#88222E] text-white font-medium text-sm sm:text-[15px] px-5 sm:px-6 py-2.5 rounded-lg min-h-[44px] transition-all shadow-xs flex items-center justify-center text-center active:scale-[0.98] cursor-pointer"
                >
                  {bulkInquiryText}
                </button>
              </div>
            )}
          </header>

          {/* Dynamic Favorites Cards List */}
          {favoriteList.length > 0 ? (
            <div className="flex flex-col gap-5">
              {favoriteList.map((kita) => (
                <FavoriteCard
                  key={kita.id}
                  kita={kita}
                  onSendInquiry={handleSingleInquiry}
                  onViewProfile={handleViewProfile}
                  onRemoveFavorite={handleRemoveFavorite}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm my-6">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#AE2F34]">
                <svg
                  className="w-8 h-8 fill-none stroke-current"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif]">
                {t.favorites.empty.title}
              </h2>
              <p className="text-sm text-[#78716C] max-w-md leading-relaxed">
                {t.favorites.empty.subtitle}
              </p>
              <Link
                href="/"
                className="mt-2 bg-[#AE2F34] hover:bg-[#88222E] text-white font-medium text-sm px-6 py-3 rounded-xl transition-all shadow-xs inline-flex items-center gap-2 active:scale-[0.98]"
              >
                <span>{t.favorites.empty.browseButton}</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* 6b. Caretaker View Profile Drawer (Figma node 213:1120) with MapSection & KitaDetail */}
      <CaretakerProfileDrawer
        isOpen={!!drawerKita}
        kita={drawerKita}
        allKitas={allKitas}
        onClose={() => setDrawerKita(null)}
        onSelectKita={(id) => {
          const found = allKitas.find((k) => k.id === id);
          if (found) setDrawerKita(found);
        }}
        onSendInquiry={handleSingleInquiry}
        onOpenGallery={(idx) => {
          if (drawerKita) handleOpenGallery(drawerKita, idx || 0);
        }}
        catchmentRadius={catchmentRadius}
      />

      {/* Lightbox Photo Gallery Modal */}
      {galleryOpen && (galleryKita || drawerKita) && (
        <ImageGalleryModal
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          kita={galleryKita || drawerKita!}
          initialIndex={galleryInitialIndex}
          onOpenInquiry={() => {
            const target = galleryKita || drawerKita;
            setGalleryOpen(false);
            if (target) handleSingleInquiry(target);
          }}
        />
      )}

      {/* Bulk / Single Inquiry Modal */}
      {enquiryModalOpen && (
        <EnquiryModal
          onClose={() => setEnquiryModalOpen(false)}
          activeKitaName={activeKitaForInquiry?.name || "Kita Sunshine"}
          activeKitaId={activeKitaForInquiry?.id}
          initialScope={inquiryScope}
          favoritesCount={favoriteList.length}
          daycareIds={favoriteList.map((k) => k.id)}
          daycareNames={favoriteList.map((k) => k.name)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
