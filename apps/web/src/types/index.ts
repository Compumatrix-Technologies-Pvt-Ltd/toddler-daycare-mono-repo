export interface Kita {
  id: string;
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
}

export type Language = "de" | "en";
