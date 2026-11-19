import { useState } from "react";
import {
  CloseIcon,
  ShieldCheckIcon,
  BuildingIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  CameraIcon,
  UtensilsIcon,
  PawPrintIcon,
  ExternalLinkIcon,
} from "../icons/AdminIcons";
import { DaycareApplication, DaycareApplicationPhoto } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface ApplicationDetailModalProps {
  application: DaycareApplication | null;
  onClose: () => void;
  onApprove: (application: DaycareApplication) => void;
  onRequestReject?: ((application: DaycareApplication) => void) | undefined;
  onReject: (id: string) => void;
}

export function ApplicationDetailModal({
  application,
  onClose,
  onApprove,
  onRequestReject,
  onReject,
}: ApplicationDetailModalProps) {
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<DaycareApplicationPhoto | null>(null);

  if (!application) return null;

  const dModal = t.admin.dashboard.detailModal;
  const dTable = t.admin.dashboard.table;

  // Format caregiver gender label
  const getGenderLabel = (gender?: string) => {
    if (!gender) return dModal.genderUnspecified;
    const lower = gender.toLowerCase();
    if (lower === "female") return dModal.genderFemale;
    if (lower === "male") return dModal.genderMale;
    if (lower === "other") return dModal.genderOther;
    return gender;
  };

  // Format meals label
  const getMealsLabel = (meals?: string) => {
    if (!meals) return dModal.notSpecified;
    if (meals === "self-cooked") return dModal.mealsSelfCooked;
    if (meals === "delivered") return dModal.mealsDelivered;
    return meals;
  };

  // Format pets label
  const getPetsLabel = (pets?: string) => {
    if (!pets) return dModal.notSpecified;
    if (pets === "have-pets") return dModal.petsYes;
    if (pets === "no-pets") return dModal.petsNo;
    return pets;
  };

  // Resolve street and house number
  const streetDisplay = application.street
    ? `${application.street} ${application.houseNumber || ""}`.trim()
    : application.location || dModal.notSpecified;

  // Resolve postcode and city
  const cityDisplay =
    application.postcode || application.city
      ? `${application.postcode || ""} ${application.city || ""}`.trim()
      : application.district || dModal.notSpecified;

  const photosList = Array.isArray(application.photos) ? application.photos : [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-[#E5DDD2] my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E5DDD2] flex items-center justify-between bg-[#FAF7F2] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shadow-2xs shrink-0">
                <BuildingIcon className="w-5 h-5 text-[#A12D3A]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#1E1B18] leading-tight truncate">
                  {application.daycareName}
                </h2>
                <p className="text-xs text-[#7A6E62] truncate">
                  {dModal.title} • {application.caretakerName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm text-[#1E1B18]">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E62]">
                  {dTable.colStatus}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#1E1B18] capitalize mt-0.5 flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${application.status === "approved"
                        ? "bg-[#16A34A]"
                        : application.status === "rejected"
                          ? "bg-[#DC2626]"
                          : "bg-[#F59E0B]"
                      }`}
                  />
                  <span>{application.status}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E62]">
                  {dTable.colSubmitted}
                </div>
                <div className="text-xs font-medium text-[#5C4C3E] mt-0.5">
                  {application.submittedDate}
                </div>
              </div>
            </div>

            {/* Section 1: Caregiver & Daycare Operations */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                <UserIcon className="w-4 h-4 text-[#A12D3A]" />
                <span>{dModal.caregiverInfo}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.caregiverName}
                  </span>
                  <span className="font-bold text-[#1E1B18] break-words">
                    {application.caretakerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.caregiverGender}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-md bg-[#FAF7F2] border border-[#E5DDD2] font-semibold text-[#1E1B18]">
                    {getGenderLabel(application.caregiverGender)}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.daycareName}
                  </span>
                  <span className="font-semibold text-[#1E1B18] break-words">
                    {application.daycareName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.registeredCapacity}
                  </span>
                  <span className="font-bold text-[#1E1B18]">
                    {application.authorizedCapacity ?? application.capacity} {dTable.children}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.childAge}
                  </span>
                  <span className="font-bold text-[#1E1B18]">
                    {application.childAge || "0 – 3 years"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.operatingHours}
                  </span>
                  <span className="font-semibold text-[#1E1B18] flex items-center gap-1.5 mt-0.5">
                    <ClockIcon className="w-3.5 h-3.5 text-[#7A6E62] shrink-0" />
                    <span>{application.operatingHours || dModal.notSpecified}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.visibilityWindow}
                  </span>
                  <span className="font-semibold text-[#1E1B18] flex items-center gap-1.5 mt-0.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#7A6E62] shrink-0" />
                    <span>{application.visibilityWindow || dModal.notSpecified}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Links */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                <PhoneIcon className="w-4 h-4 text-[#A12D3A]" />
                <span>{dModal.contactInfo}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.phone}
                  </span>
                  {application.phone ? (
                    <a
                      href={`tel:${application.phone}`}
                      className="font-medium text-[#A12D3A] hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                    >
                      <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{application.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[#7A6E62]">{dModal.notSpecified}</span>
                  )}
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.email}
                  </span>
                  {application.email ? (
                    <a
                      href={`mailto:${application.email}`}
                      className="font-medium text-[#A12D3A] hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                    >
                      <MailIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{application.email}</span>
                    </a>
                  ) : (
                    <span className="text-[#7A6E62]">{dModal.notSpecified}</span>
                  )}
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.website}
                  </span>
                  {application.website ? (
                    <a
                      href={
                        application.website.startsWith("http")
                          ? application.website
                          : `https://${application.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#A12D3A] hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                    >
                      <GlobeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{application.website}</span>
                      <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#7A6E62]">{dModal.notSpecified}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Location & Catchment */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                <MapPinIcon className="w-4 h-4 text-[#A12D3A]" />
                <span>{dModal.locationAddress}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.streetAndNumber}
                  </span>
                  <span className="font-semibold text-[#1E1B18] break-words">
                    {streetDisplay}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.postcodeAndCity}
                  </span>
                  <span className="font-semibold text-[#1E1B18] break-words">
                    {cityDisplay}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-1">
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.areaClassification}
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${application.areaType === "rural"
                          ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                          : "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${application.areaType === "rural" ? "bg-[#D97706]" : "bg-[#16A34A]"
                          }`}
                      />
                      {application.areaType === "rural"
                        ? dTable.ruralBadge.replace("{radius}", String(application.catchmentRadiusKm || 10))
                        : dTable.urbanBadge.replace("{radius}", String(application.catchmentRadiusKm || 3))}
                    </span>
                    <span className="text-[11px] text-[#7A6E62]">
                      {dModal.osmSourceNotice}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Additional Details (Meals & Pets) */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                <UtensilsIcon className="w-4 h-4 text-[#A12D3A]" />
                <span>{dModal.additionalDetails}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-start gap-2.5">
                  <UtensilsIcon className="w-4 h-4 text-[#7A6E62] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">
                      {dModal.meals}
                    </span>
                    <span className="font-semibold text-[#1E1B18] mt-0.5 block">
                      {getMealsLabel(application.meals)}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-start gap-2.5">
                  <PawPrintIcon className="w-4 h-4 text-[#7A6E62] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">
                      {dModal.pets}
                    </span>
                    <span className="font-semibold text-[#1E1B18] mt-0.5 block">
                      {getPetsLabel(application.pets)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Official Work Permit (§ 43 SGB VIII) */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                  <ShieldCheckIcon className="w-4 h-4 text-[#16A34A]" />
                  <span>{dModal.permitDetails}</span>
                </div>
                {application.workPermitUrl && (
                  <a
                    href={application.workPermitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-[#EFE7DC] text-xs font-semibold text-[#A12D3A] transition-colors cursor-pointer"
                  >
                    <span>{dModal.viewPermitDoc}</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dTable.colPermit}
                  </span>
                  <span className="font-mono font-bold text-[#1E1B18] break-all">
                    {application.permitId?.trim() && application.permitId !== "—"
                      ? application.permitId
                      : "—"}
                  </span>
                </div>
                {application.registrationDate && (
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">
                      {dModal.registrationDate}
                    </span>
                    <span className="font-semibold text-[#1E1B18]">
                      {application.registrationDate}
                    </span>
                  </div>
                )}
                {application.expirationDate && (
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">
                      {dModal.expirationDate}
                    </span>
                    <span className="font-semibold text-[#16A34A]">
                      {application.expirationDate}
                    </span>
                  </div>
                )}
                {application.issuingAuthority && (
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">
                      {dModal.issuingAuthority}
                    </span>
                    <span className="font-semibold text-[#1E1B18]">
                      {application.issuingAuthority}
                    </span>
                  </div>
                )}
              </div>

              {application.adminNotes && (
                <div className="pt-2">
                  <span className="text-[#7A6E62] block text-[11px]">
                    {dModal.adminNotes}
                  </span>
                  <p className="text-[#4E443B] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E5DDD2] text-xs mt-1">
                    {application.adminNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Section 6: Caretaker Uploaded Photos */}
            <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD2] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
                  <CameraIcon className="w-4 h-4 text-[#A12D3A]" />
                  <span>{dModal.photosTitle}</span>
                </div>
                {photosList.length > 0 && (
                  <span className="text-[11px] font-semibold text-[#7A6E62] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E5DDD2]">
                    {dModal.photoCount.replace("{count}", String(photosList.length))}
                  </span>
                )}
              </div>

              {photosList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {photosList.map((photo, index) => (
                    <div
                      key={photo.id || `photo-${index}`}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-[#E5DDD2] bg-[#FAF7F2] cursor-pointer hover:border-[#A12D3A] transition-all duration-200 shadow-2xs hover:shadow-md"
                    >
                      <img
                        src={photo.url}
                        alt={photo.label || `Daycare photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                          {dModal.viewFullPhoto}
                        </span>
                      </div>
                      {photo.label && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-1.5 text-[10px] text-white font-medium truncate">
                          {photo.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#FAF7F2] border border-dashed border-[#E5DDD2] text-center space-y-1.5">
                  <CameraIcon className="w-6 h-6 text-[#7A6E62] mx-auto opacity-60" />
                  <p className="text-xs text-[#7A6E62]">
                    {dModal.noPhotos}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#5C4C3E] transition-colors cursor-pointer min-h-[38px]"
            >
              {dModal.close}
            </button>

            <div className="flex items-center gap-2">
              {application.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => {
                    if (onRequestReject) {
                      onRequestReject(application);
                    } else {
                      onReject(application.id);
                    }
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-xs transition-colors cursor-pointer min-h-[38px]"
                >
                  {application.status === "approved"
                    ? dTable.revoke || "Revoke / Reject"
                    : dTable.reject}
                </button>
              )}

              {application.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(application);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer min-h-[38px]"
                >
                  {application.status === "rejected"
                    ? dTable.reApprove || "Re-Approve"
                    : dTable.approve}
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-11 right-0 sm:right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close photo preview"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.label || "Daycare photo full view"}
              className="max-w-full max-h-[82vh] rounded-xl object-contain shadow-2xl border border-white/10"
            />
            {selectedPhoto.label && (
              <p className="text-white text-xs sm:text-sm font-semibold mt-2.5 px-3 py-1 rounded-full bg-black/60">
                {selectedPhoto.label}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
