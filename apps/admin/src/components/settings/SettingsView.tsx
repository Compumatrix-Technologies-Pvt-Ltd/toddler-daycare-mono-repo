import { useState, useEffect, type FormEvent } from "react";
import { AdminRole, PlatformSettings } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";
import { CheckCircleIcon, ShieldCheckIcon, CloseIcon } from "../icons/AdminIcons";

interface SettingsViewProps {
  initialSettings: PlatformSettings;
  onSave: (settings: PlatformSettings) => void;
  currentUserRole?: AdminRole;
}

export function SettingsView({
  initialSettings,
  onSave,
  currentUserRole = "super-admin",
}: SettingsViewProps) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(settings);
    setToastMessage(t.admin.settings.savedToast);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Settings Header */}
      <div className="rounded-xl bg-white border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#1E1B18] tracking-tight">
              {t.admin.settings.title}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#7A6E62] mt-0.5">
              {t.admin.settings.subtitle}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto uppercase tracking-wider ${
              currentUserRole === "super-admin"
                ? "bg-[#DCFCE7] text-[#166534]"
                : "bg-[#FEF3C7] text-[#92400E]"
            }`}
          >
            {currentUserRole === "super-admin" ? "Super Admin Access" : "Standard Admin (Read-Only)"}
          </span>
        </div>
      </div>

      {currentUserRole === "admin" && (
        <div className="p-3.5 rounded-xl bg-[#FEF3C7]/80 border border-[#FDE68A] text-[#92400E] text-xs font-medium flex items-center gap-2.5">
          <ShieldCheckIcon className="w-5 h-5 text-[#D97706] shrink-0" />
          <span>
            Standard Admin Mode: Viewing system parameters in read-only audit mode. Saving changes requires Super Admin credentials.
          </span>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#15803D] hover:bg-[#DCFCE7] cursor-pointer"
            aria-label="Dismiss toast"
          >
            <CloseIcon className="w-4 h-4 text-[#15803D]" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Section 1: General & Governance */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1E1B18] uppercase tracking-wider pb-2 border-b border-[#E5DDD2]">
            {t.admin.settings.sections.general}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1B18] mb-1">
                {t.admin.settings.fields.siteName}
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] text-xs sm:text-sm text-[#1E1B18] focus:border-[#A12D3A] focus:ring-1 focus:ring-[#A12D3A]"
              />
              <p className="text-[11px] text-[#7A6E62] mt-1">
                {t.admin.settings.fields.siteNameDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B18] mb-1">
                {t.admin.settings.fields.adminEmail}
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] text-xs sm:text-sm text-[#1E1B18] focus:border-[#A12D3A] focus:ring-1 focus:ring-[#A12D3A]"
              />
              <p className="text-[11px] text-[#7A6E62] mt-1">
                {t.admin.settings.fields.adminEmailDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B18] mb-1">
                {t.admin.settings.fields.urbanCatchmentRadius}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="30"
                value={settings.urbanCatchmentRadiusKm ?? 3.0}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    urbanCatchmentRadiusKm: parseFloat(e.target.value) || 3.0,
                  })
                }
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] text-xs sm:text-sm text-[#1E1B18] focus:border-[#A12D3A] focus:ring-1 focus:ring-[#A12D3A]"
              />
              <p className="text-[11px] text-[#7A6E62] mt-1">
                {t.admin.settings.fields.urbanCatchmentRadiusDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B18] mb-1">
                {t.admin.settings.fields.ruralCatchmentRadius}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={settings.ruralCatchmentRadiusKm ?? 10.0}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ruralCatchmentRadiusKm: parseFloat(e.target.value) || 10.0,
                  })
                }
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] text-xs sm:text-sm text-[#1E1B18] focus:border-[#A12D3A] focus:ring-1 focus:ring-[#A12D3A]"
              />
              <p className="text-[11px] text-[#7A6E62] mt-1">
                {t.admin.settings.fields.ruralCatchmentRadiusDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B18] mb-1">
                {t.admin.settings.fields.sessionTimeout}
              </label>
              <input
                type="number"
                min="5"
                max="240"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60,
                  })
                }
                className="w-full h-10 px-3 rounded-xl border border-[#E5DDD2] text-xs sm:text-sm text-[#1E1B18] focus:border-[#A12D3A] focus:ring-1 focus:ring-[#A12D3A]"
              />
              <p className="text-[11px] text-[#7A6E62] mt-1">
                {t.admin.settings.fields.sessionTimeoutDesc}
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 divide-y divide-[#E5DDD2]">
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <div className="text-xs sm:text-sm font-bold text-[#1E1B18]">
                  {t.admin.settings.fields.autoValidate}
                </div>
                <div className="text-[11px] text-[#7A6E62]">
                  {t.admin.settings.fields.autoValidateDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    autoValidatePermits: !settings.autoValidatePermits,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.autoValidatePermits ? "bg-[#A12D3A]" : "bg-[#CBD5E1]"
                }`}
                role="switch"
                aria-checked={settings.autoValidatePermits}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.autoValidatePermits ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Alerts & Notifications */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-[#1E1B18] uppercase tracking-wider pb-2 border-b border-[#E5DDD2]">
            {t.admin.settings.sections.notifications}
          </h2>

          <div className="divide-y divide-[#E5DDD2]">
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <div className="text-xs sm:text-sm font-bold text-[#1E1B18]">
                  {t.admin.settings.fields.inquiryAlerts}
                </div>
                <div className="text-[11px] text-[#7A6E62]">
                  {t.admin.settings.fields.inquiryAlertsDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    emailNotificationOnInquiry: !settings.emailNotificationOnInquiry,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.emailNotificationOnInquiry ? "bg-[#A12D3A]" : "bg-[#CBD5E1]"
                }`}
                role="switch"
                aria-checked={settings.emailNotificationOnInquiry}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.emailNotificationOnInquiry ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <div className="text-xs sm:text-sm font-bold text-[#1E1B18]">
                  {t.admin.settings.fields.dailyDigest}
                </div>
                <div className="text-[11px] text-[#7A6E62]">
                  {t.admin.settings.fields.dailyDigestDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    dailyDigestEnabled: !settings.dailyDigestEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.dailyDigestEnabled ? "bg-[#A12D3A]" : "bg-[#CBD5E1]"
                }`}
                role="switch"
                aria-checked={settings.dailyDigestEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.dailyDigestEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Maintenance */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-[#1E1B18] uppercase tracking-wider pb-2 border-b border-[#E5DDD2]">
            {t.admin.settings.sections.security}
          </h2>

          <div className="flex items-center justify-between py-2">
            <div className="pr-4">
              <div className="text-xs sm:text-sm font-bold text-[#1E1B18]">
                {t.admin.settings.fields.maintenanceMode}
              </div>
              <div className="text-[11px] text-[#7A6E62]">
                {t.admin.settings.fields.maintenanceModeDesc}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  maintenanceMode: !settings.maintenanceMode,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.maintenanceMode ? "bg-[#DC2626]" : "bg-[#CBD5E1]"
              }`}
              role="switch"
              aria-checked={settings.maintenanceMode}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          {currentUserRole === "admin" ? (
            <div className="text-xs text-[#92400E] font-medium bg-[#FEF3C7] border border-[#FDE68A] px-4 py-2.5 rounded-xl">
              Super Admin authorization required to modify configuration.
            </div>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer min-h-[44px]"
            >
              {t.admin.settings.saveButton}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
