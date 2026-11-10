"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { caretakerApi } from "@/utils/caretakerApi";

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
  completionPercentage: number;
  sections: SectionCompletion;
  approvalStatus: ApprovalStatus;
  setApprovalStatus: (status: ApprovalStatus) => void;
  toggleDemoApproval: () => void;
  checkLoginRedirect: () => { shouldRedirectToProfile: boolean; reason: "incomplete" | "awaiting_approval" | "approved" };
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
  approvalStatus: "pending",
  isRegistered: false,
};

const CaretakerContext = createContext<CaretakerContextType | undefined>(undefined);

const STORAGE_KEY = "toddler_caretaker_profile_v1";

export function CaretakerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CaretakerProfileData>(EMPTY_PROFILE);

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
    const token = caretakerApi.getToken();
    if (token) {
      caretakerApi
        .getDaycare()
        .then((data) => {
          if (data) {
            const liveStatus: ApprovalStatus =
              data.status === "approved" ||
              data.status === "rejected" ||
              data.status === "pending"
                ? data.status
                : "pending";

            const hasPermit = Boolean(
              data.workPermit?.fileName || data.workPermit?.url
            );

            updateProfile({
              approvalStatus: liveStatus,
              hasUploadedPermit: hasPermit,
              permitFileName: data.workPermit?.fileName || "",
              daycareName: data.daycareName,
              caregiverName: data.caregiverName,
              caregiverGender: data.caregiverGender,
            });
          }
        })
        .catch(() => {
          // No daycare in DB yet
        });
    }
  }, []);

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

  const resetProfile = (initialData?: Partial<CaretakerProfileData>) => {
    const next: CaretakerProfileData = {
      ...EMPTY_PROFILE,
      ...initialData,
    };
    setProfile(next);
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
