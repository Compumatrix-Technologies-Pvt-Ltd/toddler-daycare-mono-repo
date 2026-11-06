"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  completionPercentage: number;
  sections: SectionCompletion;
  approvalStatus: ApprovalStatus;
  setApprovalStatus: (status: ApprovalStatus) => void;
  toggleDemoApproval: () => void;
  checkLoginRedirect: () => { shouldRedirectToProfile: boolean; reason: "incomplete" | "awaiting_approval" | "approved" };
}

export const DEFAULT_PHOTOS: CaretakerPhoto[] = [
  { id: "1", label: "Cover", src: "/assets/classroom.png" },
  { id: "2", label: "Play area", src: "/assets/playground.png" },
  { id: "3", label: "Nap room", src: "/assets/toys.png" },
  { id: "4", label: "Garden", src: "/assets/playground.png" },
];

const DEFAULT_PROFILE: CaretakerProfileData = {
  street: "Stargarder Straße 14",
  city: "10437 Berlin",
  lat: "52.5413",
  lng: "13.4135",
  isLocationPinned: true,
  daycareName: "Kita Sonnenschein",
  caregiverName: "Maria Weber",
  caregiverGender: "Female",
  visibilityWindow: "Jan 31, 2027",
  operatingHours: "07:30 – 15:30",
  maxCapacity: "5 children",
  email: "maria@kitasunshine.de",
  website: "kitasunshine-prenzlauerberg.de",
  phone: "+49 30 12345678",
  mealType: "self",
  petStatus: "none",
  photoCount: 4,
  photos: DEFAULT_PHOTOS,
  hasUploadedPermit: false, // Starts false so user can see incomplete state or upload to hit 100%
  permitFileName: "",
  approvalStatus: "pending", // Default awaiting admin approval
  isRegistered: true,
};

const CaretakerContext = createContext<CaretakerContextType | undefined>(undefined);

const STORAGE_KEY = "toddler_caretaker_profile_v1";

export function CaretakerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CaretakerProfileData>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // Fallback to default
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
