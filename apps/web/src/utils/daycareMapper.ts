import { Kita } from "../types";

export function mapDaycareToKita(doc: any): Kita {
  const resolvePhotoUrl = (url?: string): string => {
    if (!url) return "";
    const cleanUrl = String(url).trim();
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) return cleanUrl;

    let serverOrigin = "http://localhost:5000";
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      serverOrigin = new URL(apiUrl).origin;
    } catch {
      serverOrigin = "http://localhost:5000";
    }

    return `${serverOrigin}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
  };

  const photoList: string[] = Array.isArray(doc.photos)
    ? doc.photos
        .map((p: any) => resolvePhotoUrl(typeof p === "string" ? p : p?.url))
        .filter(Boolean)
    : [];

  const mainImage = photoList.length > 0 ? photoList[0] : "";

  // Show tags exactly as they are from the data without forced translation
  const tags: string[] = [
    doc.additionalDetails?.meals,
    doc.additionalDetails?.pets,
  ].filter(Boolean) as string[];

  const locationParts = [doc.location?.city, doc.location?.street].filter(Boolean);
  const locationStr = locationParts.join(", ");

  const addressParts = [
    doc.location?.street,
    doc.location?.houseNumber,
    doc.location?.postcode,
    doc.location?.city,
  ].filter(Boolean);
  const addressStr = addressParts.join(" ");

  const slots = Number(doc.operations?.maxCapacity) || 0;
  const rating =
    doc.ratings && Array.isArray(doc.ratings) && doc.ratings.length > 0
      ? Number(
          (
            doc.ratings.reduce((acc: number, r: any) => acc + (r.score || 0), 0) /
            doc.ratings.length
          ).toFixed(1)
        )
      : 0;

  const lat =
    doc.location?.latitude != null && !isNaN(Number(doc.location.latitude))
      ? Number(doc.location.latitude)
      : undefined;
  const lng =
    doc.location?.longitude != null && !isNaN(Number(doc.location.longitude))
      ? Number(doc.location.longitude)
      : undefined;

  const rawMeals = doc.additionalDetails?.meals || "";
  const rawPets = doc.additionalDetails?.pets || "";
  const rawWindow = doc.operations?.visibilityWindow || "";
  const rawOperatingHours = doc.operations?.operatingHours || "";
  const caregiver = doc.caregiverName || "";
  const daycareName = doc.daycareName || "";
  const gender = doc.caregiverGender || "female";

  let openingFrom = "";
  let openingUntil = "";
  if (rawOperatingHours.includes("–") || rawOperatingHours.includes("-")) {
    const parts = rawOperatingHours.split(/[–-]/).map((s: string) => s.trim());
    if (parts[0]) openingFrom = parts[0];
    if (parts[1]) openingUntil = parts[1];
  }

  return {
    id: String(doc._id || ""),
    caretakerId: String(doc.caretakerId?._id || doc.caretakerId || ""),
    name: daycareName,
    location: locationStr,
    slots,
    rating,
    reviewCount: doc.ratings?.length || 0,
    image: mainImage,
    photos: photoList,
    tags,
    favorite: false,
    nextDate: rawWindow,
    nextDay: "",
    hours: rawOperatingHours,
    ageRange: "",
    distance: "",
    coordinates: {
      top: "50%",
      left: "50%",
      lat,
      lng,
    },
    caretaker: caregiver,
    caretakerDe: caregiver,
    address: addressStr,
    distanceKm: undefined,
    maxChildren: slots,
    mealsType: rawMeals,
    mealsTypeDe: rawMeals,
    petsPolicy: rawPets,
    petsPolicyDe: rawPets,
    vacancyDate: rawWindow,
    vacancyDateDe: rawWindow,
    gender,
    website: doc.contact?.website ? String(doc.contact.website).trim() : "",
    phone: doc.contact?.phone ? String(doc.contact.phone).trim() : "",
    openingFrom,
    openingUntil,
  };
}
