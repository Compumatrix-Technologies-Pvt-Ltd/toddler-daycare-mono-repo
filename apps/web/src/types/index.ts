export interface Kita {
  id: string;
  caretakerId?: string;
  name: string;
  location: string;
  slots: number;
  rating: number;
  reviewCount: number;
  image: string;
  photos?: string[];
  tags: string[];
  favorite: boolean;
  nextDate: string;
  nextDay: string;
  hours: string;
  ageRange: string;
  distance: string;
  coordinates: {
    top: string;
    left: string;
    lat?: number;
    lng?: number;
  };
  caretaker?: string;
  caretakerDe?: string;
  address?: string;
  distanceKm?: number;
  maxChildren?: number;
  mealsType?: string;
  mealsTypeDe?: string;
  petsPolicy?: string;
  petsPolicyDe?: string;
  vacancyDate?: string;
  vacancyDateDe?: string;
  gender?: "female" | "male" | "other" | string;
  website?: string;
  phone?: string;
  openingFrom?: string;
  openingUntil?: string;
  areaType?: "urban" | "rural";
  catchmentRadiusKm?: number;
}

export interface FilterState {
  childrenCount: string; // "1" | "2" | "3"
  startMonth: string; // "0" - "11"
  startYear: string; // e.g. "2026", "2027", "2028"
  monthTolerance: number; // 0 (exact), 1 (±1 month), 2 (±2 months), 3 (±3 months)
  openingFrom: string; // e.g. "07:30"
  openingUntil: string; // e.g. "16:30"
  caretakerGender: "all" | "female" | "male";
  foodPreference: "any" | "self-cooked" | "delivered";
  pets: "any" | "allowed" | "not-allowed";
  radiusKm: number; // catchment radius in km
  areaFilter?: "all" | "urban" | "rural";
}

export type Language = "de" | "en";
