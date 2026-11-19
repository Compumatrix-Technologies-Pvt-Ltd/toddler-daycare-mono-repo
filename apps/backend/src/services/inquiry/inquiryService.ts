import { Inquiry, IInquiry } from "../../modules/inquiry/inquiry.js";
import { Daycare } from "../../modules/caretaker/daycare.js";
import { emailService } from "../email/emailService.js";
import { recordSearchHistory } from "../caretaker/searchHistoryService.js";

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export interface CreateInquiryInput {
  scope?: "single" | "allMap" | "favorites";
  caretakerId?: string;
  caretakerIds?: string[];
  daycareIds?: string[];
  daycareNames?: string[];
  childName: string;
  childBirthday?: string;
  desiredStart: string;
  estTransition?: string;
  careHours?: string;
  preferences?: {
    gender?: string;
    food?: string;
    pets?: string;
  };
  parentName: string;
  phone: string;
  email: string;
  note?: string;
  consentMapVisibility?: boolean;

  searchLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
    address?: string;
  };

  currentLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
  };

  searchFilters?: {
    child?: number;
    month?: string;
    year?: string;
    tolerance?: string;
    hours?: string;
    food?: string;
    pet?: string;
    gender?: string;
  };
}

export const createInquiryService = async (input: CreateInquiryInput): Promise<IInquiry> => {
  const referenceId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  let daycaresToContact: { id: string; caretakerId?: string; name: string; email: string }[] = [];

  try {
    if (input.scope === "allMap") {
      // Find all approved daycares
      const approved = await Daycare.find({ status: "approved" });
      daycaresToContact = approved.map((d: any) => ({
        id: String(d._id),
        caretakerId: d.caretakerId ? String(d.caretakerId) : undefined,
        name: d.daycareName,
        email: d.contact?.email,
      })).filter((d) => Boolean(d.email));
    } else {
      // Find by given caretakerIds or daycareIds
      const queryOr: any[] = [];
      const givenCaretakers = [
        ...(input.caretakerIds || []),
        ...(input.caretakerId ? [input.caretakerId] : []),
      ].filter((id) => id && id.length === 24);

      if (givenCaretakers.length > 0) {
        queryOr.push({ caretakerId: { $in: givenCaretakers } });
      }

      if (input.daycareIds && input.daycareIds.length > 0) {
        queryOr.push({ _id: { $in: input.daycareIds.filter((id) => id && id.length === 24) } });
      }

      if (queryOr.length > 0) {
        const matched = await Daycare.find({ $or: queryOr });
        daycaresToContact = matched.map((d: any) => ({
          id: String(d._id),
          caretakerId: d.caretakerId ? String(d.caretakerId) : undefined,
          name: d.daycareName,
          email: d.contact?.email,
        })).filter((d) => Boolean(d.email));
      }
    }
  } catch (err) {
    console.warn("[InquiryService] Could not query Daycare collection:", err);
  }

  // Fallbacks if daycares couldn't be resolved by ID or running mock
  if (daycaresToContact.length === 0) {
    const names = input.daycareNames && input.daycareNames.length > 0
      ? input.daycareNames
      : ["Kita Sunshine"];
    daycaresToContact = names.map((name, i) => ({
      id: input.daycareIds?.[i] || `mock-kita-${i + 1}`,
      caretakerId: input.caretakerIds?.[i] || input.caretakerId || `mock-caretaker-${i + 1}`,
      name,
      email: "info@kitasunshine.de",
    }));
  }

  const finalDaycareIds = daycaresToContact.map((d) => d.id);
  const finalDaycareNames = daycaresToContact.map((d) => d.name);
  const resolvedCaretakerIds = Array.from(
    new Set([
      ...daycaresToContact.map((d) => d.caretakerId).filter(Boolean),
      ...(input.caretakerIds || []),
      ...(input.caretakerId ? [input.caretakerId] : []),
    ])
  ) as string[];

  const primaryCaretakerId = resolvedCaretakerIds[0] || input.caretakerId || "";

  // Calculate distance between parent location and daycare
  const parentLat = input.currentLocation?.lat ?? input.searchLocation?.lat;
  const parentLng =
    input.currentLocation?.lng ??
    input.currentLocation?.log ??
    input.searchLocation?.lng ??
    input.searchLocation?.log;
  const parentArea =
    input.currentLocation?.area ||
    input.searchLocation?.area ||
    input.searchLocation?.address ||
    "";

  let calculatedDistKm: number | undefined;
  let formattedDist = "";
  let formattedDistDe = "";

  if (parentLat !== undefined && parentLng !== undefined && daycaresToContact.length > 0) {
    try {
      const primaryDaycare = await Daycare.findById(daycaresToContact[0]?.id);
      const dLat = primaryDaycare?.location?.latitude;
      const dLng = primaryDaycare?.location?.longitude;
      const catchmentKm = primaryDaycare?.location?.catchmentRadiusKm || 3;

      if (dLat !== undefined && dLng !== undefined && !isNaN(dLat) && !isNaN(dLng)) {
        calculatedDistKm = calculateDistanceKm(parentLat, parentLng, Number(dLat), Number(dLng));
        formattedDist = `${calculatedDistKm} km away (within ${catchmentKm}km)`;
        formattedDistDe = `${String(calculatedDistKm).replace(".", ",")} km entfernt (im ${catchmentKm}km-Radius)`;
      }
    } catch (err) {
      console.warn("[InquiryService] Could not compute distance to daycare:", err);
    }
  }

  if (!formattedDist && parentArea) {
    formattedDist = `${parentArea} (within 3km)`;
    formattedDistDe = `${parentArea} (im 3km-Radius)`;
  }

  // 1. Create and persist inquiry in database (save only fields defined in InquirySchema)
  const inquiry = new Inquiry({
    referenceId,
    status: "pending",
    scope: input.scope || "single",
    caretakerId: primaryCaretakerId,
    caretakerIds: resolvedCaretakerIds,
    daycareIds: finalDaycareIds,
    daycareNames: finalDaycareNames,
    parentName: input.parentName,
    phone: input.phone,
    email: input.email,
    note: input.note || "",
    consentMapVisibility: input.consentMapVisibility === true,
    searchLocation: input.searchLocation,
    currentLocation: input.currentLocation,
    locationDistance: formattedDist,
    locationDistanceDe: formattedDistDe,
    distanceKm: calculatedDistKm,
  });

  await inquiry.save();
  console.log(`[InquiryService] Saved inquiry ${referenceId} to MongoDB.`);

  // 1b. Record parent search history for 30-day daycare radius & admin visibility ONLY when consentMapVisibility is true!
  if (input.consentMapVisibility === true) {
    try {
      let sLat = input.searchLocation?.lat ?? input.currentLocation?.lat;
      let sLng =
        input.searchLocation?.lng ??
        input.searchLocation?.log ??
        input.currentLocation?.lng ??
        input.currentLocation?.log;
      let sArea =
        input.searchLocation?.area ||
        input.searchLocation?.address ||
        input.currentLocation?.area ||
        "";

      // If coordinates were not explicitly passed from client, derive from first contacted daycare or default to Berlin
      if ((sLat === undefined || sLng === undefined) && daycaresToContact.length > 0) {
        const primaryDaycare = await Daycare.findById(daycaresToContact[0]?.id);
        if (primaryDaycare?.location?.latitude && primaryDaycare?.location?.longitude) {
          sLat = Number(primaryDaycare.location.latitude);
          sLng = Number(primaryDaycare.location.longitude);
          sArea = `${primaryDaycare.location.city || ""}, ${primaryDaycare.location.street || ""}`.trim();
        }
      }

      if (sLat === undefined || sLng === undefined) {
        sLat = 52.52;
        sLng = 13.405;
        if (!sArea) sArea = "Berlin";
      }

      await recordSearchHistory({
        parentName: inquiry.parentName,
        email: inquiry.email,
        phone: inquiry.phone,
        note: inquiry.note,
        message: inquiry.note,
        scope: inquiry.scope || "single",
        inquiryId: inquiry._id,
        referenceId: inquiry.referenceId,
        searchLocation: {
          lat: sLat,
          lng: sLng,
          area: sArea,
          address: sArea,
        },
        currentLocation: input.currentLocation || {
          lat: sLat,
          lng: sLng,
          area: sArea,
        },
        searchFilters: input.searchFilters,
        daycareIds: finalDaycareIds,
        daycareNames: finalDaycareNames,
        caretakerIds: resolvedCaretakerIds,
      });
      console.log(`[InquiryService] Recorded search history for inquiry ${referenceId} (30-day radius visibility).`);
    } catch (err) {
      console.warn("[InquiryService] Failed to record parent search history:", err);
    }
  } else {
    console.log(`[InquiryService] Parent did not consent to 30-day map visibility. Search history was NOT stored in database.`);
  }

  // 2. Dispatch Email Notifications
  const emailPayload = {
    referenceId: inquiry.referenceId,
    childName: input.childName || input.parentName,
    childBirthday: input.childBirthday || "",
    desiredStart: input.desiredStart || "",
    estTransition: input.estTransition || "",
    careHours: input.careHours || "",
    preferences: input.preferences,
    parentName: inquiry.parentName,
    phone: inquiry.phone,
    email: inquiry.email,
    note: inquiry.note,
    consentMapVisibility: inquiry.consentMapVisibility,
  };

  // Notify each caretaker
  Promise.all(
    daycaresToContact.map((d) =>
      emailService.sendInquiryNotificationToCaretaker(d.email, d.name, emailPayload)
    )
  ).catch((err) => {
    console.error("[InquiryService] Error dispatching caretaker emails:", err);
  });

  // Notify parent & capture result/preview
  let parentEmailResult: any = null;
  try {
    parentEmailResult = await emailService.sendInquiryConfirmationToParent(
      inquiry.email,
      inquiry.parentName,
      finalDaycareNames,
      emailPayload
    );
  } catch (err: any) {
    console.error("[InquiryService] Error dispatching parent confirmation email:", err);
  }

  return {
    inquiry,
    parentEmailResult,
  } as any;
};

