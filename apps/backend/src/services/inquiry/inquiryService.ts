import { Inquiry, IInquiry } from "../../modules/inquiry/inquiry.js";
import { Daycare } from "../../modules/caretaker/daycare.js";
import { emailService } from "../email/emailService.js";

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

  // 1. Create and persist inquiry in database
  const inquiry = new Inquiry({
    referenceId,
    scope: input.scope || "single",
    caretakerId: primaryCaretakerId,
    caretakerIds: resolvedCaretakerIds,
    daycareIds: finalDaycareIds,
    daycareNames: finalDaycareNames,
    childName: input.childName,
    childBirthday: input.childBirthday || "",
    desiredStart: input.desiredStart,
    estTransition: input.estTransition || "2-4 Weeks",
    careHours: input.careHours || "Mon – Fri • 08:00 – 15:00",
    preferences: {
      gender: input.preferences?.gender || "Female",
      food: input.preferences?.food || "Self-cooked",
      pets: input.preferences?.pets || "Pets OK",
    },
    parentName: input.parentName,
    phone: input.phone,
    email: input.email,
    note: input.note || "",
    consentMapVisibility: input.consentMapVisibility ?? true,
    status: "pending",
  });

  await inquiry.save();
  console.log(`[InquiryService] Saved inquiry ${referenceId} to MongoDB.`);

  // 2. Dispatch Email Notifications
  const emailPayload = {
    referenceId: inquiry.referenceId,
    childName: inquiry.childName,
    childBirthday: inquiry.childBirthday,
    desiredStart: inquiry.desiredStart,
    estTransition: inquiry.estTransition,
    careHours: inquiry.careHours,
    preferences: inquiry.preferences,
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
      { childName: regex },
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

