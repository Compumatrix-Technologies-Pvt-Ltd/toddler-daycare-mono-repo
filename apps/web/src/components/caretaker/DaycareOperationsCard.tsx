"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker, CaretakerPhoto, DEFAULT_PHOTOS } from "../../context/CaretakerContext";
import { caretakerApi } from "@/utils/caretakerApi";
import { DatePicker, TimePicker } from "@repo/ui";
import {
  formatPostcodeCity,
  formatStreetDisplay,
  parseAddressComponents,
} from "../map/mapUtils";

function normalizeDateString(s: string): string {
  if (!s) return "";
  const trimmed = s.trim();
  // Check DD.MM.YYYY
  const deMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (deMatch && deMatch[1] && deMatch[2] && deMatch[3]) {
    const day = deMatch[1].padStart(2, "0");
    const month = deMatch[2].padStart(2, "0");
    const year = deMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Check YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoMatch) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return trimmed;
}

function parseVisibilityDates(val: string): { start: string; end: string } {
  if (!val || typeof val !== "string") return { start: "", end: "" };
  const parts = val.split(/\s*(?:–|-|to)\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { start: normalizeDateString(parts[0] || ""), end: normalizeDateString(parts[1] || "") };
  } else if (parts.length === 1) {
    return { start: normalizeDateString(parts[0] || ""), end: "" };
  }
  return { start: "", end: "" };
}

function parseOperatingHours(val: string): { from: string; to: string } {
  if (!val || typeof val !== "string") return { from: "08:00", to: "16:00" };
  const match = /(\d{1,2}:\d{2})\s*(?:–|-|to)\s*(\d{1,2}:\d{2})/i.exec(val);
  if (match && match[1] && match[2]) {
    const from = match[1].length === 4 ? `0${match[1]}` : match[1];
    const to = match[2].length === 4 ? `0${match[2]}` : match[2];
    return { from, to };
  }
  return { from: "08:00", to: "16:00" };
}

const MAX_PHOTOS = 5;

interface FieldErrors {
  daycareName?: string;
  caregiverName?: string;
  gender?: string;
  visibilityWindow?: string;
  operatingHours?: string;
  maxCapacity?: string;
  childAge?: string;
  email?: string;
  website?: string;
  phone?: string;
  mealType?: string;
  petStatus?: string;
  photos?: string;
}

