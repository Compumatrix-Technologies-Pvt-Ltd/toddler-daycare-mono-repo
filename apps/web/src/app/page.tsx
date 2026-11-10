"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { caretakerApi } from "../utils/caretakerApi";
import { mapDaycareToKita } from "../utils/daycareMapper";
import { calculateDistanceKm } from "../utils/geoDistance";
import { Kita, FilterState } from "../types";

const INITIAL_FILTERS: FilterState = {
  childrenCount: "",
  startMonth: "",
  startYear: "",
  monthTolerance: 1, // ±1 Month
  openingFrom: "",
  openingUntil: "",
  caretakerGender: "all",
  foodPreference: "any",
  pets: "any",
  radiusKm: 3,
};

export default function ToddlerLandingPage() {
  const { t } = useLanguage();
  const [allKitas, setAllKitas] = useState<Kita[]>([]);
  const [selectedKitaId, setSelectedKitaId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { favorites, toggleFavorite } = useSessionFavorites();

  // Active Multi-Parameter Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Parent's Location & Catchment Filtering
  const [parentLocation, setParentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [strictRadiusFilter, setStrictRadiusFilter] = useState<boolean>(true);

  // Request Parent's Current GPS Location
  const requestParentLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setParentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation permission error/fallback:", err.message);
          setIsLocating(false);
          // Fallback to cluster coordinates if unavailable
          setParentLocation((prev) => prev || { lat: 20.571046, lng: 74.94637 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setParentLocation((prev) => prev || { lat: 20.571046, lng: 74.94637 });
    }
  };

  // On mount: fetch registered daycares, platform settings & detect GPS location
  useEffect(() => {
    let isMounted = true;
    async function loadDaycaresAndSettings() {
      try {
        setLoading(true);
        const [daycares, settings] = await Promise.all([
          caretakerApi.getAllDaycares(),
          caretakerApi.getSettings(),
        ]);
        if (isMounted) {
          const adminRadius = Number(settings?.defaultCatchmentRadiusKm) || 3;
          setFilters((prev) => ({
            ...prev,
            radiusKm: adminRadius,
          }));

          // Strictly show only active daycares approved by admin
          const mappedDaycares = Array.isArray(daycares)
            ? daycares
                .filter((d: any) => d.status === "approved")
                .map(mapDaycareToKita)
            : [];
          setAllKitas(mappedDaycares);
          if (mappedDaycares.length > 0) {
            setSelectedKitaId(mappedDaycares[0].id);
          } else {
            setSelectedKitaId("");
          }
        }
      } catch (err) {
        console.warn("Could not load backend daycares or settings:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDaycaresAndSettings();
    requestParentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute distance for all daycares relative to parent's location
  const kitasWithDistance = useMemo(() => {
    return allKitas.map((kita) => {
      if (parentLocation && kita.coordinates?.lat && kita.coordinates?.lng) {
        const dist = calculateDistanceKm(
          parentLocation.lat,
          parentLocation.lng,
          kita.coordinates.lat,
          kita.coordinates.lng
        );
        return {
          ...kita,
          distanceKm: dist,
          distance: t.results.distanceAway.replace("{distance}", String(dist)),
        };
      }
      return kita;
    });
  }, [allKitas, parentLocation, t]);

  // Comprehensive multi-parameter filtering
  const displayKitas = useMemo(() => {
    return kitasWithDistance
      .filter((k) => {
        // 1. Radius Filter (if strictRadiusFilter is on and parentLocation exists)
        if (strictRadiusFilter && parentLocation && k.distanceKm != null) {
          if (k.distanceKm > filters.radiusKm) return false;
        }

        // 2. Number of Children Filter (1, 2, 3+) - only if user specified a count
        if (filters.childrenCount) {
          const reqSlots = parseInt(filters.childrenCount, 10);
          if (!isNaN(reqSlots) && reqSlots > 0) {
            if (k.slots < reqSlots && (k.maxChildren || 0) < reqSlots) {
              return false;
            }
          }
        }

        // 3. Month & Year with Month Tolerance (Exact to ±3 Months) - only if month and year are specified
        if (filters.startMonth !== "" && filters.startYear && k.nextDate) {
          const dDate = new Date(k.nextDate);
          if (!isNaN(dDate.getTime())) {
            const targetTotalMonths =
              parseInt(filters.startYear, 10) * 12 + parseInt(filters.startMonth, 10);
            const daycareTotalMonths = dDate.getFullYear() * 12 + dDate.getMonth();
            const diffMonths = Math.abs(targetTotalMonths - daycareTotalMonths);
            if (diffMonths > filters.monthTolerance) {
              return false;
            }
          }
        }

        // 4. Opening Hours (From / Until)
        if (filters.openingFrom && k.openingFrom) {
          if (k.openingFrom > filters.openingFrom) return false;
        }
        if (filters.openingUntil && k.openingUntil) {
          if (k.openingUntil < filters.openingUntil) return false;
        }

        // 5. Caretaker Gender (All / Female / Male)
        if (filters.caretakerGender !== "all") {
          const g = (k.gender || "").toLowerCase();
          if (g && g !== filters.caretakerGender.toLowerCase()) {
            return false;
          }
        }

        // 6. Food Preference (Any / Self Cooked / Delivered)
        if (filters.foodPreference !== "any") {
          const meal = (k.mealsType || "").toLowerCase();
          if (filters.foodPreference === "self-cooked") {
            if (!meal.includes("self") && !meal.includes("selbst") && !meal.includes("cooked")) {
              return false;
            }
          } else if (filters.foodPreference === "delivered") {
            if (!meal.includes("deliver") && !meal.includes("cater") && !meal.includes("geliefert")) {
              return false;
            }
          }
        }

        // 7. Pets (Allowed / Not Allowed)
        if (filters.pets !== "any") {
          const pet = (k.petsPolicy || "").toLowerCase();
          if (filters.pets === "allowed") {
            const isNoPets = pet.includes("no-pets") || pet.includes("kein") || pet.includes("not");
            if (isNoPets) return false;
          } else if (filters.pets === "not-allowed") {
            const isWelcome =
              pet.includes("welcome") ||
              pet.includes("allowed") ||
              (pet.includes("haustier") && !pet.includes("kein"));
            if (isWelcome) return false;
          }
        }

        return true;
      })
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [kitasWithDistance, filters, strictRadiusFilter, parentLocation]);

  // Ensure an active daycare is selected from the filtered list
  useEffect(() => {
    if (displayKitas.length > 0) {
      const exists = displayKitas.some((k) => k.id === selectedKitaId);
      if (!exists) {
        setSelectedKitaId(displayKitas[0].id);
      }
    } else {
      setSelectedKitaId("");
    }
  }, [displayKitas, selectedKitaId]);

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.childrenCount) count++;
    if (filters.startMonth !== "" || filters.startYear) count++;
    if (filters.openingFrom || filters.openingUntil) count++;
    if (filters.caretakerGender !== "all") count++;
    if (filters.foodPreference !== "any") count++;
    if (filters.pets !== "any") count++;
    return count;
  }, [filters]);

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
  const activeKita =
    displayKitas.find((k) => k.id === selectedKitaId) ||
    (displayKitas.length > 0 ? displayKitas[0] : null);

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

  const totalSlotsCount = displayKitas.reduce((sum, k) => sum + (k.slots || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      {/* 1. Header / Navbar with Language Switcher */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* 2. Top Parameter-Based Filter & Search Matrix */}
        <SearchBar
          childrenCount={filters.childrenCount}
          setChildrenCount={(val) => setFilters((prev) => ({ ...prev, childrenCount: val }))}
          selectedMonth={filters.startMonth}
          setSelectedMonth={(val) => setFilters((prev) => ({ ...prev, startMonth: val }))}
          selectedYear={filters.startYear}
          setSelectedYear={(val) => setFilters((prev) => ({ ...prev, startYear: val }))}
          onOpenFilterModal={() => setFilterModalOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />

        {/* 3. Main Results Board Container */}
        <div className="bg-white rounded-3xl border border-[#E5DDD2] p-3.5 sm:p-5 lg:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {/* Header Row: Result counter & Catchment Radius Indicator */}
          <ResultsHeader
            totalSpots={totalSlotsCount}
            childrenCount={filters.childrenCount}
            selectedMonth={filters.startMonth}
            selectedYear={filters.startYear}
            mobileView={mobileView}
            setMobileView={setMobileView}
            onOpenBulkModal={handleOpenBulkInquiry}
            catchmentRadius={filters.radiusKm}
            isLocating={isLocating}
            onLocateMe={requestParentLocation}
            strictRadiusFilter={strictRadiusFilter}
            onToggleRadiusFilter={() => setStrictRadiusFilter((prev) => !prev)}
            totalFilteredCount={displayKitas.length}
            totalAvailableCount={allKitas.length}
          />

          {/* Active Parameter Filter Pills */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-3 pb-1">
              <span className="text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider">
                {t.modals.filter.activeFilters}:
              </span>

              {filters.monthTolerance !== 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-semibold text-[#423223]">
                  <span>
                    {filters.monthTolerance === 0
                      ? t.modals.filter.tolerances.exact
                      : filters.monthTolerance === 2
                        ? t.modals.filter.tolerances.twoMonths
                        : t.modals.filter.tolerances.threeMonths}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, monthTolerance: 1 }))}
                    className="hover:text-[#A12D3A] ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.caretakerGender !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-semibold text-[#423223]">
                  <span>
                    {filters.caretakerGender === "female"
                      ? `👩 ${t.modals.filter.genderOptions.female}`
                      : `👨 ${t.modals.filter.genderOptions.male}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, caretakerGender: "all" }))}
                    className="hover:text-[#A12D3A] ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.foodPreference !== "any" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-semibold text-[#423223]">
                  <span>
                    {filters.foodPreference === "self-cooked"
                      ? `🍲 ${t.modals.filter.foodOptions.selfCooked}`
                      : `📦 ${t.modals.filter.foodOptions.delivered}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, foodPreference: "any" }))}
                    className="hover:text-[#A12D3A] ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.pets !== "any" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-semibold text-[#423223]">
                  <span>
                    {filters.pets === "allowed"
                      ? `🐕 ${t.modals.filter.petsOptions.allowed}`
                      : `🚫 ${t.modals.filter.petsOptions.notAllowed}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, pets: "any" }))}
                    className="hover:text-[#A12D3A] ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {(filters.openingFrom || filters.openingUntil) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-semibold text-[#423223]">
                  <span>
                    ⏰ {filters.openingFrom || "00:00"} – {filters.openingUntil || "24:00"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, openingFrom: "", openingUntil: "" }))
                    }
                    className="hover:text-[#A12D3A] ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...INITIAL_FILTERS,
                    radiusKm: prev.radiusKm,
                  }))
                }
                className="text-[11px] font-bold text-[#A12D3A] hover:underline ml-1 cursor-pointer"
              >
                {t.modals.filter.clearAll}
              </button>
            </div>
          )}

          {/* Grid Layout: Left List + Right Detail & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pt-4 sm:pt-6 items-start">
            {/* Left Column: Kita Cards List */}
            <div
              className={`lg:col-span-5 ${
                mobileView === "detail" ? "hidden lg:block" : "block"
              }`}
            >
              {loading ? (
                <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] text-[#7A6E62]">
                  <div className="w-7 h-7 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
                  <p className="text-xs font-medium">Loading daycares...</p>
                </div>
              ) : displayKitas.length === 0 ? (
                /* Empty state when 0 daycares match active parameters */
                <div className="p-6 sm:p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-[#1E1B18]">
                      {t.results.noWithinRadius.replace("{radius}", String(filters.radiusKm))}
                    </p>
                    <p className="text-xs text-[#7A6E62] mt-1">
                      {allKitas.length > 0
                        ? `There are ${allKitas.length} registered daycares available outside your current search parameters.`
                        : "There are currently no active daycares registered in the system."}
                    </p>
                  </div>
                  {allKitas.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setParentLocation({ lat: 20.571046, lng: 74.94637 })}
                        className="px-3.5 py-2 rounded-xl bg-[#A12D3A] text-white text-xs font-bold shadow-xs hover:bg-[#88222E] cursor-pointer transition-colors"
                      >
                        {t.results.useDaycareArea} (~0.1 km)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStrictRadiusFilter(false);
                          setFilters((prev) => ({
                            ...INITIAL_FILTERS,
                            radiusKm: prev.radiusKm,
                          }));
                        }}
                        className="px-3.5 py-2 rounded-xl border border-[#D5C9B8] bg-white text-[#423223] text-xs font-semibold hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                      >
                        {t.results.showAllDaycares.replace("{count}", String(allKitas.length))}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <KitaList
                  kitas={displayKitas}
                  selectedKitaId={selectedKitaId}
                  favorites={favorites}
                  onSelectKita={(id) => {
                    setSelectedKitaId(id);
                    if (window.innerWidth < 1024) {
                      setMobileView("detail");
                    }
                  }}
                  onToggleFavorite={toggleFavorite}
                  onOpenInquiry={(id, e) => handleOpenSingleInquiry(id, e)}
                  onOpenGallery={(k) => handleOpenGallery(k, 0)}
                  catchmentRadius={filters.radiusKm}
                />
              )}
            </div>

            {/* Right Column: Interactive Map & Detail Showcase */}
            <div
              className={`lg:col-span-7 space-y-5 ${
                mobileView === "list" ? "hidden lg:block" : "block"
              }`}
            >
              {activeKita ? (
                <>
                  {/* Back to list button on mobile */}
                  <div className="lg:hidden pb-1">
                    <button
                      onClick={() => setMobileView("list")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#A12D3A] bg-[#FFF8F2] px-3.5 py-2 rounded-lg border border-[#F3E2D5] min-h-[40px] active:scale-95 transition-all"
                    >
                      <span>{t.results.backToList}</span>
                    </button>
                  </div>

                  {/* Map Section with Parent Location & Catchment Circle */}
                  <MapSection
                    kitas={displayKitas}
                    activeKita={activeKita}
                    onSelectKita={(id) => setSelectedKitaId(id)}
                    userLocation={parentLocation}
                    catchmentRadius={filters.radiusKm}
                  />

                  {/* Daycare Detail Showcase */}
                  <KitaDetail
                    kita={activeKita}
                    selectedDateFilter={filters.startMonth}
                    onSelectDateFilter={() => {}}
                    onOpenInquiry={() => handleOpenSingleInquiry(activeKita.id)}
                    onOpenGallery={(idx) => handleOpenGallery(activeKita, idx || 0)}
                    catchmentRadius={filters.radiusKm}
                  />
                </>
              ) : (
                <div className="h-[280px] flex items-center justify-center bg-[#FAF8F5] rounded-2xl border border-[#E5DDD2] text-[#7A6E62] text-xs">
                  {loading ? "Loading interactive map..." : "No daycare selected"}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Modals */}
      {enquiryModalOpen && activeKita && (
        <EnquiryModal
          activeKitaName={activeKita.name}
          activeKitaId={activeKita.id}
          activeCaretakerId={activeKita.caretakerId}
          caretakerIds={displayKitas.map((k) => k.caretakerId).filter(Boolean) as string[]}
          initialScope={enquiryScope}
          totalMapCount={displayKitas.length}
          favoritesCount={Object.values(favorites).filter(Boolean).length}
          daycareIds={displayKitas.map((k) => k.id)}
          daycareNames={displayKitas.map((k) => k.name)}
          onClose={() => setEnquiryModalOpen(false)}
        />
      )}

      {/* Parameter-Based Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={() =>
          setFilters((prev) => ({
            ...INITIAL_FILTERS,
            radiusKm: prev.radiusKm,
          }))
        }
        totalMatchesCount={displayKitas.length}
      />

      {/* 6. Image Gallery Lightbox Modal */}
      {galleryOpen && (galleryKita || activeKita) && (
        <ImageGalleryModal
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          kita={galleryKita || activeKita!}
          initialIndex={galleryInitialIndex}
          onOpenInquiry={() =>
            handleOpenSingleInquiry((galleryKita || activeKita)!.id)
          }
        />
      )}
    </div>
  );
}
