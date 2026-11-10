"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../i18n/LanguageContext";
import { submitInquiry } from "../../utils/inquery";

export type EnquiryScope = "single" | "allMap" | "favorites";

interface EnquiryModalProps {
  onClose: () => void;
  activeKitaName?: string;
  activeKitaId?: string;
  activeCaretakerId?: string;
  caretakerIds?: string[];
  initialScope?: EnquiryScope;
  totalMapCount?: number;
  favoritesCount?: number;
  daycareIds?: string[];
  daycareNames?: string[];
}

export function EnquiryModal({
  onClose,
  activeKitaName = "Kita Sunshine",
  activeKitaId,
  activeCaretakerId,
  caretakerIds = [],
  initialScope = "single",
  totalMapCount = 22,
  favoritesCount = 2,
  daycareIds = [],
  daycareNames = [],
}: EnquiryModalProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Scope selection
  const [scope, setScope] = useState<EnquiryScope>(initialScope);

  // 1. Child Information
  const [childName, setChildName] = useState("");
  const [childBirthday, setChildBirthday] = useState("");

  // 2. Timing & Transition
  const [desiredStart, setDesiredStart] = useState("August 2026");
  const [estTransition, setEstTransition] = useState("2-4 Weeks");

  // 3. Care Hours (default "Mon – Fri • 08:00 – 15:00")
  const [careHours, setCareHours] = useState(
    t.modals.enquiryForm.careHoursDefault || "Mon – Fri • 08:00 – 15:00"
  );

  // 4. Preferences (Gender, Meals, Pets)
  const [prefGender, setPrefGender] = useState<"Female" | "Male" | "Any">("Female");
  const [prefFood, setPrefFood] = useState<"Self-cooked" | "Delivered" | "Any">("Self-cooked");
  const [prefPets, setPrefPets] = useState<"Pets OK" | "No Pets" | "Any">("Pets OK");

  // 5. Parent Contact Information
  const [parentName, setParentName] = useState("Maximilian Schmidt");
  const [phone, setPhone] = useState("+49 170 1234567");
  const [email, setEmail] = useState("max@example.com");
  const [note, setNote] = useState(t.modals.enquiryForm.messageDefault);

  // Consent & Learn More
  const [consent, setConsent] = useState(true);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Compute contacted names & IDs
    const finalDaycareIds =
      scope === "single"
        ? activeKitaId ? [activeKitaId] : []
        : daycareIds;

    const finalCaretakerIds =
      scope === "single"
        ? activeCaretakerId ? [activeCaretakerId] : []
        : caretakerIds;

    const finalDaycareNames =
      scope === "single"
        ? [activeKitaName]
        : daycareNames.length > 0
          ? daycareNames
          : [activeKitaName];

    const preferencesSummary = `${prefGender} • ${prefFood} • ${prefPets}`;

    try {
      const res = await submitInquiry({
        scope,
        caretakerId: activeCaretakerId,
        caretakerIds: finalCaretakerIds,
        daycareIds: finalDaycareIds,
        daycareNames: finalDaycareNames,
        childName: childName.trim(),
        childBirthday: childBirthday.trim(),
        desiredStart: desiredStart.trim(),
        estTransition,
        careHours,
        preferences: {
          gender: prefGender,
          food: prefFood,
          pets: prefPets,
        },
        parentName: parentName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
        consentMapVisibility: consent,
      });

      const referenceId = res.meta?.referenceId || `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const contactedParam =
        scope === "single"
          ? activeKitaName
          : scope === "allMap"
          ? `${activeKitaName} & ${Math.max(0, totalMapCount - 1)} Others`
          : `${favoritesCount} Saved Daycares`;

      onClose();

      router.push(
        `/confirm-enquiry?ref=${encodeURIComponent(referenceId)}&contacted=${encodeURIComponent(
          contactedParam
        )}&child=${encodeURIComponent(childName || "1 Child")}`
      );
    } catch (err: any) {
      console.error("[EnquiryModal] Submission error:", err);
      setErrorMessage(err.message || "Failed to submit inquiry. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#E5DDD2] w-full max-w-[820px] p-5 sm:p-8 relative my-auto max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-[#F3ECE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#6B5E51] hover:text-[#1E1B18] transition-colors cursor-pointer"
          aria-label={t.modals.enquiryForm.close}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6 pr-8 sm:pr-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-semibold text-[#A12D3A] mb-1">
            <span>✉️</span>
            <span>{t.modals.enquiryForm.titleSingle || "Web Daycare Inquiry"}</span>
          </div>
          <h2
            id="enquiry-modal-title"
            className="font-bold text-xl sm:text-2xl text-[#1E1B18] tracking-tight font-heading"
          >
            {scope === "single"
              ? (t.modals.enquiryForm as any).titleSingle || t.modals.enquiryForm.title
              : (t.modals.enquiryForm as any).titleBulk || t.modals.enquiryForm.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E62] leading-relaxed max-w-lg mx-auto">
            {t.modals.enquiryForm.subtitle}
          </p>
        </div>

        {/* Scope Selector Pills */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-2.5 mb-6">
          {/* Option 1: To This Provider Only */}
          <button
            type="button"
            onClick={() => setScope("single")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "single"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.single}</span>
            {activeKitaName && (
              <span className="opacity-80 font-normal">({activeKitaName})</span>
            )}
          </button>

          {/* Option 2: To All Map Results */}
          <button
            type="button"
            onClick={() => setScope("allMap")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "allMap"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.allMap}</span>
            <span className="opacity-80 font-normal">({totalMapCount})</span>
          </button>

          {/* Option 3: To All My Favourites */}
          <button
            type="button"
            onClick={() => setScope("favorites")}
            className={`py-2 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
              scope === "favorites"
                ? "bg-[#A12D3A]/10 border-2 border-[#A12D3A] text-[#A12D3A] font-bold shadow-2xs"
                : "bg-[#FAF7F2] border border-[#E5DDD2] text-[#6B5E51] hover:text-[#1E1B18] font-medium"
            }`}
          >
            <span>{t.modals.enquiryForm.tabs.favorites}</span>
            <span className="opacity-80 font-normal">({favoritesCount})</span>
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Comprehensive Inquiry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* SECTION 1: CHILD DETAILS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#7A6E62] tracking-wider">
              <span>👶</span>
              <span>1. {t.modals.enquiryForm.childNameLabel} & {t.modals.enquiryForm.childBirthdayLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Child Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.childNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder={t.modals.enquiryForm.childNamePlaceholder || "e.g. Lukas Schmidt"}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>

              {/* Child Birthday */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.childBirthdayLabel}
                </label>
                <input
                  type="date"
                  value={childBirthday}
                  onChange={(e) => setChildBirthday(e.target.value)}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TIMING & SCHEDULE */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#7A6E62] tracking-wider">
              <span>📅</span>
              <span>2. {t.modals.enquiryForm.desiredStartLabel} & {t.modals.enquiryForm.careHoursLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Desired Start */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.desiredStartLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={desiredStart}
                  onChange={(e) => setDesiredStart(e.target.value)}
                  placeholder={t.modals.enquiryForm.desiredStartPlaceholder || "e.g. August 2026"}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>

              {/* Estimated Transition */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.estTransitionLabel}
                </label>
                <select
                  value={estTransition}
                  onChange={(e) => setEstTransition(e.target.value)}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                >
                  <option value="1-2 Weeks">{t.modals.enquiryForm.estTransitionOptions.twoWeeks}</option>
                  <option value="2-4 Weeks">{t.modals.enquiryForm.estTransitionOptions.fourWeeks}</option>
                  <option value="4-6 Weeks">{t.modals.enquiryForm.estTransitionOptions.sixWeeks}</option>
                </select>
              </div>

              {/* Care Hours */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.careHoursLabel}
                </label>
                <input
                  type="text"
                  required
                  value={careHours}
                  onChange={(e) => setCareHours(e.target.value)}
                  placeholder="Mon – Fri • 08:00 – 15:00"
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PREFERENCES */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#7A6E62] tracking-wider">
                <span>✨</span>
                <span>3. {t.modals.enquiryForm.preferencesLabel}</span>
              </div>
              <span className="text-[11px] text-[#A12D3A] font-semibold">
                {prefGender} • {prefFood} • {prefPets}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Caretaker Gender Preference */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5044] mb-1">
                  Caretaker Gender
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["Female", "Male", "Any"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPrefGender(g)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer truncate ${
                        prefGender === g
                          ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                          : "bg-white text-[#4E443B] border-[#D5C9B8] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Preference */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5044] mb-1">
                  Meals Preference
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["Self-cooked", "Delivered", "Any"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPrefFood(f)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer truncate ${
                        prefFood === f
                          ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                          : "bg-white text-[#4E443B] border-[#D5C9B8] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {f === "Self-cooked" ? "Cooked" : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pets Preference */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5044] mb-1">
                  Pets Policy
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["Pets OK", "No Pets", "Any"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrefPets(p)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer truncate ${
                        prefPets === p
                          ? "bg-[#A12D3A] text-white border-[#A12D3A] shadow-2xs"
                          : "bg-white text-[#4E443B] border-[#D5C9B8] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: PARENT CONTACT INFORMATION */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5DDD2] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#7A6E62] tracking-wider">
              <span>👤</span>
              <span>4. {t.modals.enquiryForm.parentNameLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Parent Contact Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.parentNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={t.modals.enquiryForm.parentNamePlaceholder}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.phoneLabel} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.modals.enquiryForm.phonePlaceholder || "+49 170 1234567"}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#4E443B]">
                  {t.modals.enquiryForm.emailLabel} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.modals.enquiryForm.emailPlaceholder}
                  className="w-full bg-white border border-[#D5C9B8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-semibold text-[#4E443B]">
                {t.modals.enquiryForm.noteLabel}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.modals.enquiryForm.notePlaceholder || "Additional notes..."}
                className="w-full bg-white border border-[#D5C9B8] rounded-xl p-3 text-xs sm:text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] resize-none leading-relaxed min-h-[85px] transition-colors"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-0.5 space-y-2">
            <div className="flex items-start gap-3 select-none">
              <label className="flex items-center cursor-pointer mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    consent
                      ? "bg-[#A12D3A] text-white shadow-2xs"
                      : "border border-[#D5C9B8] bg-white hover:border-[#A12D3A]"
                  }`}
                >
                  {consent && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>

              <div className="text-xs sm:text-sm text-[#4E443B] leading-relaxed">
                <span>{t.modals.enquiryForm.consentLabel}</span>{" "}
                <button
                  type="button"
                  onClick={() => setShowLearnMore(!showLearnMore)}
                  className="text-[#A12D3A] hover:underline font-semibold cursor-pointer transition-colors inline-flex items-center gap-0.5"
                >
                  <span>{t.modals.enquiryForm.learnMoreLink}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showLearnMore ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expandable Learn More Box */}
            {showLearnMore && (
              <div className="ml-8 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs sm:text-[13px] text-[#5C5044] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[#A12D3A] shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p>{t.modals.enquiryForm.learnMoreComment}</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A12D3A] hover:bg-[#88222E] disabled:opacity-70 text-white font-semibold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-all shadow-xs shadow-[#A12D3A]/20 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.modals.enquiryForm.sending || "Sending..."}</span>
                </>
              ) : (
                <>
                  <span>✉️</span>
                  <span>{t.modals.enquiryForm.submitButton}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
