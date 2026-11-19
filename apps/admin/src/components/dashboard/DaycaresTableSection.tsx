import { useState, useRef, useEffect, useMemo } from "react";
import {
  ClockIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface DaycaresTableSectionProps {
  applications: DaycareApplication[];
  isLoading?: boolean;
  mode?: "recent" | "full";
  initialPageSize?: number;
  onViewAll?: (() => void) | undefined;
  onRequestApprove: (application: DaycareApplication) => void;
  onRequestReject?: ((application: DaycareApplication) => void) | undefined;
  onReject: (id: string) => void;
  onOpenDetails: (application: DaycareApplication) => void;
}

export function DaycaresTableSection({
  applications,
  isLoading = false,
  mode = "full",
  initialPageSize = 10,
  onViewAll,
  onRequestApprove,
  onRequestReject,
  onReject,
  onOpenDetails,
}: DaycaresTableSectionProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 whenever active tab or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const filteredApplications = useMemo(() => {
    if (mode === "recent") {
      return applications.slice(0, 5);
    }
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesTab = activeTab === "all" || app.status === activeTab;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        app.caretakerName.toLowerCase().includes(q) ||
        app.daycareName.toLowerCase().includes(q) ||
        (Boolean(app.permitId) && app.permitId !== "—" && Boolean(app.permitId?.toLowerCase().includes(q))) ||
        app.location.toLowerCase().includes(q) ||
        app.district.toLowerCase().includes(q)
      );
    });
  }, [applications, mode, activeTab, searchQuery]);

  const totalItems = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedApplications = useMemo(() => {
    if (mode === "recent") {
      return filteredApplications;
    }
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredApplications.slice(startIndex, startIndex + pageSize);
  }, [filteredApplications, mode, validCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate pagination page numbers
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages];
  };

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
              <button
                type="button"
                onClick={() => setActiveTab("rejected")}
                className={`h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[32px] ${
                  activeTab === "rejected"
                    ? "bg-[#DC2626] text-white shadow-2xs"
                    : "text-[#DC2626] hover:bg-[#FEE2E2]/60"
                }`}
              >
                {t.admin.dashboard.table.rejected || "Abgelehnt"} ({rejectedCount})
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
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center hover:bg-[#EFE7DC]">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                    <span className="font-medium text-xs">
                      {t.admin.dashboard.table.loading || "Loading registered daycare applications..."}
                    </span>
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
                        {app.permitId?.trim() && app.permitId !== "—" ? app.permitId : "—"}
                      </span>
                      {app.expirationDate?.trim() && (
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
                          onClick={() => {
                            if (onRequestReject) {
                              onRequestReject(app);
                            } else {
                              onReject(app.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-[11px] transition-colors cursor-pointer min-h-[32px]"
                        >
                          {t.admin.dashboard.table.reject}
                        </button>
                      </div>
                    ) : app.status === "approved" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onRequestReject) {
                              onRequestReject(app);
                            } else {
                              onReject(app.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-[11px] transition-colors cursor-pointer min-h-[32px]"
                          title={t.admin.dashboard.table.revoke || "Revoke"}
                        >
                          {t.admin.dashboard.table.revoke || "Revoke"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDetails(app)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#5C4C3E] font-medium text-[11px] transition-colors cursor-pointer min-h-[32px]"
                        >
                          {t.admin.dashboard.table.viewDetails}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onRequestApprove(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs min-h-[32px]"
                          title={t.admin.dashboard.table.reApprove || "Re-Approve"}
                        >
                          {t.admin.dashboard.table.reApprove || "Re-Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDetails(app)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#5C4C3E] font-medium text-[11px] transition-colors cursor-pointer min-h-[32px]"
                        >
                          {t.admin.dashboard.table.viewDetails}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (only in "full" mode when applications exist) */}
      {mode === "full" && totalItems > 0 && (
        <div className="p-3 sm:p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Summary & Page Size Selector */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
            <span className="text-[#7A6E62] font-medium">
              {t.admin.dashboard.table.pagination.showing
                .replace("{start}", String(startIndex))
                .replace("{end}", String(endIndex))
                .replace("{total}", String(totalItems))}
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E5DDD2]">
              <span className="text-[#7A6E62] text-[11px] whitespace-nowrap">
                {t.admin.dashboard.table.pagination.perPage}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7.5 px-2 rounded-lg border border-[#E5DDD2] bg-white text-[#1E1B18] font-semibold text-xs focus:border-[#A12D3A] focus:outline-hidden cursor-pointer shadow-2xs"
                aria-label={t.admin.dashboard.table.pagination.perPage}
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 sm:px-2 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center"
                title={t.admin.dashboard.table.pagination.first}
                aria-label={t.admin.dashboard.table.pagination.first}
              >
                <ChevronsLeftIcon className="w-3.5 h-3.5" />
              </button>

              {/* Previous Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                aria-label={t.admin.dashboard.table.pagination.previous}
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.previous}</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((num, idx) => {
                  if (num === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-7 sm:w-8 h-8 flex items-center justify-center text-[#7A6E62] font-bold select-none text-xs"
                      >
                        …
                      </span>
                    );
                  }
                  const pageNum = num as number;
                  const isActive = pageNum === validCurrentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] sm:min-w-[34px] h-8 sm:h-8.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
                        isActive
                          ? "bg-[#A12D3A] text-white border border-[#A12D3A]"
                          : "bg-white text-[#5C4C3E] border border-[#E5DDD2] hover:bg-[#FAF7F2] hover:text-[#1E1B18]"
                      }`}
                      aria-label={`${t.admin.dashboard.table.pagination.page} ${pageNum}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                aria-label={t.admin.dashboard.table.pagination.next}
              >
                <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.next}</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 sm:px-2 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center"
                title={t.admin.dashboard.table.pagination.last}
                aria-label={t.admin.dashboard.table.pagination.last}
              >
                <ChevronsRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

