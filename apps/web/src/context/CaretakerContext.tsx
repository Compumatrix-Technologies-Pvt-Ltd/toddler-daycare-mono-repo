"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { caretakerApi } from "@/utils/caretakerApi";
import { getSocket } from "@/utils/socket";
import { formatPostcodeCity, formatStreetDisplay } from "../components/map/mapUtils";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface CaretakerPhoto {
  id: string;
  label: string;
  src: string;
}

export interface CaretakerProfileData {
  street: string;
  city: string;
  lat: string;
  lng: string;
  isLocationPinned: boolean;
  daycareName: string;
  caregiverName: string;
  caregiverGender: string;
  visibilityWindow: string;
  operatingHours: string;
  maxCapacity: string;
  email: string;
  website: string;
  phone: string;
  mealType: "self" | "delivered" | "";
  petStatus: "none" | "pets" | "";
  photoCount: number;
  photos?: CaretakerPhoto[];
  hasUploadedPermit: boolean;
  permitFileName?: string;
  workPermitUrl?: string;
  permitId?: string;
  permitRegistrationDate?: string;
  permitExpirationDate?: string;
  permitIssuingAuthority?: string;
  permitAuthorizedCapacity?: number;
  permitAdminNotes?: string;
  permitApprovedAt?: string;
  approvalStatus: ApprovalStatus;
  isRegistered: boolean;
}

export interface SectionCompletion {
  location: boolean;
  operations: boolean;
  contactPhotos: boolean;
  permit: boolean;
}

interface CaretakerContextType {
  profile: CaretakerProfileData;
  updateProfile: (updates: Partial<CaretakerProfileData>) => void;
  resetProfile: (initialData?: Partial<CaretakerProfileData>) => void;
  syncFromBackendDaycare: (data: any, options?: { preservePinState?: boolean }) => void;
  refreshDaycare: () => Promise<void>;
  isBackendProfileComplete: boolean;
  isUnderAdminReview: boolean;
  completionPercentage: number;
  sections: SectionCompletion;
  approvalStatus: ApprovalStatus;
  setApprovalStatus: (status: ApprovalStatus) => void;
  toggleDemoApproval: () => void;
  checkLoginRedirect: () => { shouldRedirectToProfile: boolean; reason: "incomplete" | "awaiting_approval" | "approved" };
}

function resolveAssetUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  const clean = String(rawUrl).trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const origin = new URL(apiUrl).origin;
    return `${origin}${clean.startsWith("/") ? "" : "/"}${clean}`;
  } catch {
    return `http://localhost:5000${clean.startsWith("/") ? "" : "/"}${clean}`;
  }
}

export function isDaycareRecordComplete(data: any): boolean {
  if (!data) return false;
  const hasLocation = Boolean(
    data.location?.street?.trim() &&
    data.location?.city?.trim() &&
    data.location?.latitude !== undefined &&
    data.location?.longitude !== undefined
  );
  const hasOperations = Boolean(
    data.daycareName?.trim() &&
    data.caregiverName?.trim() &&
    data.caregiverGender?.trim() &&
    data.operations?.operatingHours?.trim()
  );
  const hasContactPhotos = Boolean(
    data.contact?.email?.trim() &&
    data.contact?.phone?.trim() &&
    data.additionalDetails?.meals &&
    data.additionalDetails?.pets &&
    Array.isArray(data.photos) &&
    data.photos.length >= 1
  );
  const hasPermit = Boolean(
    data.workPermit?.url?.trim() || data.workPermit?.fileName?.trim()
  );
  return hasLocation && hasOperations && hasContactPhotos && hasPermit;
}

export const DEFAULT_PHOTOS: CaretakerPhoto[] = [];

export const EMPTY_PROFILE: CaretakerProfileData = {
  street: "",
  city: "",
  lat: "",
  lng: "",
  isLocationPinned: false,
  daycareName: "",
  caregiverName: "",
  caregiverGender: "",
  visibilityWindow: "",
  operatingHours: "",
  maxCapacity: "",
  email: "",
  website: "",
  phone: "",
  mealType: "",
  petStatus: "",
  photoCount: 0,
  photos: [],
  hasUploadedPermit: false,
  permitFileName: "",
  workPermitUrl: "",
  permitId: "",
  permitRegistrationDate: "",
  permitExpirationDate: "",
  permitIssuingAuthority: "",
  permitAuthorizedCapacity: undefined,
  permitAdminNotes: "",
  permitApprovedAt: "",
  approvalStatus: "pending",
  isRegistered: false,
};

