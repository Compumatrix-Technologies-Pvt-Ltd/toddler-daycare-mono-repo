import { Types } from "mongoose";
import { ParentSearch } from "../../modules/caretaker/search.js";
import { Daycare } from "../../modules/caretaker/daycare.js";
import { Iparentsearchhistory } from "../../types/caretaker/search.js";

export interface RecordSearchHistoryInput {
  parentName?: string;
  parentname?: string;
  email: string;
  phone: string;
  message?: string;
  note?: string;
  scope?: "single" | "allMap" | "favorites" | string;
  inquiryId?: Types.ObjectId | string;
  referenceId?: string;

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

  daycareIds?: (Types.ObjectId | string)[];
  daycareNames?: string[];
  caretakerIds?: (Types.ObjectId | string)[];
}

/**
 * Calculates geographical distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 999;
  }
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
  return Number((R * c).toFixed(2));
}

/**
 * Record a parent search demand into search history when an inquiry is created or a search is submitted.
 * Sets 30-day expiration window automatically.
 */
export async function recordSearchHistory(
  input: RecordSearchHistoryInput
): Promise<Iparentsearchhistory> {
  const pName = input.parentName || input.parentname || "Anonymous Parent";
  const lat = Number(input.searchLocation?.lat ?? 52.52);
  const lng = Number(
    input.searchLocation?.lng ?? input.searchLocation?.log ?? 13.405
  );
  const area = input.searchLocation?.area || input.searchLocation?.address || "Berlin";

  const currLat = input.currentLocation?.lat !== undefined ? Number(input.currentLocation.lat) : lat;
  const currLng =
    input.currentLocation?.lng !== undefined
      ? Number(input.currentLocation.lng)
      : input.currentLocation?.log !== undefined
      ? Number(input.currentLocation.log)
      : lng;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // exactly 30 days

  const doc = new ParentSearch({
    parentname: pName,
    parentName: pName,
    email: input.email.trim(),
    phone: input.phone.trim(),
    message: input.message || input.note || "",
    scope: input.scope || "single",
    inquiryId: input.inquiryId,
    referenceId: input.referenceId,

    search: {
      location: {
        lat,
        log: lng,
        lng,
        area,
        address: input.searchLocation?.address || area,
      },
      filter: {
        child: input.searchFilters?.child || 1,
        month: input.searchFilters?.month || "",
        year: input.searchFilters?.year || "",
        tolerance: input.searchFilters?.tolerance || "",
        hours: input.searchFilters?.hours || "",
        food: input.searchFilters?.food || "",
        pet: input.searchFilters?.pet || "",
        gender: input.searchFilters?.gender || "",
      },
    },

    parentcurrentlocation: {
      lat: currLat,
      log: currLng,
      lng: currLng,
      area: input.currentLocation?.area || area,
    },

    daycareIds: input.daycareIds || [],
    daycareNames: input.daycareNames || [],
    caretakerIds: input.caretakerIds || [],

    expiresAt,
    isActive: true,
    status: "active",
  });

  const saved = await doc.save();
  console.log(
    `[SearchHistory] Recorded parent search history: ${saved._id} (Valid for 30 days until ${expiresAt.toISOString()})`
  );
  return saved;
}

/**
 * Get parent search history visible to a specific caretaker/daycare.
 * CRITICAL RULE: Visible for 30 days ONLY if search location or parent current location falls
 * within the daycare's catchment radius!
 */
