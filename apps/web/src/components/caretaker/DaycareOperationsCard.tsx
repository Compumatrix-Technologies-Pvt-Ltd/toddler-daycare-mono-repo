"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker, CaretakerPhoto, DEFAULT_PHOTOS } from "../../context/CaretakerContext";
import { caretakerApi } from "@/utils/caretakerApi";
import {
  formatPostcodeCity,
  formatStreetDisplay,
  parseAddressComponents,
} from "../map/mapUtils";

export function DaycareOperationsCard() {
  const { t } = useLanguage();
  const { profile, updateProfile, syncFromBackendDaycare } = useCaretaker();

  // Basic Information
  const [daycareName, setDaycareName] = useState(profile.daycareName || "");
  const [caregiverName, setCaregiverName] = useState(profile.caregiverName || "");
  const [gender, setGender] = useState(profile.caregiverGender || "");
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  // Operations
  const [visibilityWindow, setVisibilityWindow] = useState(profile.visibilityWindow || "");
  const [operatingHours, setOperatingHours] = useState(profile.operatingHours || "");
  const [maxCapacity, setMaxCapacity] = useState(profile.maxCapacity || "");

  // Contact & Links
  const [email, setEmail] = useState(profile.email || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [phone, setPhone] = useState(profile.phone || "");

  // Additional Details
  const [mealType, setMealType] = useState<"self" | "delivered" | "">(
    (profile.mealType as "self" | "delivered" | "") || ""
  );
  const [petStatus, setPetStatus] = useState<"none" | "pets" | "">(
    (profile.petStatus as "none" | "pets" | "") || ""
  );

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Photos State & Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photosList, setPhotosList] = useState<CaretakerPhoto[]>(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos;
    }
    return [];
  });
  const photosListRef = useRef<CaretakerPhoto[]>(photosList);
  photosListRef.current = photosList;

  // Sync state with CaretakerContext profile
  useEffect(() => {
    if (profile.daycareName !== undefined) setDaycareName(profile.daycareName);
    if (profile.caregiverName !== undefined) setCaregiverName(profile.caregiverName);
    if (profile.caregiverGender !== undefined) setGender(profile.caregiverGender);
    if (profile.visibilityWindow !== undefined) setVisibilityWindow(profile.visibilityWindow);
    if (profile.operatingHours !== undefined) setOperatingHours(profile.operatingHours);
    if (profile.maxCapacity !== undefined) setMaxCapacity(profile.maxCapacity);
    if (profile.email !== undefined) setEmail(profile.email);
    if (profile.website !== undefined) setWebsite(profile.website);
    if (profile.phone !== undefined) setPhone(profile.phone);
    if (profile.mealType !== undefined) setMealType(profile.mealType as "self" | "delivered" | "");
    if (profile.petStatus !== undefined) setPetStatus(profile.petStatus as "none" | "pets" | "");
    if (profile.photos) setPhotosList(profile.photos);
  }, [
    profile.daycareName,
    profile.caregiverName,
    profile.caregiverGender,
    profile.visibilityWindow,
    profile.operatingHours,
    profile.maxCapacity,
    profile.email,
    profile.website,
    profile.phone,
    profile.mealType,
    profile.petStatus,
    profile.photos,
  ]);

  // State for existing daycare check & pending files to upload
  const [hasExistingDaycare, setHasExistingDaycare] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<{ id: string; file: File }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch existing daycare on mount
  useEffect(() => {
    const token = caretakerApi.getToken();
    if (!token) return;

    caretakerApi
      .getDaycare()
      .then((data) => {
        setHasExistingDaycare(true);
        if (data.daycareName) setDaycareName(data.daycareName);
        if (data.caregiverName) setCaregiverName(data.caregiverName);
        if (data.caregiverGender) setGender(data.caregiverGender);
        if (data.operations?.operatingHours) setOperatingHours(data.operations.operatingHours);
        if (data.operations?.visibilityWindow) setVisibilityWindow(data.operations.visibilityWindow);
        if (data.operations?.maxCapacity) setMaxCapacity(`${data.operations.maxCapacity} children`);
        if (data.contact?.email) setEmail(data.contact.email);
        if (data.contact?.website) setWebsite(data.contact.website);
        if (data.contact?.phone) setPhone(data.contact.phone);
        if (data.additionalDetails?.meals) {
          setMealType(data.additionalDetails.meals === "self-cooked" ? "self" : "delivered");
        }
        if (data.additionalDetails?.pets) {
          setPetStatus(data.additionalDetails.pets === "have-pets" ? "pets" : "none");
        }
        if (data.location) {
          const loc = data.location;
          if (loc.latitude && loc.longitude) {
            updateProfile({
              lat: String(loc.latitude),
              lng: String(loc.longitude),
              street: formatStreetDisplay(loc.street, loc.houseNumber),
              city: formatPostcodeCity(loc.postcode, loc.city),
            });
          }
        }
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          const mappedPhotos = data.photos.map((p: any, idx: number) => ({
            id: p._id || `photo-${idx}`,
            label: `Photo ${idx + 1}`,
            src: p.url.startsWith("http") ? p.url : `http://localhost:5000${p.url}`,
          }));
          setPhotosList(mappedPhotos);
          updateProfile({ photos: mappedPhotos, photoCount: mappedPhotos.length });
        }
        if (data.status) {
          updateProfile({
            approvalStatus: data.status,
          });
        }
      })
      .catch(() => {
        setHasExistingDaycare(false);
      });
  }, []);

  // Track newly selected photos files & generate local preview
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    fileList.forEach((file) => {
      const uniqueId = `new-photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Register in pending uploads
      setPendingUploads((prev) => [...prev, { id: uniqueId, file }]);

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        if (base64Url) {
          const newPhoto: CaretakerPhoto = {
            id: uniqueId,
            label: file.name.replace(/\.[^/.]+$/, "") || t.caretakerProfile.operations.photoGallery,
            src: base64Url,
          };
          setPhotosList((prev) => {
            const updated = [...prev, newPhoto];
            updateProfile({ photos: updated, photoCount: updated.length });
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };


  //form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      formData.append("daycareName", daycareName);
      formData.append("caregiverName", caregiverName);
      formData.append("caregiverGender", (gender || "other").toLowerCase());
      formData.append(
        "operations",
        JSON.stringify({
          visibilityWindow,
          operatingHours,
          maxCapacity: Number(String(maxCapacity).replace(/\D/g, "")) || 5,
        })
      );
      formData.append(
        "contact",
        JSON.stringify({ email, website, phone })
      );
      formData.append(
        "additionalDetails",
        JSON.stringify({
          meals: mealType === "self" ? "self-cooked" : "delivered",
          pets: petStatus === "pets" ? "have-pets" : "no-pets",
        })
      );
      // Parse street and house number cleanly
      const parsedLocation = parseAddressComponents(
        profile.street || "Stargarder Straße",
        profile.city || "10437, Berlin"
      );

      const latNum = parseFloat(String(profile.lat));
      const lngNum = parseFloat(String(profile.lng));

      formData.append(
        "location",
        JSON.stringify({
          latitude: Number.isFinite(latNum) ? latNum : 52.5413,
          longitude: Number.isFinite(lngNum) ? lngNum : 13.4135,
          street: parsedLocation.street,
          houseNumber: parsedLocation.houseNumber,
          postcode: parsedLocation.postcode,
          city: parsedLocation.city,
          areaType: profile.areaType,
          catchmentRadiusKm: profile.catchmentRadiusKm,
        })
      );
      // 1. Identify retained existing photos already saved in MongoDB (filter out newly selected base64/blob files)
      const retainedExistingPhotos = photosList
        .filter((p) => !p.src.startsWith("data:") && !p.src.startsWith("blob:"))
        .map((p) => {
          try {
            const urlObj = new URL(p.src, "http://localhost:5000");
            return urlObj.pathname;
          } catch {
            return p.src;
          }
        });

      formData.append("existingPhotos", JSON.stringify(retainedExistingPhotos));

      // 2. Append newly chosen raw files from pendingUploads
      pendingUploads.forEach((item) => {
        formData.append("photos", item.file);
      });

      let savedData: any = null;
      if (hasExistingDaycare) {
        // Calls PUT /api/caretaker/daycare
        const res = await caretakerApi.updateDaycare(formData);
        savedData = res?.data || res;
      } else {
        // Calls POST /api/caretaker/daycare
        const res = await caretakerApi.createDaycare(formData);
        savedData = res?.data || res;
        setHasExistingDaycare(true);
      }

      setPendingUploads([]);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);

      // Notify PinLocationCard to lock the saved map location
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("daycare-profile-saved"));
      }

      // Re-synchronize photo list and profile context with verified MongoDB response
      if (savedData) {
        syncFromBackendDaycare(savedData, { preservePinState: true });
      }
      if (savedData && Array.isArray(savedData.photos)) {
        const mappedPhotos = savedData.photos.map((p: any, idx: number) => ({
          id: p._id || `photo-${idx}`,
          label: `Photo ${idx + 1}`,
          src: p.url.startsWith("http") ? p.url : `http://localhost:5000${p.url}`,
        }));
        setPhotosList(mappedPhotos);
      } else {
        updateProfile({
          daycareName,
          caregiverName,
          caregiverGender: gender,
          operatingHours,
          photos: photosList,
          photoCount: photosList.length,
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to save daycare profile");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenderOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFieldChange = (key: string, value: any) => {
    updateProfile({ [key]: value });
  };

  const handleRemovePhoto = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Remove from visual photos list
    setPhotosList((prev) => {
      const updated = prev.filter((p) => p.id !== idToRemove);
      updateProfile({ photos: updated, photoCount: updated.length });
      return updated;
    });

    // 2. Remove from pending uploads queue if it was a newly chosen file
    setPendingUploads((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-7">
      {/* Card Header with Green Bar */}
      <div className="flex items-start gap-3 mb-6 sm:mb-8">
        <div className="w-1 h-7 bg-[#15803D] rounded-full shrink-0 mt-0.5" />
        <div>
          <h2
            className="text-[20px] sm:text-[22px] font-bold text-[#1E1B18] tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.caretakerProfile.operations.title}
          </h2>
          <p className="text-[14px] text-[#7A6E62] mt-1.5 leading-relaxed">
            {t.caretakerProfile.operations.subtitle}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[14px] flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
        {/* Two-Column Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* ============================================================ */}
          {/* COLUMN 1: Basic Information + Operations                     */}
          {/* ============================================================ */}
          <div className="space-y-6">
            {/* Section: Basic information */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#166534] tracking-wide uppercase">
                {t.caretakerProfile.operations.basicInfo}
              </h3>

              {/* Daycare name */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.daycareName}
                </label>
                <input
                  type="text"
                  value={daycareName}
                  placeholder={t.caretakerProfile.operations.daycareNamePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDaycareName(val);
                    handleFieldChange("daycareName", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Caregiver full name */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.caregiverName}
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  placeholder={t.caretakerProfile.operations.caregiverNamePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCaregiverName(val);
                    handleFieldChange("caregiverName", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Caregiver gender */}
              <div className="relative" ref={genderDropdownRef}>
                <label
                  htmlFor="caregiver-gender-trigger"
                  className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
                >
                  {t.caretakerProfile.operations.caregiverGender}
                </label>

                {/* Custom Dropdown Trigger */}
                <button
                  id="caregiver-gender-trigger"
                  type="button"
                  onClick={() => setIsGenderOpen(!isGenderOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isGenderOpen}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] cursor-pointer"
                >
                  <span
                    className={
                      gender && gender !== ""
                        ? "text-[#1E1B18] font-medium"
                        : "text-[#9E9284]"
                    }
                  >
                    {gender === "Female"
                      ? t.caretakerProfile.operations.genderFemale
                      : gender === "Male"
                        ? t.caretakerProfile.operations.genderMale
                        : gender === "Diverse"
                          ? t.caretakerProfile.operations.genderDiverse
                          : t.caretakerProfile.operations.genderSelectPlaceholder}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#7A6E62] transition-transform duration-200 shrink-0 ${isGenderOpen ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Options Menu */}
                {isGenderOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#E5DDD2] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    {/* Default Unselected / Select Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={!gender}
                      onClick={() => {
                        setGender("");
                        handleFieldChange("caregiverGender", "");
                        setIsGenderOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[14px] text-[#9E9284] italic border-b border-[#F0EBE1] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      {t.caretakerProfile.operations.genderSelectPlaceholder}
                    </button>

                    {/* Female Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={gender === "Female"}
                      onClick={() => {
                        setGender("Female");
                        handleFieldChange("caregiverGender", "Female");
                        setIsGenderOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors cursor-pointer ${gender === "Female"
                        ? "bg-[#FAF7F2] text-[#A12D3A] font-bold"
                        : "text-[#1E1B18] hover:bg-[#FAF8F5]"
                        }`}
                    >
                      <span>{t.caretakerProfile.operations.genderFemale}</span>
                      {gender === "Female" && (
                        <svg className="w-4 h-4 text-[#A12D3A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Male Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={gender === "Male"}
                      onClick={() => {
                        setGender("Male");
                        handleFieldChange("caregiverGender", "Male");
                        setIsGenderOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors cursor-pointer ${gender === "Male"
                        ? "bg-[#FAF7F2] text-[#A12D3A] font-bold"
                        : "text-[#1E1B18] hover:bg-[#FAF8F5]"
                        }`}
                    >
                      <span>{t.caretakerProfile.operations.genderMale}</span>
                      {gender === "Male" && (
                        <svg className="w-4 h-4 text-[#A12D3A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Diverse Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={gender === "Diverse"}
                      onClick={() => {
                        setGender("Diverse");
                        handleFieldChange("caregiverGender", "Diverse");
                        setIsGenderOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors cursor-pointer ${gender === "Diverse"
                        ? "bg-[#FAF7F2] text-[#A12D3A] font-bold"
                        : "text-[#1E1B18] hover:bg-[#FAF8F5]"
                        }`}
                    >
                      <span>{t.caretakerProfile.operations.genderDiverse}</span>
                      {gender === "Diverse" && (
                        <svg className="w-4 h-4 text-[#A12D3A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Operations */}
            <div className="space-y-4 pt-4 border-t border-[#F0EBE1]">
              <h3 className="text-[14px] font-bold text-[#166534] tracking-wide uppercase">
                {t.caretakerProfile.operations.operationsSection}
              </h3>

              {/* Visibility window */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.visibilityWindow}
                </label>
                <input
                  type="text"
                  value={visibilityWindow}
                  placeholder={t.caretakerProfile.operations.visibilityWindowPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVisibilityWindow(val);
                    handleFieldChange("visibilityWindow", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Operating hours */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.operatingHours}
                </label>
                <input
                  type="text"
                  value={operatingHours}
                  placeholder={t.caretakerProfile.operations.operatingHoursPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOperatingHours(val);
                    handleFieldChange("operatingHours", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Max capacity */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.maxCapacity}
                </label>
                <input
                  type="text"
                  value={maxCapacity}
                  placeholder={t.caretakerProfile.operations.maxCapacityPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxCapacity(val);
                    handleFieldChange("maxCapacity", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMN 2: Contact & links + Details + Photo gallery          */}
          {/* ============================================================ */}
          <div className="space-y-6">
            {/* Section: Contact & links */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#166534] tracking-wide uppercase">
                {t.caretakerProfile.operations.contactLinks}
              </h3>

              {/* Email address */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.emailAddress}
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder={t.caretakerProfile.operations.emailPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    handleFieldChange("email", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.website}
                </label>
                <input
                  type="text"
                  value={website}
                  placeholder={t.caretakerProfile.operations.websitePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebsite(val);
                    handleFieldChange("website", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.phoneNumber}
                </label>
                <input
                  type="tel"
                  value={phone}
                  placeholder={t.caretakerProfile.operations.phonePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhone(val);
                    handleFieldChange("phone", val);
                  }}
                  className="w-full h-[46px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>
            </div>

            {/* Section: Additional details */}
            <div className="space-y-4 pt-4 border-t border-[#F0EBE1]">
              <h3 className="text-[14px] font-bold text-[#166534] tracking-wide uppercase">
                {t.caretakerProfile.operations.additionalDetails}
              </h3>

              {/* Meals Radios */}
              <div>
                <span className="block text-[13px] font-semibold text-[#4B3E2F] mb-2">
                  {t.caretakerProfile.operations.meals}
                </span>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                    <input
                      type="radio"
                      name="meals"
                      checked={mealType === "self"}
                      onChange={() => {
                        setMealType("self");
                        handleFieldChange("mealType", "self");
                      }}
                      className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                    />
                    <span>{t.caretakerProfile.operations.mealsSelfCooked}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                    <input
                      type="radio"
                      name="meals"
                      checked={mealType === "delivered"}
                      onChange={() => {
                        setMealType("delivered");
                        handleFieldChange("mealType", "delivered");
                      }}
                      className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                    />
                    <span>{t.caretakerProfile.operations.mealsDelivered}</span>
                  </label>
                </div>
              </div>

              {/* Pets Radios */}
              <div>
                <span className="block text-[13px] font-semibold text-[#4B3E2F] mb-2">
                  {t.caretakerProfile.operations.pets}
                </span>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                    <input
                      type="radio"
                      name="pets"
                      checked={petStatus === "none"}
                      onChange={() => {
                        setPetStatus("none");
                        handleFieldChange("petStatus", "none");
                      }}
                      className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                    />
                    <span>{t.caretakerProfile.operations.petsNo}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                    <input
                      type="radio"
                      name="pets"
                      checked={petStatus === "pets"}
                      onChange={() => {
                        setPetStatus("pets");
                        handleFieldChange("petStatus", "pets");
                      }}
                      className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                    />
                    <span>{t.caretakerProfile.operations.petsYes}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section: Photo gallery */}
            <div className="space-y-3 pt-4 border-t border-[#F0EBE1]">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#166534] tracking-wide uppercase">
                  {t.caretakerProfile.operations.photoGallery}
                </h3>
                <span className="text-[12px] font-medium text-[#7A6E62]">
                  {photosList.length} {t.caretakerProfile.operations.photoGallery}
                </span>
              </div>

              {/* Hidden file input for uploading images */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label={t.caretakerProfile.operations.addPhoto}
              />

              <div className="grid grid-cols-2 min-[390px]:grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {photosList.map((item) => (
                  <div key={item.id} className="space-y-1.5 text-center group">
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DDD2] bg-[#FAF8F5] shadow-xs">
                      {/* Image Preview */}
                      <Image
                        src={item.src}
                        alt={item.label}
                        fill
                        sizes="(max-width: 640px) 33vw, 20vw"
                        unoptimized={
                          item.src.startsWith("data:") ||
                          item.src.includes("localhost") ||
                          item.src.includes("127.0.0.1")
                        }
                        className="object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Remove Button Overlay */}
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(item.id, e)}
                        title={t.caretakerProfile.operations.removePhoto}
                        aria-label={`${t.caretakerProfile.operations.removePhoto}: ${item.label}`}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-[#A12D3A] text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 shadow-md cursor-pointer z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <span className="text-[11px] font-medium text-[#7A6E62] block truncate">
                      {item.label}
                    </span>
                  </div>
                ))}

                {/* Add Photo Card */}
                <div className="space-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={t.caretakerProfile.operations.addPhoto}
                    aria-label={t.caretakerProfile.operations.addPhoto}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-[#D5C9B8] hover:border-[#15803D] bg-[#FAF8F5]/80 hover:bg-[#F0FDF4] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <svg className="w-6 h-6 text-[#15803D] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-semibold text-[#15803D]">
                      {t.caretakerProfile.operations.addPhoto}
                    </span>
                  </button>
                  <span className="text-[11px] text-transparent select-none">.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width CTA: Save profile changes */}
        <div className="pt-4 border-t border-[#E5DDD2]">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-[50px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-bold text-[16px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {isSaving ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : savedSuccess ? (
              <>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.caretakerProfile.operations.saveSuccess}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.caretakerProfile.operations.saveButton}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