export const getInquiriesService = async (query: {
  status?: string;
  email?: string;
  caretakerId?: string;
  daycareId?: string;
  search?: string;
} = {}) => {
  const filter: any = {};
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }
  if (query.email) {
    filter.email = query.email.toLowerCase();
  }
  const targetCaretakerId = query.caretakerId || query.daycareId;
  if (targetCaretakerId) {
    filter.$or = [
      { caretakerId: targetCaretakerId },
      { caretakerIds: targetCaretakerId },
      { daycareIds: targetCaretakerId },
    ];
  }
  if (query.search) {
    const s = query.search.trim();
    const regex = new RegExp(s, "i");
    const searchConditions = [
      { referenceId: regex },
      { parentName: regex },
      { email: regex },
      { phone: regex },
      { daycareNames: regex },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  return await Inquiry.find(filter).sort({ createdAt: -1 });
};

export const updateInquiryStatusService = async (idOrRef: string, status: string) => {
  return await Inquiry.findOneAndUpdate(
    { $or: [{ _id: idOrRef.length === 24 ? idOrRef : null }, { referenceId: idOrRef }] },
    { status },
    { new: true }
  );
};

export const getInquiryByIdService = async (idOrRef: string) => {
  return await Inquiry.findOne({
    $or: [{ _id: idOrRef.length === 24 ? idOrRef : null }, { referenceId: idOrRef }],
  });
};