export async function getNearbySearchHistoryForCaretaker(
  caretakerId: string
): Promise<{
  daycare: {
    id: string;
    name: string;
    location: any;
    radiusKm: number;
    areaType: string;
  } | null;
  totalNearby: number;
  searches: any[];
}> {
  // 1. Fetch caretaker's daycare
  const daycare = await Daycare.findOne({ caretakerId });

  if (!daycare || !daycare.location) {
    return {
      daycare: null,
      totalNearby: 0,
      searches: [],
    };
  }

  const daycareLat = Number(daycare.location.latitude);
  const daycareLng = Number(daycare.location.longitude);
  const areaType = daycare.location.areaType || "urban";
  const radiusKm = Number(
    daycare.location.catchmentRadiusKm || (areaType === "rural" ? 10 : 3)
  );

  // 2. Fetch all active search histories within 30-day window
  const now = new Date();
  const activeSearches = await ParentSearch.find({
    isActive: true,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  // 3. Filter by daycare catchment radius
  const nearbySearches: any[] = [];

  for (const item of activeSearches) {
    const sLat = Number(item.search?.location?.lat);
    const sLng = Number(
      item.search?.location?.lng ?? item.search?.location?.log
    );

    const cLat = Number(item.parentcurrentlocation?.lat ?? sLat);
    const cLng = Number(
      item.parentcurrentlocation?.lng ??
        item.parentcurrentlocation?.log ??
        sLng
    );

    // Distance to search target location
    const distSearch = calculateDistanceKm(daycareLat, daycareLng, sLat, sLng);
    // Distance to parent's current location
    const distCurrent = calculateDistanceKm(daycareLat, daycareLng, cLat, cLng);

    const minDistance = Math.min(distSearch, distCurrent);

    // Only visible if within daycare's catchment radius
    if (minDistance <= radiusKm) {
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(item.expiresAt).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      nearbySearches.push({
        _id: item._id,
        parentName: item.parentName || item.parentname,
        email: item.email,
        phone: item.phone,
        message: item.message,
        scope: item.scope,
        referenceId: item.referenceId,
        searchLocation: item.search.location,
        filter: item.search.filter,
        currentLocation: item.parentcurrentlocation,
        distanceKm: minDistance,
        daysRemaining,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
      });
    }
  }

  // Sort by closest distance first, then newest
  nearbySearches.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    daycare: {
      id: String(daycare._id),
      name: daycare.daycareName,
      location: daycare.location,
      radiusKm,
      areaType,
    },
    totalNearby: nearbySearches.length,
    searches: nearbySearches,
  };
}

/**
 * Get all search history records for admin governance
 */
export async function getAllSearchHistoryAdmin(params?: {
  status?: "all" | "active" | "expired";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: any[];
  total: number;
  activeCount: number;
  expiredCount: number;
  page: number;
  totalPages: number;
}> {
  const query: any = {};
  const statusFilter = params?.status || "all";
  const now = new Date();

  if (statusFilter === "active") {
    query.isActive = true;
    query.expiresAt = { $gt: now };
  } else if (statusFilter === "expired") {
    query.$or = [{ isActive: false }, { expiresAt: { $lte: now } }];
  }

  if (params?.search && params.search.trim()) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [
      { parentname: regex },
      { parentName: regex },
      { email: regex },
      { phone: regex },
      { "search.location.area": regex },
      { referenceId: regex },
    ];
  }

  const page = Math.max(1, Number(params?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params?.limit) || 50));
  const skip = (page - 1) * limit;

  const [searches, total, activeCount, expiredCount] = await Promise.all([
    ParentSearch.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ParentSearch.countDocuments(query),
    ParentSearch.countDocuments({ isActive: true, expiresAt: { $gt: now } }),
    ParentSearch.countDocuments({
      $or: [{ isActive: false }, { expiresAt: { $lte: now } }],
    }),
  ]);

  const mapped = searches.map((s) => {
    const isStillActive = s.isActive && new Date(s.expiresAt) > now;
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (new Date(s.expiresAt).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return {
      _id: s._id,
      parentName: s.parentName || s.parentname,
      email: s.email,
      phone: s.phone,
      message: s.message,
      scope: s.scope,
      inquiryId: s.inquiryId,
      referenceId: s.referenceId,
      searchLocation: s.search.location,
      filter: s.search.filter,
      currentLocation: s.parentcurrentlocation,
      daycareNames: s.daycareNames,
      expiresAt: s.expiresAt,
      isActive: isStillActive,
      daysRemaining: isStillActive ? daysRemaining : 0,
      status: isStillActive ? "active" : "expired",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });

  return {
    data: mapped,
    total,
    activeCount,
    expiredCount,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
