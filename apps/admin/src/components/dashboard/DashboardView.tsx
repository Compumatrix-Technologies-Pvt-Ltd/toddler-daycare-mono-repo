import { useState, useRef, useEffect } from "react";
import {
  BuildingIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClockIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface DashboardViewProps {
  applications: DaycareApplication[];
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onOpenDetails: (application: DaycareApplication) => void;
}

export function DashboardView({
  applications,
  onUpdateStatus,
  onOpenDetails,
}: DashboardViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;

  const filteredApplications = applications.filter((app) => {
    const matchesTab = activeTab === "all" || app.status === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.caretakerName.toLowerCase().includes(q) ||
      app.daycareName.toLowerCase().includes(q) ||
      app.permitNumber.toLowerCase().includes(q) ||
      app.district.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#1E1B18] tracking-tight">
                {t.admin.dashboard.welcome}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-bold uppercase tracking-wider shrink-0">
                {t.admin.dashboard.liveSystem}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#7A6E62] leading-snug">
              {t.admin.dashboard.welcomeSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E5DDD2] text-[11px] font-semibold text-[#5C4C3E] shadow-2xs">
              {t.admin.regionNotice}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics Cards - Rule 3 exact scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Daycares */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62]">
              {t.admin.dashboard.kpi.totalDaycares}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#5C4C3E] shrink-0">
              <BuildingIcon className="w-4 h-4 text-[#8A775C]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] my-1 sm:my-1.5">
            {applications.length + 21}
          </div>
          <div className="text-[11px] font-medium text-[#16A34A]">
            {t.admin.dashboard.kpi.totalDaycaresChange}
          </div>
        </div>

        {/* Pending Permits */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62]">
              {t.admin.dashboard.kpi.pendingPermits}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#92400E] shrink-0">
              <ClockIcon className="w-4 h-4 text-[#D97706]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#D97706] my-1 sm:my-1.5">
            {pendingCount}
          </div>
          <div className="text-[11px] font-medium text-[#92400E]">
            {t.admin.dashboard.kpi.pendingPermitsDesc}
          </div>
        </div>

        {/* Verified Caretakers */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62]">
              {t.admin.dashboard.kpi.verifiedCaretakers}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#166534] shrink-0">
              <ShieldCheckIcon className="w-4 h-4 text-[#16A34A]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#16A34A] my-1 sm:my-1.5">
            {approvedCount + 19}
          </div>
          <div className="text-[11px] font-medium text-[#16A34A]">
            {t.admin.dashboard.kpi.verifiedCaretakersDesc}
          </div>
        </div>

        {/* Demand Inquiries */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62]">
              {t.admin.dashboard.kpi.demandInquiries}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] shrink-0">
              <UsersIcon className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] my-1 sm:my-1.5">
            142
          </div>
          <div className="text-[11px] font-medium text-[#5C4C3E]">
            {t.admin.dashboard.kpi.demandInquiriesDesc}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E5DDD2] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#1E1B18] truncate">
              {t.admin.dashboard.table.title}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A6E62] mt-0.5">
              {t.admin.dashboard.table.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5DDD2]">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${activeTab === "all"
                    ? "bg-[#1E1B18] text-white shadow-2xs"
                    : "text-[#7A6E62] hover:text-[#1E1B18]"
                  }`}
              >
                {t.admin.dashboard.table.all} ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${activeTab === "pending"
                    ? "bg-[#D97706] text-white shadow-2xs"
                    : "text-[#92400E] hover:bg-[#FEF3C7]/60"
                  }`}
              >
                {t.admin.dashboard.table.pending} ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${activeTab === "approved"
                    ? "bg-[#16A34A] text-white shadow-2xs"
                    : "text-[#166534] hover:bg-[#DCFCE7]/60"
                  }`}
              >
                {t.admin.dashboard.table.approved} ({approvedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72 lg:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A775C] group-focus-within:text-[#A12D3A] transition-colors">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.admin.dashboard.table.searchPlaceholder}
                className="w-full h-10 sm:h-9.5 pl-10 pr-9 rounded-xl border border-[#E5DDD2] bg-white hover:border-[#D5C9BB] text-xs sm:text-[13px] text-[#1E1B18] placeholder-[#9E9080] shadow-2xs focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#9E9080] hover:text-[#1E1B18] transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[10px] font-bold hover:bg-[#EFE7DC]">
                    ✕
                  </span>
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center pointer-events-none">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E5DDD2] text-[10px] font-mono text-[#8A775C] shadow-2xs">
                    /
                  </kbd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#E5DDD2] text-[#7A6E62] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colCaretaker}</th>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colPermit}</th>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colDistrict}</th>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colCapacity}</th>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colSubmitted}</th>
                <th className="py-2.5 px-4 whitespace-nowrap">{t.admin.dashboard.table.colStatus}</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">{t.admin.dashboard.table.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD2]">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7A6E62]">
                    {t.admin.dashboard.table.noResults}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                    onClick={() => onOpenDetails(app)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1E1B18] text-xs sm:text-sm">
                        {app.caretakerName}
                      </div>
                      <div className="text-[#7A6E62] text-[11px] font-medium truncate max-w-[180px]">
                        {app.daycareName}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-[#334155] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E5DDD2] text-[11px]">
                        {app.permitNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#5C4C3E] max-w-[200px]">
                      <div className="font-semibold text-[#1E1B18]">{app.district}</div>
                      <div className="truncate text-[11px] text-[#7A6E62]">{app.location}</div>
                    </td>

                    <td className="py-3 px-4 text-[#1E1B18] font-semibold whitespace-nowrap">
                      {app.capacity} {t.admin.dashboard.table.children}
                    </td>

                    <td className="py-3 px-4 text-[#7A6E62] whitespace-nowrap">
                      {app.submittedDate}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${app.status === "approved"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : app.status === "pending"
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                      >
                        {app.status === "approved" ? (
                          <CheckCircleIcon className="w-3 h-3 text-[#16A34A]" />
                        ) : app.status === "pending" ? (
                          <ClockIcon className="w-3 h-3 text-[#D97706]" />
                        ) : (
                          <AlertCircleIcon className="w-3 h-3 text-[#DC2626]" />
                        )}
                        <span>
                          {app.status === "approved"
                            ? t.admin.dashboard.table.statusApproved
                            : app.status === "pending"
                              ? t.admin.dashboard.table.statusPending
                              : t.admin.dashboard.table.statusRejected}
                        </span>
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {app.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(app.id, "approved")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs min-h-[32px]"
                          >
                            {t.admin.dashboard.table.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(app.id, "rejected")}
                            className="px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-[11px] transition-colors cursor-pointer min-h-[32px]"
                          >
                            {t.admin.dashboard.table.reject}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenDetails(app)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#5C4C3E] font-medium text-[11px] transition-colors cursor-pointer min-h-[32px]"
                        >
                          {t.admin.dashboard.table.viewDetails}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
