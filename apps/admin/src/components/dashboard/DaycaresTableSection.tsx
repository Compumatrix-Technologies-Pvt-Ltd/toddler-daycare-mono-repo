import { useState, useRef, useEffect } from "react";
import {
  ClockIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface DaycaresTableSectionProps {
  applications: DaycareApplication[];
  isLoading?: boolean;
  mode?: "recent" | "full";
  onViewAll?: (() => void) | undefined;
  onRequestApprove: (application: DaycareApplication) => void;
  onReject: (id: string) => void;
  onOpenDetails: (application: DaycareApplication) => void;
}

export function DaycaresTableSection({
  applications,
  isLoading = false,
  mode = "full",
  onViewAll,
  onRequestApprove,
  onReject,
  onOpenDetails,
}: DaycaresTableSectionProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "full") return;
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
  }, [mode]);

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;

  const displayedApplications =
    mode === "recent"
      ? applications.slice(0, 5)
      : applications.filter((app) => {
          const matchesTab = activeTab === "all" || app.status === activeTab;
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            app.caretakerName.toLowerCase().includes(q) ||
            app.daycareName.toLowerCase().includes(q) ||
            app.permitNumber.toLowerCase().includes(q) ||
            app.location.toLowerCase().includes(q) ||
            app.district.toLowerCase().includes(q);
          return matchesTab && matchesSearch;
        });

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-sm overflow-hidden flex flex-col">
      {/* Table Controls Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#E5DDD2] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-[#1E1B18] truncate">
            {mode === "recent"
              ? t.admin.dashboard.table.recentTitle
              : t.admin.dashboard.table.title}
          </h2>
          <p className="text-[11px] sm:text-xs text-[#7A6E62] mt-0.5 truncate">
            {mode === "recent"
              ? t.admin.dashboard.table.recentSubtitle
              : t.admin.dashboard.table.subtitle}
          </p>
        </div>

        {mode === "recent" ? (
          onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="self-start lg:self-center px-3.5 py-2 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-[#EFE7DC] text-xs font-bold text-[#A12D3A] transition-colors cursor-pointer whitespace-nowrap min-h-[36px]"
            >
              {t.admin.dashboard.table.viewAll} ({applications.length})
            </button>
          )
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5DDD2] overflow-x-auto max-w-full shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[32px] ${
                  activeTab === "all"
                    ? "bg-[#1E1B18] text-white shadow-2xs"
                    : "text-[#7A6E62] hover:text-[#1E1B18]"
                }`}
              >
                {t.admin.dashboard.table.all} ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[32px] ${
                  activeTab === "pending"
                    ? "bg-[#D97706] text-white shadow-2xs"
                    : "text-[#92400E] hover:bg-[#FEF3C7]/60"
                }`}
              >
                {t.admin.dashboard.table.pending} ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[32px] ${
                  activeTab === "approved"
                    ? "bg-[#16A34A] text-white shadow-2xs"
                    : "text-[#166534] hover:bg-[#DCFCE7]/60"
                }`}
              >
                {t.admin.dashboard.table.approved} ({approvedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 lg:w-72 xl:w-80 group shrink-0 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A775C] group-focus-within:text-[#A12D3A] transition-colors">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.admin.dashboard.table.searchPlaceholder}
                className="w-full h-10 sm:h-9 pl-10 pr-9 rounded-xl border border-[#E5DDD2] bg-white hover:border-[#D5C9BB] text-xs sm:text-[13px] text-[#1E1B18] placeholder-[#9E9080] shadow-2xs focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:outline-hidden transition-all"
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
        )}
      </div>

      {/* Table Container with smooth horizontal scrolling */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full min-w-[720px] text-left text-xs">
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#7A6E62]">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-5 h-5 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-xs">Loading registered daycare applications...</span>
                  </div>
                </td>
              </tr>
            ) : displayedApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7A6E62]">
                  {t.admin.dashboard.table.noResults}
                </td>
              </tr>
            ) : (
              displayedApplications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                  onClick={() => onOpenDetails(app)}
                >
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="font-bold text-[#1E1B18] text-xs sm:text-sm truncate">
                      {app.caretakerName}
                    </div>
                    <div className="text-[#7A6E62] text-[11px] font-medium truncate">
                      {app.daycareName}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-medium text-[#334155] whitespace-nowrap">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E5DDD2] text-[11px] font-bold text-[#1E1B18]">
                        {app.permitId || app.permitNumber}
                      </span>
                      {app.expirationDate && (
                        <span className="text-[10px] font-sans text-[#16A34A]">
                          Exp: {app.expirationDate}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[#5C4C3E] max-w-[200px]">
                    <div className="font-semibold text-[#1E1B18] truncate">{app.district}</div>
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
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === "approved"
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
                          onClick={() => onRequestApprove(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs min-h-[32px]"
                        >
                          {t.admin.dashboard.table.approve}
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(app.id)}
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
  );
}