const CaretakerContext = createContext<CaretakerContextType | undefined>(undefined);

const STORAGE_KEY = "toddler_caretaker_profile_v1";

export function CaretakerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CaretakerProfileData>(EMPTY_PROFILE);
  const [isBackendProfileComplete, setIsBackendProfileComplete] = useState(false);

  const updateProfile = (updates: Partial<CaretakerProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full or unavailable
      }
      return next;
    });
  };

  const syncFromBackendDaycare = (data: any, options?: { preservePinState?: boolean }) => {
    if (!data) {
      setIsBackendProfileComplete(false);
      return;
    }

    const liveStatus: ApprovalStatus =
      data.status === "approved" ||
      data.status === "rejected" ||
      data.status === "pending"
        ? data.status
        : "pending";

    const hasPermit = Boolean(
      data.workPermit?.fileName || data.workPermit?.url
    );

    const loc = data.location;
    const hasBackendLoc = Boolean(
      loc?.latitude !== undefined &&
      loc?.longitude !== undefined &&
      loc?.street &&
      loc?.city
    );
    const loadedStreet = loc?.street
      ? formatStreetDisplay(loc.street, loc.houseNumber)
      : undefined;
    const loadedCity = loc?.city
      ? formatPostcodeCity(loc.postcode, loc.city)
      : undefined;

    const mappedPhotos: CaretakerPhoto[] | undefined = Array.isArray(data.photos)
      ? data.photos.map((p: any, idx: number) => ({
          id: p._id || `photo-${idx}`,
          label: `Photo ${idx + 1}`,
          src: resolveAssetUrl(p.url),
        }))
      : undefined;

    const rawGender = String(data.caregiverGender || "").toLowerCase();
    const mappedGender =
      rawGender === "female"
        ? "Female"
        : rawGender === "male"
          ? "Male"
          : rawGender === "other" || rawGender === "diverse"
            ? "Diverse"
            : data.caregiverGender;

    setProfile((prev) => {
      const next: CaretakerProfileData = {
        ...prev,
        approvalStatus: liveStatus,
        hasUploadedPermit: hasPermit,
        permitFileName: data.workPermit?.fileName || "",
        workPermitUrl: data.workPermit?.url || "",
        permitId: data.workPermit?.permitId || "",
        permitRegistrationDate: data.workPermit?.registrationDate || "",
        permitExpirationDate: data.workPermit?.expirationDate || "",
        permitIssuingAuthority: data.workPermit?.issuingAuthority || "",
        permitAuthorizedCapacity: data.workPermit?.authorizedCapacity,
        permitAdminNotes: data.workPermit?.adminNotes || "",
        permitApprovedAt: data.workPermit?.approvedAt || "",
        maxCapacity: data.workPermit?.authorizedCapacity
          ? String(data.workPermit.authorizedCapacity)
          : data.operations?.maxCapacity
            ? String(data.operations.maxCapacity)
            : prev.maxCapacity,
        daycareName: data.daycareName ?? prev.daycareName,
        caregiverName: data.caregiverName ?? prev.caregiverName,
        caregiverGender: mappedGender ?? prev.caregiverGender,
        visibilityWindow: data.operations?.visibilityWindow ?? prev.visibilityWindow,
        operatingHours: data.operations?.operatingHours ?? prev.operatingHours,
        email: data.contact?.email ?? prev.email,
        website: data.contact?.website ?? prev.website,
        phone: data.contact?.phone ?? prev.phone,
        mealType:
          data.additionalDetails?.meals === "self-cooked"
            ? "self"
            : data.additionalDetails?.meals === "delivered"
              ? "delivered"
              : prev.mealType,
        petStatus:
          data.additionalDetails?.pets === "have-pets"
            ? "pets"
            : data.additionalDetails?.pets === "no-pets"
              ? "none"
              : prev.petStatus,
        ...(mappedPhotos
          ? { photos: mappedPhotos, photoCount: mappedPhotos.length }
          : {}),
        ...(hasBackendLoc && !options?.preservePinState
          ? {
              street: loadedStreet || prev.street,
              city: loadedCity || prev.city,
              lat: String(loc.latitude),
              lng: String(loc.longitude),
              isLocationPinned: true,
            }
          : {}),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full or unavailable
      }
      return next;
    });

    setIsBackendProfileComplete(isDaycareRecordComplete(data));
  };

  const refreshDaycare = async () => {
    const token = caretakerApi.getToken();
    if (!token) {
      setIsBackendProfileComplete(false);
      return;
    }

    try {
      const data = await caretakerApi.getDaycare();
      syncFromBackendDaycare(data);
    } catch {
      setIsBackendProfileComplete(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock data from earlier sessions
        if (
          parsed.caregiverName === "Maria Weber" ||
          parsed.daycareName === "Kita Sonnenschein" ||
          parsed.street === "Stargarder Straße 14"
        ) {
          localStorage.removeItem(STORAGE_KEY);
          setProfile(EMPTY_PROFILE);
        } else {
          setProfile(parsed);
        }
      }
    } catch {
      // Fallback to empty
    }

    // Sync live approval status & verification from MongoDB backend
    refreshDaycare();

    const token = caretakerApi.getToken();
    const socket = getSocket();
    if (!token || !socket) return;

    const caretakerId = caretakerApi.getCaretakerId();
    if (caretakerId) {
      socket.emit("join:caretaker", caretakerId);
    }

    const handleDaycareChange = (payload?: { caretakerId?: string }) => {
      if (!caretakerId || !payload?.caretakerId || payload.caretakerId === caretakerId) {
        refreshDaycare();
      }
    };

    socket.on("daycare:status_changed", handleDaycareChange);
    socket.on("daycare:updated", handleDaycareChange);

    return () => {
      socket.off("daycare:status_changed", handleDaycareChange);
      socket.off("daycare:updated", handleDaycareChange);
    };
  }, []);

  const resetProfile = (initialData?: Partial<CaretakerProfileData>) => {
    const next: CaretakerProfileData = {
      ...EMPTY_PROFILE,
      ...initialData,
    };
    setProfile(next);
    setIsBackendProfileComplete(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable
    }
  };

  const setApprovalStatus = (status: ApprovalStatus) => {
    updateProfile({ approvalStatus: status });
  };

  const toggleDemoApproval = () => {
    const nextStatus = profile.approvalStatus === "approved" ? "pending" : "approved";
    setApprovalStatus(nextStatus);
  };

  // Calculate section completions
  const locationComplete = Boolean(
    profile.street.trim() && profile.city.trim() && profile.isLocationPinned
  );

  const operationsComplete = Boolean(
    profile.daycareName.trim() &&
    profile.caregiverName.trim() &&
    profile.caregiverGender.trim() &&
    profile.operatingHours.trim()
  );

  const contactPhotosComplete = Boolean(
    profile.email.trim() &&
    profile.phone.trim() &&
    profile.mealType &&
    profile.petStatus &&
    profile.photoCount >= 1
  );

  const permitComplete = Boolean(profile.hasUploadedPermit || profile.approvalStatus === "approved");

  const sections: SectionCompletion = {
    location: locationComplete,
    operations: operationsComplete,
    contactPhotos: contactPhotosComplete,
    permit: permitComplete,
  };

  // Calculate 0 - 100%
  let score = 0;
  if (locationComplete) score += 25;
  if (operationsComplete) score += 25;
  if (contactPhotosComplete) score += 25;
  if (permitComplete) score += 25;

  const completionPercentage = score;

  const isUnderAdminReview = Boolean(
    isBackendProfileComplete &&
    completionPercentage === 100 &&
    profile.approvalStatus === "pending"
  );

  const checkLoginRedirect = () => {
    if (completionPercentage < 100) {
      return { shouldRedirectToProfile: true, reason: "incomplete" as const };
    }
    if (profile.approvalStatus !== "approved") {
      return { shouldRedirectToProfile: true, reason: "awaiting_approval" as const };
    }
    return { shouldRedirectToProfile: false, reason: "approved" as const };
  };

  return (
    <CaretakerContext.Provider
      value={{
        profile,
        updateProfile,
        resetProfile,
        syncFromBackendDaycare,
        refreshDaycare,
        isBackendProfileComplete,
        isUnderAdminReview,
        completionPercentage,
        sections,
        approvalStatus: profile.approvalStatus,
        setApprovalStatus,
        toggleDemoApproval,
        checkLoginRedirect,
      }}
    >
      {children}
    </CaretakerContext.Provider>
  );
}

export function useCaretaker() {
  const context = useContext(CaretakerContext);
  if (!context) {
    throw new Error("useCaretaker must be used within a CaretakerProvider");
  }
  return context;
}
