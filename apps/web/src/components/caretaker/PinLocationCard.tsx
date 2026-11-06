"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";

export function PinLocationCard() {
  const { t } = useLanguage();
  const { profile, updateProfile } = useCaretaker();

  const [street, setStreet] = useState(profile.street);
  const [city, setCity] = useState(profile.city);
  const [lat, setLat] = useState(profile.lat || "52.5413");
  const [lng, setLng] = useState(profile.lng || "13.4135");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasValidated, setHasValidated] = useState(profile.isLocationPinned);

  useEffect(() => {
    setStreet(profile.street);
    setCity(profile.city);
    setLat(profile.lat || "52.5413");
    setLng(profile.lng || "13.4135");
    setHasValidated(profile.isLocationPinned);
  }, [profile.street, profile.city, profile.lat, profile.lng, profile.isLocationPinned]);

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStreet(val);
    updateProfile({ street: val });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity(val);
    updateProfile({ city: val });
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLookingUp(true);
    setTimeout(() => {
      setIsLookingUp(false);
      setHasValidated(true);
      updateProfile({ street, city, lat, lng, isLocationPinned: true });
    }, 500);
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header with Green Bar */}
          <div className="flex items-start gap-3">
            <div className="w-1 h-7 bg-[#15803D] rounded-full shrink-0 mt-0.5" />
            <div>
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#1E1B18] tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-plus-jakarta)" }}
              >
                {t.caretakerProfile.location.title}
              </h2>
              <p className="text-[14px] text-[#7A6E62] mt-1.5 leading-relaxed">
                {t.caretakerProfile.location.subtitle}
              </p>
            </div>
          </div>

          {/* Address Form */}
          <form onSubmit={handleLookup} className="space-y-4 pt-2">
            {/* Street & House Number */}
            <div>
              <label
                htmlFor="location-street"
                className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
              >
                {t.caretakerProfile.location.streetLabel}
              </label>
              <input
                id="location-street"
                type="text"
                value={street}
                onChange={handleStreetChange}
                placeholder={t.caretakerProfile.location.streetPlaceholder}
                className="w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
              />
            </div>

            {/* Postcode & City */}
            <div>
              <label
                htmlFor="location-city"
                className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
              >
                {t.caretakerProfile.location.postcodeCityLabel}
              </label>
              <input
                id="location-city"
                type="text"
                value={city}
                onChange={handleCityChange}
                placeholder={t.caretakerProfile.location.postcodeCityPlaceholder}
                className="w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
              />
            </div>

            {/* Look up CTA Button */}
            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full h-[48px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-semibold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {isLookingUp ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{t.caretakerProfile.location.lookupButton}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Map Preview */}
        <div className="lg:col-span-7 relative h-[300px] sm:h-[350px] rounded-2xl overflow-hidden border border-[#E5DDD2] bg-[#E9E7E2] shadow-inner">
          {/* Map Image */}
          <Image
            src="/assets/map.png"
            alt="Berlin Map Location"
            fill
            className="object-cover"
            priority
          />

          {/* Top Pill Overlay: Lat/Lng Validated */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#1E1B18]/90 backdrop-blur-md text-white text-[12px] font-mono font-medium px-3.5 py-1.5 rounded-full shadow-md border border-white/10">
            <svg className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Lat {lat} · Lng {lng}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span className="text-[#86EFAC] font-sans text-[11px] font-semibold">
              {t.caretakerProfile.location.validatedBadge}
            </span>
          </div>

          {/* Center Location Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#16A34A] border-4 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div className="mt-1 bg-white/95 backdrop-blur-sm border border-[#DDD3C4] px-2.5 py-0.5 rounded-md shadow-xs text-[11px] font-bold text-[#1E1B18]">
              Berlin
            </div>
          </div>

          {/* Bottom Tooltip Card */}
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-sm border border-[#E5DDD2] rounded-xl px-3.5 py-2.5 shadow-md flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[12px] text-[#5C5043] leading-snug">
              {t.caretakerProfile.location.dragTooltip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