export function DaycareOperationsCard() {
  const { t, language } = useLanguage();
  const { profile, updateProfile, syncFromBackendDaycare } = useCaretaker();

  // Basic Information
  const [daycareName, setDaycareName] = useState(profile.daycareName || "");
  const [caregiverName, setCaregiverName] = useState(profile.caregiverName || "");
  const [gender, setGender] = useState(profile.caregiverGender || "");
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  // Operations
  const initialHours = parseOperatingHours(profile.operatingHours || "");
  const [operatingHoursFrom, setOperatingHoursFrom] = useState(initialHours.from);
  const [operatingHoursTo, setOperatingHoursTo] = useState(initialHours.to);
  const [visibilityWindow, setVisibilityWindow] = useState(profile.visibilityWindow || "");
  const [operatingHours, setOperatingHours] = useState(profile.operatingHours || "");
  const [maxCapacity, setMaxCapacity] = useState(profile.maxCapacity || "");
  const [childAge, setChildAge] = useState(profile.childAge || "0 – 3 years");
  const [isChildAgeOpen, setIsChildAgeOpen] = useState(false);
  const childAgeDropdownRef = useRef<HTMLDivElement>(null);

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

  // Validation State
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clear single field error helper
  const clearError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Comprehensive Field Validator
  const validateFields = (): boolean => {
    const errors: FieldErrors = {};
    const v = t.caretakerProfile.operations.validation;

    // 1. Daycare Name (min 2 chars)
    if (!daycareName.trim() || daycareName.trim().length < 2) {
      errors.daycareName =
        v?.daycareNameRequired || "Please enter the daycare name (at least 2 characters).";
    }

    // 2. Caregiver Name (min 2 chars)
    if (!caregiverName.trim() || caregiverName.trim().length < 2) {
      errors.caregiverName =
        v?.caregiverNameRequired || "Please enter the caregiver full name (at least 2 characters).";
    }

    // 3. Gender (must be selected)
    if (!gender || (gender !== "Female" && gender !== "Male" && gender !== "Diverse")) {
      errors.gender = v?.genderRequired || "Please select the caregiver gender.";
    }

    // 4. Visibility window (required)
    if (!visibilityWindow.trim()) {
      errors.visibilityWindow = v?.visibilityWindowRequired || "Please select a visibility window.";
    }

    // 5. Operating hours (from & to required, to > from)
    if (!operatingHoursFrom.trim() || !operatingHoursTo.trim()) {
      errors.operatingHours = v?.operatingHoursRequired || "Please specify your operating hours (From and To).";
    } else if (operatingHoursTo <= operatingHoursFrom) {
      errors.operatingHours =
        (v as any)?.operatingHoursOrder || "End time must be later than start time.";
    }

    // 6. Max capacity (positive integer >= 1)
    const capacityNum = parseInt(String(maxCapacity).replace(/\D/g, ""), 10);
    if (!maxCapacity.trim() || isNaN(capacityNum) || capacityNum <= 0) {
      errors.maxCapacity = v?.maxCapacityRequired || "Please enter a valid capacity (at least 1 child).";
    }

    // 6b. Accepted Child Age (required)
    if (!childAge || !childAge.trim()) {
      errors.childAge =
        v?.childAgeRequired || "Please select the accepted child age range.";
    }

    // 7. Email (valid email format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = v?.emailRequired || "Please enter a valid email address.";
    }

    // 8. Website (optional, but if filled, must be valid URL or domain)
    if (website.trim()) {
      const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!urlRegex.test(website.trim())) {
        errors.website = v?.websiteInvalid || "Please enter a valid website URL (e.g. www.kita.de).";
      }
    }

    // 9. Phone (required, min 6 digits)
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone.trim() || digitsOnly.length < 6) {
      errors.phone = v?.phoneRequired || "Please enter a valid phone number (at least 6 digits).";
    }

    // 10. Meal Type (required)
    if (!mealType) {
      errors.mealType = v?.mealTypeRequired || "Please select a meal option.";
    }

    // 11. Pet Status (required)
    if (!petStatus) {
      errors.petStatus = v?.petStatusRequired || "Please select a pet policy.";
    }

    // 12. Photos (at least 1 photo uploaded, maximum 5 photos)
    if (photosList.length === 0) {
      errors.photos = v?.photosRequired || "Please upload at least one photo (e.g. cover photo).";
    } else if (photosList.length > MAX_PHOTOS) {
      errors.photos =
        t.caretakerProfile.operations.maxPhotosReached ||
        "Maximum 5 photos allowed. Please remove a photo to upload a replacement.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Photos State & Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetSlot, setTargetSlot] = useState<{ index: number; label: string } | null>(null);
  const defaultSlotDefs = [
    { key: "cover", label: t.caretakerProfile.operations.cover || "Cover" },
    { key: "playArea", label: t.caretakerProfile.operations.playArea || "Play area" },
    { key: "napRoom", label: t.caretakerProfile.operations.napRoom || "Nap room" },
    { key: "garden", label: t.caretakerProfile.operations.garden || "Garden" },
  ];
  const [photosList, setPhotosList] = useState<CaretakerPhoto[]>(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos;
    }
    return [];
  });
  const photosListRef = useRef<CaretakerPhoto[]>(photosList);
  photosListRef.current = photosList;

  const handleTriggerUpload = (slotIndex?: number, slotLabel?: string) => {
    // If attempting to add a new photo (not replacing an existing one) when already at MAX_PHOTOS:
    if (
      (slotIndex === undefined || slotIndex >= photosListRef.current.length) &&
      photosListRef.current.length >= MAX_PHOTOS
    ) {
      setErrorMessage(
        t.caretakerProfile.operations.maxPhotosReached ||
          "Maximum 5 photos allowed. Please remove a photo to upload a replacement."
      );
      setFieldErrors((prev) => ({
        ...prev,
        photos:
          t.caretakerProfile.operations.maxPhotosReached ||
          "Maximum 5 photos allowed. Please remove a photo to upload a replacement.",
      }));
      return;
    }

    if (slotIndex !== undefined && slotLabel !== undefined) {
      setTargetSlot({ index: slotIndex, label: slotLabel });
    } else {
      setTargetSlot(null);
    }
    fileInputRef.current?.click();
  };

  // Sync state with CaretakerContext profile
  useEffect(() => {
    if (profile.daycareName !== undefined) setDaycareName(profile.daycareName);
    if (profile.caregiverName !== undefined) setCaregiverName(profile.caregiverName);
    if (profile.caregiverGender !== undefined) setGender(profile.caregiverGender);
    if (profile.visibilityWindow !== undefined) {
      setVisibilityWindow(profile.visibilityWindow);
    }
    if (profile.operatingHours !== undefined) {
      setOperatingHours(profile.operatingHours);
      const parsed = parseOperatingHours(profile.operatingHours);
      if (parsed.from) setOperatingHoursFrom(parsed.from);
      if (parsed.to) setOperatingHoursTo(parsed.to);
    }
    if (profile.maxCapacity !== undefined) setMaxCapacity(profile.maxCapacity);
    if (profile.childAge !== undefined) setChildAge(profile.childAge);
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
    profile.childAge,
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
        if (data.operations?.operatingHours) {
          setOperatingHours(data.operations.operatingHours);
          const parsed = parseOperatingHours(data.operations.operatingHours);
          setOperatingHoursFrom(parsed.from);
          setOperatingHoursTo(parsed.to);
        }
        if (data.operations?.visibilityWindow) {
          setVisibilityWindow(data.operations.visibilityWindow);
        }
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
        const profileUpdates: any = {};
        if (data.location?.latitude && data.location?.longitude) {
          const loc = data.location;
          profileUpdates.lat = String(loc.latitude);
          profileUpdates.lng = String(loc.longitude);
          profileUpdates.street = formatStreetDisplay(loc.street, loc.houseNumber);
          profileUpdates.city = formatPostcodeCity(loc.postcode, loc.city);
        }
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          const mappedPhotos = data.photos.slice(0, MAX_PHOTOS).map((p: any, idx: number) => ({
            id: p._id || `photo-${idx}`,
            label: p.label || defaultSlotDefs[idx]?.label || `Photo ${idx + 1}`,
            src: p.url.startsWith("http") ? p.url : `http://localhost:5000${p.url}`,
          }));
          photosListRef.current = mappedPhotos;
          setPhotosList(mappedPhotos);
          profileUpdates.photos = mappedPhotos;
          profileUpdates.photoCount = mappedPhotos.length;
        }
        if (data.status) {
          profileUpdates.approvalStatus = data.status;
        }
        if (Object.keys(profileUpdates).length > 0) {
          updateProfile(profileUpdates);
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

    let fileList = Array.from(files);
    const isReplacingSlot =
      targetSlot !== null && targetSlot.index < photosListRef.current.length;

    if (!isReplacingSlot) {
      const currentCount = photosListRef.current.length;
      const availableSlots = MAX_PHOTOS - currentCount;

      if (availableSlots <= 0) {
        setErrorMessage(
          t.caretakerProfile.operations.maxPhotosReached ||
            "Maximum 5 photos allowed. Please remove a photo to upload a replacement."
        );
        setFieldErrors((prev) => ({
          ...prev,
          photos:
            t.caretakerProfile.operations.maxPhotosReached ||
            "Maximum 5 photos allowed. Please remove a photo to upload a replacement.",
        }));
        e.target.value = "";
        return;
      }

      if (fileList.length > availableSlots) {
        setErrorMessage(
          language === "de"
            ? `Maximal 5 Fotos erlaubt. Es wurden nur die ersten ${availableSlots} Foto(s) hinzugefügt.`
            : `Maximum 5 photos allowed. Only the first ${availableSlots} photo(s) were added.`
        );
        setFieldErrors((prev) => ({
          ...prev,
          photos:
            language === "de"
              ? `Maximal 5 Fotos erlaubt. Sie können nur noch ${availableSlots} Foto(s) hinzufügen.`
              : `Maximum 5 photos allowed. You can only add ${availableSlots} more photo(s).`,
        }));
        fileList = fileList.slice(0, availableSlots);
      }
    } else {
      fileList = fileList.slice(0, 1);
    }

    fileList.forEach((file, fIdx) => {
      const uniqueId = `new-photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Register in pending uploads
      setPendingUploads((prev) => [...prev, { id: uniqueId, file }]);

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        if (base64Url) {
          const currentPhotos = [...photosListRef.current];

          let slotName = file.name.replace(/\.[^/.]+$/, "");
          if (targetSlot && fIdx === 0) {
            slotName = targetSlot.label;
          } else {
            const nextIdx = currentPhotos.length;
            if (defaultSlotDefs[nextIdx]) {
              slotName = defaultSlotDefs[nextIdx].label;
            }
          }

          const newPhoto: CaretakerPhoto = {
            id: uniqueId,
            label: slotName,
            src: base64Url,
          };

          let updated: CaretakerPhoto[];
          if (targetSlot && fIdx === 0 && targetSlot.index < currentPhotos.length) {
            updated = [...currentPhotos];
            updated[targetSlot.index] = newPhoto;
          } else {
            updated = [...currentPhotos, newPhoto];
          }

          if (updated.length > MAX_PHOTOS) {
            updated = updated.slice(0, MAX_PHOTOS);
          }

          photosListRef.current = updated;
          setPhotosList(updated);
          clearError("photos");
          updateProfile({ photos: updated, photoCount: updated.length });
        }
      };
      reader.readAsDataURL(file);
    });

    setTargetSlot(null);
    e.target.value = "";
  };

  //form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isValid = validateFields();
    if (!isValid) {
      setErrorMessage(
        t.caretakerProfile.operations.validation?.formHasErrors ||
          "Please review and fix the highlighted fields above before saving."
      );
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();

      const finalOperatingHours =
        operatingHoursFrom && operatingHoursTo
          ? `${operatingHoursFrom} – ${operatingHoursTo}`
          : operatingHoursFrom || operatingHoursTo || operatingHours;

      formData.append("daycareName", daycareName);
      formData.append("caregiverName", caregiverName);
      formData.append("caregiverGender", (gender || "other").toLowerCase());
      formData.append(
        "operations",
        JSON.stringify({
          visibilityWindow,
          operatingHours: finalOperatingHours,
          maxCapacity: Number(String(maxCapacity).replace(/\D/g, "")) || 5,
          childAge,
          ageRange: childAge,
        })
      );
      formData.append("childAge", childAge);
      formData.append("ageRange", childAge);
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
          label: p.label || defaultSlotDefs[idx]?.label || `Photo ${idx + 1}`,
          src: p.url.startsWith("http") ? p.url : `http://localhost:5000${p.url}`,
        }));
        setPhotosList(mappedPhotos);
      } else {
        updateProfile({
          daycareName,
          caregiverName,
          caregiverGender: gender,
          visibilityWindow,
          operatingHours: finalOperatingHours,
          maxCapacity,
          childAge,
          email,
          website,
          phone,
          mealType,
          petStatus,
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
      if (
        childAgeDropdownRef.current &&
        !childAgeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsChildAgeOpen(false);
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
    const updated = (photosListRef.current || photosList).filter((p) => p.id !== idToRemove);
    photosListRef.current = updated;
    setPhotosList(updated);
    clearError("photos");
    setErrorMessage(null);
    updateProfile({ photos: updated, photoCount: updated.length });

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
                  {t.caretakerProfile.operations.daycareName} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={daycareName}
                  placeholder={t.caretakerProfile.operations.daycareNamePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDaycareName(val);
                    clearError("daycareName");
                    handleFieldChange("daycareName", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.daycareName
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.daycareName && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.daycareName}</span>
                  </p>
                )}
              </div>

              {/* Caregiver full name */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.caregiverName} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  placeholder={t.caretakerProfile.operations.caregiverNamePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCaregiverName(val);
                    clearError("caregiverName");
                    handleFieldChange("caregiverName", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.caregiverName
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.caregiverName && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.caregiverName}</span>
                  </p>
                )}
              </div>

              {/* Caregiver gender */}
              <div className="relative" ref={genderDropdownRef}>
                <label
                  htmlFor="caregiver-gender-trigger"
                  className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
                >
                  {t.caretakerProfile.operations.caregiverGender} <span className="text-[#DC2626]">*</span>
                </label>

                {/* Custom Dropdown Trigger */}
                <button
                  id="caregiver-gender-trigger"
                  type="button"
                  onClick={() => setIsGenderOpen(!isGenderOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isGenderOpen}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                    fieldErrors.gender
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
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

                {fieldErrors.gender && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.gender}</span>
                  </p>
                )}

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
                        clearError("gender");
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
                        clearError("gender");
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
                        clearError("gender");
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

              {/* Visibility window with DatePicker (dd,mmm,yyyy format) */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.visibilityWindow} <span className="text-[#DC2626]">*</span>
                </label>
                <div className="w-full sm:max-w-md">
                  <DatePicker
                    value={visibilityWindow || null}
                    format="dd,mmm,yyyy"
                    onChange={(_d, str) => {
                      setVisibilityWindow(str);
                      clearError("visibilityWindow");
                      handleFieldChange("visibilityWindow", str);
                    }}
                    locale={language}
                    placeholder={language === "de" ? "z.B. 18, Nov, 2026" : "e.g. 18, Nov, 2026"}
                  />
                </div>

                {/* Display selected visibility window preview */}
                {visibilityWindow && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>
                      {language === "de" ? "Sichtbarkeitsfenster: " : "Visibility Window: "}
                      <strong>{visibilityWindow}</strong>
                    </span>
                  </div>
                )}

                {fieldErrors.visibilityWindow && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.visibilityWindow}</span>
                  </p>
                )}
              </div>

              {/* Operating hours with TimePicker component from @repo/ui */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.operatingHours} <span className="text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <div className="relative z-20">
                    <span className="block text-[11px] font-medium text-[#7A6E62] mb-1 uppercase tracking-wide">
                      {t.caretakerProfile.operations.operatingHoursFrom || "From Time"}
                    </span>
                    <TimePicker
                      value={operatingHoursFrom}
                      onChange={(time) => {
                        setOperatingHoursFrom(time);
                        clearError("operatingHours");
                        const combined = time && operatingHoursTo ? `${time} – ${operatingHoursTo}` : time;
                        setOperatingHours(combined);
                        handleFieldChange("operatingHours", combined);
                      }}
                      locale={language}
                      placeholder="08:00"
                    />
                  </div>
                  <div className="relative z-10">
                    <span className="block text-[11px] font-medium text-[#7A6E62] mb-1 uppercase tracking-wide">
                      {t.caretakerProfile.operations.operatingHoursTo || "To Time"}
                    </span>
                    <TimePicker
                      value={operatingHoursTo}
                      onChange={(time) => {
                        setOperatingHoursTo(time);
                        clearError("operatingHours");
                        const combined = operatingHoursFrom && time ? `${operatingHoursFrom} – ${time}` : time;
                        setOperatingHours(combined);
                        handleFieldChange("operatingHours", combined);
                      }}
                      locale={language}
                      placeholder="16:00"
                    />
                  </div>
                </div>

                {/* Display operating hours preview */}
                {operatingHoursFrom && operatingHoursTo && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5DDD2] text-[#4B3E2F] text-xs font-medium">
                    <svg className="w-3.5 h-3.5 text-[#7A6E62] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                    <span>
                      {language === "de" ? "Öffnungszeiten: " : "Operating Hours: "}
                      <strong>{operatingHoursFrom} – {operatingHoursTo}</strong>
                    </span>
                  </div>
                )}

                {fieldErrors.operatingHours && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.operatingHours}</span>
                  </p>
                )}
              </div>

              {/* Max capacity */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.maxCapacity} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={maxCapacity}
                  placeholder={t.caretakerProfile.operations.maxCapacityPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxCapacity(val);
                    clearError("maxCapacity");
                    handleFieldChange("maxCapacity", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.maxCapacity
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.maxCapacity && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.maxCapacity}</span>
                  </p>
                )}
              </div>

              {/* Accepted Child Age */}
              <div className="relative" ref={childAgeDropdownRef}>
                <label
                  htmlFor="child-age-trigger"
                  className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
                >
                  {t.caretakerProfile.operations.childAge || "Accepted child age"} <span className="text-[#DC2626]">*</span>
                </label>

                {/* Custom Dropdown Trigger */}
                <button
                  id="child-age-trigger"
                  type="button"
                  onClick={() => setIsChildAgeOpen(!isChildAgeOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isChildAgeOpen}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] flex items-center justify-between transition-all focus:outline-none cursor-pointer ${
                    fieldErrors.childAge
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                >
                  <span
                    className={
                      childAge && childAge !== ""
                        ? "text-[#1E1B18] font-medium"
                        : "text-[#9E9284]"
                    }
                  >
                    {childAge || t.caretakerProfile.operations.childAgePlaceholder || "Select accepted child age..."}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#7A6E62] transition-transform duration-200 shrink-0 ${
                      isChildAgeOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {fieldErrors.childAge && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.childAge}</span>
                  </p>
                )}

                {/* Dropdown Options Menu */}
                {isChildAgeOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#E5DDD2] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    {[
                      { value: "0 – 3 years", label: t.caretakerProfile.operations.childAgeOptions?.infantToddler || "0 – 3 years" },
                      { value: "1 – 3 years", label: t.caretakerProfile.operations.childAgeOptions?.toddler || "1 – 3 years" },
                      { value: "2 – 6 years", label: t.caretakerProfile.operations.childAgeOptions?.preschool || "2 – 6 years" },
                      { value: "0 – 6 years", label: t.caretakerProfile.operations.childAgeOptions?.all || "0 – 6 years" },
                      { value: "0 – 1 year", label: t.caretakerProfile.operations.childAgeOptions?.infant || "0 – 1 year" },
                      { value: "1 – 6 years", label: t.caretakerProfile.operations.childAgeOptions?.earlyYears || "1 – 6 years" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={childAge === opt.value}
                        onClick={() => {
                          setChildAge(opt.value);
                          clearError("childAge");
                          handleFieldChange("childAge", opt.value);
                          setIsChildAgeOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors cursor-pointer ${
                          childAge === opt.value
                            ? "bg-[#FAF7F2] text-[#A12D3A] font-bold"
                            : "text-[#1E1B18] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {childAge === opt.value && (
                          <svg className="w-4 h-4 text-[#A12D3A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMN 2: Contact & links + Details                          */}
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
                  {t.caretakerProfile.operations.emailAddress} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder={t.caretakerProfile.operations.emailPlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    clearError("email");
                    handleFieldChange("email", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.email
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
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
                    clearError("website");
                    handleFieldChange("website", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.website
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.website && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.website}</span>
                  </p>
                )}
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5">
                  {t.caretakerProfile.operations.phoneNumber} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  placeholder={t.caretakerProfile.operations.phonePlaceholder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhone(val);
                    clearError("phone");
                    handleFieldChange("phone", val);
                  }}
                  className={`w-full h-[46px] px-4 rounded-xl border text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] transition-all focus:outline-none ${
                    fieldErrors.phone
                      ? "border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      : "border-[#E5DDD2] bg-[#FAF8F5]/60 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
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
                  {t.caretakerProfile.operations.meals} <span className="text-[#DC2626]">*</span>
                </span>
                <div
                  className={`p-2.5 rounded-xl transition-all ${
                    fieldErrors.mealType
                      ? "border border-[#DC2626] bg-[#FEF2F2]/30"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                      <input
                        type="radio"
                        name="meals"
                        checked={mealType === "self"}
                        onChange={() => {
                          setMealType("self");
                          clearError("mealType");
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
                          clearError("mealType");
                          handleFieldChange("mealType", "delivered");
                        }}
                        className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                      />
                      <span>{t.caretakerProfile.operations.mealsDelivered}</span>
                    </label>
                  </div>
                </div>
                {fieldErrors.mealType && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.mealType}</span>
                  </p>
                )}
              </div>

              {/* Pets Radios */}
              <div>
                <span className="block text-[13px] font-semibold text-[#4B3E2F] mb-2">
                  {t.caretakerProfile.operations.pets} <span className="text-[#DC2626]">*</span>
                </span>
                <div
                  className={`p-2.5 rounded-xl transition-all ${
                    fieldErrors.petStatus
                      ? "border border-[#DC2626] bg-[#FEF2F2]/30"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#1E1B18]">
                      <input
                        type="radio"
                        name="pets"
                        checked={petStatus === "none"}
                        onChange={() => {
                          setPetStatus("none");
                          clearError("petStatus");
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
                          clearError("petStatus");
                          handleFieldChange("petStatus", "pets");
                        }}
                        className="w-4 h-4 text-[#A12D3A] focus:ring-[#A12D3A]"
                      />
                      <span>{t.caretakerProfile.operations.petsYes}</span>
                    </label>
                  </div>
                </div>
                {fieldErrors.petStatus && (
                  <p className="text-[12px] text-[#DC2626] font-medium mt-1 flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span>{fieldErrors.petStatus}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section: Photo Gallery matching user screenshot directly below Additional details */}
            <div className="pt-4 border-t border-[#F0EBE1] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <h3
                    className="text-[18px] sm:text-[20px] font-bold text-[#3B6349] tracking-tight"
                    style={{ fontFamily: "var(--font-plus-jakarta)" }}
                  >
                    {t.caretakerProfile.operations.photoGallery || "Photo gallery"}
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    photosList.length >= MAX_PHOTOS
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
                  }`}>
                    {photosList.length} / {MAX_PHOTOS} {language === "de" ? "Fotos" : "Photos"}
                  </span>
                </div>
                {photosList.length >= MAX_PHOTOS && (
                  <span className="text-[11px] text-[#A12D3A] font-medium">
                    {t.caretakerProfile.operations.maxPhotosLimitNotice || "Max 5 photos reached (5/5). Remove an existing photo to upload a replacement."}
                  </span>
                )}
              </div>

              {fieldErrors.photos && (
                <p className="text-[12px] text-[#DC2626] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{fieldErrors.photos}</span>
                </p>
              )}

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

              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none flex-nowrap sm:flex-wrap">
                {/* 1. Predefined standard slots: Cover, Play area, Nap room, Garden */}
                {defaultSlotDefs.map((slot, idx) => {
                  const photo = photosList[idx];
                  if (photo) {
                    return (
                      <div
                        key={photo.id}
                        className="relative w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-[22px] overflow-hidden bg-[#FAF8F5] shadow-2xs group border border-[#E5DDD2]"
                      >
                        {/* Image Preview */}
                        <Image
                          src={photo.src}
                          alt={photo.label || slot.label}
                          fill
                          sizes="(max-width: 640px) 110px, 130px"
                          unoptimized={
                            photo.src.startsWith("data:") ||
                            photo.src.includes("localhost") ||
                            photo.src.includes("127.0.0.1")
                          }
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Remove Button Overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(photo.id, e);
                          }}
                          title={t.caretakerProfile.operations.removePhoto}
                          aria-label={`${t.caretakerProfile.operations.removePhoto}: ${photo.label || slot.label}`}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 hover:bg-[#A12D3A] text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm cursor-pointer z-10"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Bottom gradient overlay with slot label */}
                        <div className="absolute inset-x-0 bottom-0 pt-6 pb-2.5 px-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none rounded-b-[22px]">
                          <span className="text-white text-[12px] sm:text-[13px] font-medium drop-shadow-xs truncate block leading-none">
                            {photo.label || slot.label}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => handleTriggerUpload(idx, slot.label)}
                      className="relative w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-[22px] bg-[#F2EFEA] hover:bg-[#EAE5DE] transition-all p-3 sm:p-3.5 pb-3 sm:pb-3.5 flex flex-col justify-end items-start text-left cursor-pointer group shadow-2xs border border-[#E7E5E2]/70 focus:outline-none focus:ring-2 focus:ring-[#3B6349]/30"
                      title={`${slot.label} - ${t.caretakerProfile.operations.addPhoto}`}
                    >
                      {/* Subtle hover icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="w-7 h-7 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-[#3B6349]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </span>
                      </div>

                      {/* Slot Label matching screenshot: Cover, Play area, Nap room, Garden */}
                      <span className="text-[13px] sm:text-[14px] font-medium text-[#75706B] group-hover:text-[#2E1B10] transition-colors select-none leading-tight truncate w-full">
                        {slot.label}
                      </span>
                    </button>
                  );
                })}

                {/* 2. 5th photo slot (index 4) if present in photosList */}
                {photosList.slice(4, MAX_PHOTOS).map((item, sliceIdx) => (
                  <div
                    key={item.id}
                    className="relative w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-[22px] overflow-hidden bg-[#FAF8F5] shadow-2xs group border border-[#E5DDD2]"
                  >
                    <Image
                      src={item.src}
                      alt={item.label}
                      fill
                      sizes="(max-width: 640px) 110px, 130px"
                      unoptimized={
                        item.src.startsWith("data:") ||
                        item.src.includes("localhost") ||
                        item.src.includes("127.0.0.1")
                      }
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(item.id, e);
                      }}
                      title={t.caretakerProfile.operations.removePhoto}
                      aria-label={`${t.caretakerProfile.operations.removePhoto}: ${item.label}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 hover:bg-[#A12D3A] text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm cursor-pointer z-10"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="absolute inset-x-0 bottom-0 pt-6 pb-2.5 px-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none rounded-b-[22px]">
                      <span className="text-white text-[12px] sm:text-[13px] font-medium drop-shadow-xs truncate block leading-none">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 3. Add Photo Card matching screenshot (visible only when photosList.length < MAX_PHOTOS) */}
                {photosList.length < MAX_PHOTOS ? (
                  <button
                    type="button"
                    onClick={() => handleTriggerUpload()}
                    title={t.caretakerProfile.operations.addPhoto}
                    aria-label={t.caretakerProfile.operations.addPhoto}
                    className="relative w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-[22px] border border-[#D6D3D1] hover:border-[#3B6349] bg-white hover:bg-[#F9FBF9] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#3B6349]/30"
                  >
                    <svg
                      className="w-5 h-5 text-[#3B6349] group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                    </svg>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#3B6349] leading-tight text-center px-1">
                      {t.caretakerProfile.operations.addPhoto}
                    </span>
                    <span className="text-[10px] text-[#7A6E62]">
                      ({photosList.length}/{MAX_PHOTOS})
                    </span>
                  </button>
                ) : (
                  <div
                    className="relative w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] shrink-0 rounded-[22px] border border-dashed border-[#D6D3D1] bg-[#FAF8F5]/80 flex flex-col items-center justify-center gap-1.5 p-3 text-center"
                    title={t.caretakerProfile.operations.maxPhotosReached}
                  >
                    <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[11px] font-bold text-[#4B3E2F] leading-tight">
                      5 / 5 {language === "de" ? "Fotos" : "Photos"}
                    </span>
                    <span className="text-[10px] text-[#7A6E62] leading-tight">
                      {language === "de" ? "Limit erreicht" : "Limit reached"}
                    </span>
                  </div>
                )}
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
