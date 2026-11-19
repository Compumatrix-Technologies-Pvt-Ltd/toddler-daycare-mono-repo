import { useState, useEffect, useMemo } from "react";
import { AdminInquiry } from "../../types/admin";
import { adminInquiryService } from "../../services/adminInquiryService";
import {
  adminSearchService,
  AdminSearchDemand,
} from "../../services/adminSearchHistoryService";
import { useLanguage } from "../../context/LanguageContext";
import { Select } from "@repo/ui";
import {
  MailIcon,
  SearchIcon,
  RefreshCwIcon,
  InboxIcon,
  CloseIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "../icons/AdminIcons";

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function InquiriesView() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"inquiries" | "demands">("inquiries");

  // Inquiries State
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);
  const [inquiriesPage, setInquiriesPage] = useState(1);
  const [inquiriesPageSize, setInquiriesPageSize] = useState(10);

  // Search Demands State
  const [searchDemands, setSearchDemands] = useState<AdminSearchDemand[]>([]);
  const [loadingDemands, setLoadingDemands] = useState(false);
  const [demandsSearchQuery, setDemandsSearchQuery] = useState("");
  const [demandsStatusFilter, setDemandsStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [demandsPage, setDemandsPage] = useState(1);
  const [demandsPageSize, setDemandsPageSize] = useState(10);
  const [demandsMeta, setDemandsMeta] = useState({
    total: 0,
    activeCount: 0,
    expiredCount: 0,
  });
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Reset pagination on search / filter changes
  useEffect(() => {
    setInquiriesPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setDemandsPage(1);
  }, [demandsSearchQuery, demandsStatusFilter]);

  const inqT = t.admin.inquiries;
  const histT = t.admin.searchHistory || {
    tabInquiries: "Direct Inquiries",
    tabSearchDemands: "Parent Search Demands (30-Day Map Visibility)",
    title: "Parent Search Demands",
    subtitle: "Search queries submitted by parents searching for childcare, visible to nearby caretakers for 30 days.",
    kpiTotal: "Total Search Demands",
    kpiActive: "Active (Within 30 Days)",
    kpiExpired: "Expired (Past 30 Days)",
    colParent: "Parent & Contact",
    colSearchArea: "Search Location & Coordinates",
    colChildTiming: "Child & Desired Start",
    colPreferences: "Preferences & Filters",
    col30DayStatus: "30-Day Lifecycle",
    statusActive: "Active",
    statusExpired: "Expired",
    daysLeft: "{days}d left",
    runCleanupButton: "Run 30-Day Cron Cleanup",
    cleanupSuccess: "Expired searches cleaned up successfully.",
    noDemandsFound: "No parent search demands found.",
    searchPlaceholder: "Search by parent, email, phone, or location...",
    filterAll: "All Demands",
    filterActive: "Active Only",
    filterExpired: "Expired Only",
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminInquiryService.getAllInquiries();
      setInquiries(data);
    } catch (err) {
      console.error("Failed to load admin inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchDemands = async () => {
    try {
      setLoadingDemands(true);
      const queryParams: { status?: "all" | "active" | "expired"; search?: string } = {
        status: demandsStatusFilter,
      };
      if (demandsSearchQuery.trim()) {
        queryParams.search = demandsSearchQuery.trim();
      }
      const res = await adminSearchService.getAllSearchDemands(queryParams);
      setSearchDemands(res.data || []);
      setDemandsMeta({
        total: res.meta?.total || 0,
        activeCount: res.meta?.activeCount || 0,
        expiredCount: res.meta?.expiredCount || 0,
      });
    } catch (err) {
      console.error("Failed to load parent search demands:", err);
    } finally {
      setLoadingDemands(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSearchDemands();
  }, []);

  useEffect(() => {
    if (activeTab === "demands") {
      loadSearchDemands();
    }
  }, [demandsStatusFilter, demandsSearchQuery, activeTab]);



  const handleRunCleanup = async () => {
    try {
      setRunningCleanup(true);
      const res = await adminSearchService.triggerCronCleanup();
      setCleanupMessage(`${res.message} (${res.expiredCount} record(s) marked expired)`);
      setTimeout(() => setCleanupMessage(null), 4000);
      await loadSearchDemands();
    } catch (err: any) {
      alert(err.message || "Failed to run 30-day cron cleanup");
    } finally {
      setRunningCleanup(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.referenceId?.toLowerCase().includes(q) ||
          item.childName?.toLowerCase().includes(q) ||
          item.parentName?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.phone?.toLowerCase().includes(q) ||
          item.daycareNames?.some((d) => d.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [inquiries, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
    };
  }, [inquiries]);

  // Direct Inquiries Pagination Calculations
  const totalInquiries = filteredInquiries.length;
  const totalInquiryPages = Math.max(1, Math.ceil(totalInquiries / inquiriesPageSize));
  const validInquiryPage = Math.min(Math.max(1, inquiriesPage), totalInquiryPages);

  const paginatedInquiries = useMemo(() => {
    const start = (validInquiryPage - 1) * inquiriesPageSize;
    return filteredInquiries.slice(start, start + inquiriesPageSize);
  }, [filteredInquiries, validInquiryPage, inquiriesPageSize]);

  const startInquiryIndex = totalInquiries === 0 ? 0 : (validInquiryPage - 1) * inquiriesPageSize + 1;
  const endInquiryIndex = Math.min(validInquiryPage * inquiriesPageSize, totalInquiries);

  // Search Demands Pagination Calculations
  const totalDemands = searchDemands.length;
  const totalDemandPages = Math.max(1, Math.ceil(totalDemands / demandsPageSize));
  const validDemandPage = Math.min(Math.max(1, demandsPage), totalDemandPages);

  const paginatedDemands = useMemo(() => {
    const start = (validDemandPage - 1) * demandsPageSize;
    return searchDemands.slice(start, start + demandsPageSize);
  }, [searchDemands, validDemandPage, demandsPageSize]);

  const startDemandIndex = totalDemands === 0 ? 0 : (validDemandPage - 1) * demandsPageSize + 1;
  const endDemandIndex = Math.min(validDemandPage * demandsPageSize, totalDemands);


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-semibold text-[#A12D3A] mb-1">
            <MailIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
            <span>{inqT.badge}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight font-heading">
            {activeTab === "inquiries" ? inqT.title : histT.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6E62]">
            {activeTab === "inquiries" ? inqT.subtitle : histT.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={activeTab === "inquiries" ? loadData : loadSearchDemands}
          disabled={loading || loadingDemands}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCwIcon className={`w-3.5 h-3.5 ${loading || loadingDemands ? "animate-spin" : ""}`} />
          <span>{inqT.refresh}</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DDD2] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] flex items-center gap-2 cursor-pointer ${activeTab === "inquiries"
            ? "bg-[#A12D3A] text-white shadow-xs"
            : "bg-white text-[#7A6E62] hover:text-[#1E1B18] border border-[#E5DDD2]"
            }`}
        >
          <MailIcon className="w-4 h-4" />
          <span>{inqT.title || "Direct Inquiries"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "inquiries" ? "bg-white/20 text-white" : "bg-[#FAF7F2] text-[#7A6E62]"
              }`}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("demands");
            loadSearchDemands();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] flex items-center gap-2 cursor-pointer ${activeTab === "demands"
            ? "bg-[#A12D3A] text-white shadow-xs"
            : "bg-white text-[#7A6E62] hover:text-[#1E1B18] border border-[#E5DDD2]"
            }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span>{histT.title || "Parent Search Demands (30-Day Visibility)"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "demands" ? "bg-white/20 text-white" : "bg-[#16A34A]/10 text-[#16A34A]"
              }`}
          >
            {demandsMeta.total}
          </span>
        </button>
      </div>

      {/* Cleanup Toast */}
      {cleanupMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: DIRECT INQUIRIES                                  */}
      {/* ======================================================== */}
      {activeTab === "inquiries" && (
        <>
          {/* KPI Stats Overview */}
          <div className="bg-white p-4 rounded-xl border border-[#E5DDD2] shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
                {inqT.kpi.total}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] mt-1 font-heading">
                {stats.total}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block">
                {inqT.kpi.totalSub}
              </span>
            </div>

          </div>

          {/* Search Toolbar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5DDD2] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8E7E] pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={inqT.searchPlaceholder}
                className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E7E] hover:text-[#1E1B18] cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#E5DDD2] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E5DDD2] text-[#7A6E62] uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">{inqT.table.colRefId}</th>
                    <th className="py-3 px-4">{inqT.table.colParent}</th>
                    <th className="py-3 px-4">{inqT.table.colContact || "Contact"}</th>
                    <th className="py-3 px-4">{inqT.table.colMessage || "Message"}</th>
                    <th className="py-3 px-4">{inqT.table.colDaycare}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#7A6E62]">
                        <div className="w-6 h-6 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>{inqT.loading}</span>
                      </td>
                    </tr>
                  ) : filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#7A6E62]">
                        <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center mx-auto text-[#A12D3A] mb-2">
                          <InboxIcon className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-[#1E1B18]">{inqT.noInquiries}</p>
                        <p className="text-xs text-[#9C8E7E] mt-0.5">{inqT.noInquiriesDesc}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInquiries.map((inq) => (
                      <tr
                        key={inq._id}
                        onClick={() => setSelectedInquiry(inq)}
                        className="hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        title="Click to view details"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#A12D3A] whitespace-nowrap">
                          <div>{inq.referenceId}</div>
                          <div className="text-[10px] text-[#9C8E7E] font-normal">
                            {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : ""}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1E1B18]">{inq.parentName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <a
                              href={`mailto:${inq.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#A12D3A] hover:underline truncate max-w-[170px] block font-medium"
                            >
                              {inq.email}
                            </a>
                          </div>
                          <div>
                            <a
                              href={`tel:${inq.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-[#5C4C3E] hover:underline font-mono"
                            >
                              {inq.phone}
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className="text-[11px] text-[#332A22] max-w-[260px] truncate leading-snug"
                            title={inq.note || ""}
                          >
                            {inq.note || <span className="text-[#9C8E7E] italic">—</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1E1B18] max-w-[180px] truncate">
                            {inq.daycareNames?.join(", ") || "Kita Sunshine"}
                          </div>
                          <div className="text-[10px] text-[#7A6E62] uppercase tracking-wider font-semibold">
                            Scope: {inq.scope}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Direct Inquiries Pagination Footer */}
            {totalInquiries > 0 && (
              <div className="p-3 sm:p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Left: Range & Per-page */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-[#7A6E62] font-medium">
                    {t.admin.dashboard.table.pagination.showing
                      .replace("{start}", String(startInquiryIndex))
                      .replace("{end}", String(endInquiryIndex))
                      .replace("{total}", String(totalInquiries))}
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-[#E5DDD2]">
                    <span className="text-[#7A6E62] text-[11px] whitespace-nowrap">
                      {t.admin.dashboard.table.pagination.perPage}
                    </span>
                    <select
                      value={inquiriesPageSize}
                      onChange={(e) => {
                        setInquiriesPageSize(Number(e.target.value));
                        setInquiriesPage(1);
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

                {/* Right: Page Buttons */}
                {totalInquiryPages > 1 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                    <button
                      type="button"
                      onClick={() => setInquiriesPage(1)}
                      disabled={validInquiryPage === 1}
                      className="p-1.5 sm:px-2 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title={t.admin.dashboard.table.pagination.first}
                      aria-label={t.admin.dashboard.table.pagination.first}
                    >
                      <ChevronsLeftIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setInquiriesPage((p) => Math.max(1, p - 1))}
                      disabled={validInquiryPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                      aria-label={t.admin.dashboard.table.pagination.previous}
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.previous}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(validInquiryPage, totalInquiryPages).map((num, idx) => {
                        if (num === "...") {
                          return (
                            <span
                              key={`ellipsis-inq-${idx}`}
                              className="w-7 sm:w-8 h-8 flex items-center justify-center text-[#7A6E62] font-bold select-none text-xs"
                            >
                              …
                            </span>
                          );
                        }
                        const pageNum = num as number;
                        const isActive = pageNum === validInquiryPage;
                        return (
                          <button
                            key={`page-inq-${pageNum}`}
                            type="button"
                            onClick={() => setInquiriesPage(pageNum)}
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

                    <button
                      type="button"
                      onClick={() => setInquiriesPage((p) => Math.min(totalInquiryPages, p + 1))}
                      disabled={validInquiryPage === totalInquiryPages}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                      aria-label={t.admin.dashboard.table.pagination.next}
                    >
                      <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.next}</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setInquiriesPage(totalInquiryPages)}
                      disabled={validInquiryPage === totalInquiryPages}
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
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PARENT SEARCH DEMANDS (30-DAY VISIBILITY)         */}
      {/* ======================================================== */}
      {activeTab === "demands" && (
        <>
          {/* KPI Stats Overview for 30-Day Demands */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
                {histT.kpiTotal || "Total Search Demands"}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] mt-1 font-heading">
                {demandsMeta.total}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
                All parent search queries registered
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>{histT.kpiActive || "Active (Within 30 Days)"}</span>
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#16A34A] mt-1 font-heading">
                {demandsMeta.activeCount}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
                Visible to nearby daycares right now
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
                {histT.kpiExpired || "Expired (Past 30 Days)"}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#7A6E62] mt-1 font-heading">
                {demandsMeta.expiredCount}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
                Expired after 30-day lifecycle
              </span>
            </div>
          </div>

          {/* Search, Filter & Cron Action Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5DDD2] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8E7E] pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={demandsSearchQuery}
                onChange={(e) => setDemandsSearchQuery(e.target.value)}
                placeholder={histT.searchPlaceholder || "Search by parent, email, phone, or location..."}
                className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] min-h-[42px] transition-colors"
              />
              {demandsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDemandsSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E7E] hover:text-[#1E1B18] cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="w-full sm:w-44 shrink-0">
                <Select
                  value={demandsStatusFilter}
                  onChange={(val) => setDemandsStatusFilter(val as any)}
                  options={[
                    { value: "all", label: histT.filterAll || "All Demands" },
                    { value: "active", label: histT.filterActive || "Active Only" },
                    { value: "expired", label: histT.filterExpired || "Expired Only" },
                  ]}
                />
              </div>

              {/* Trigger Cron Job Button */}
              <button
                type="button"
                onClick={handleRunCleanup}
                disabled={runningCleanup}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EBE1] border border-[#D5C9B8] text-xs font-bold text-[#1E1B18] min-h-[42px] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <ClockIcon className={`w-3.5 h-3.5 text-[#A12D3A] ${runningCleanup ? "animate-spin" : ""}`} />
                <span>{runningCleanup ? "Running Cron..." : histT.runCleanupButton || "Run 30-Day Cron Cleanup"}</span>
              </button>
            </div>
          </div>

          {/* Demands Table */}
          <div className="bg-white rounded-2xl border border-[#E5DDD2] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E5DDD2] text-[#7A6E62] uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">{histT.colParent || "Parent & Contact"}</th>
                    <th className="py-3 px-4">{histT.colSearchArea || "Search Location"}</th>
                    <th className="py-3 px-4">{histT.colChildTiming || "Child & Timing"}</th>
                    <th className="py-3 px-4">{histT.colPreferences || "Preferences"}</th>
                    <th className="py-3 px-4">{histT.col30DayStatus || "30-Day Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {loadingDemands ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#7A6E62]">
                        <div className="w-6 h-6 border-2 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Loading parent search demands...</span>
                      </td>
                    </tr>
                  ) : totalDemands === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#7A6E62]">
                        <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center mx-auto text-[#A12D3A] mb-2">
                          <InboxIcon className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-[#1E1B18]">{histT.noDemandsFound || "No search demands found"}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDemands.map((demand) => (
                      <tr key={demand._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1E1B18] flex items-center gap-1.5">
                            <span>{demand.parentName}</span>
                            {demand.scope && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DDD2] text-[#7A6E62] font-semibold uppercase">
                                {demand.scope}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7A6E62]">{demand.phone}</div>
                          <div className="text-[11px] text-[#7A6E62] truncate max-w-[170px]">{demand.email}</div>
                          {demand.referenceId && (
                            <div className="text-[10px] font-mono text-[#A12D3A]">{demand.referenceId}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1E1B18]">
                            {demand.searchLocation?.area || demand.searchLocation?.address || "Berlin Area"}
                          </div>
                          <div className="text-[10px] font-mono text-[#7A6E62]">
                            Lat: {Number(demand.searchLocation?.lat || 0).toFixed(4)}, Lng: {Number(demand.searchLocation?.lng ?? demand.searchLocation?.log ?? 0).toFixed(4)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1E1B18]">
                            {demand.filter?.child || 1} Child • {demand.filter?.month || "Start"} {demand.filter?.year || ""}
                          </div>
                          <div className="text-[11px] text-[#7A6E62]">{demand.filter?.hours || "Standard Hours"}</div>
                          {demand.filter?.tolerance && (
                            <div className="text-[10px] text-[#9C8E7E]">Transition: {demand.filter.tolerance}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-[11px] text-[#5C4C3E] space-y-0.5">
                            <div>• Meals: {demand.filter?.food || "Any"}</div>
                            <div>• Pets: {demand.filter?.pet || "Any"}</div>
                            <div>• Caregiver: {demand.filter?.gender || "Any"}</div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {demand.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>{demand.daysRemaining}d left</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              <span>Expired (30d)</span>
                            </span>
                          )}
                          <div className="text-[10px] text-[#9C8E7E] mt-0.5">
                            Added: {new Date(demand.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Search Demands Pagination Footer */}
            {totalDemands > 0 && (
              <div className="p-3 sm:p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Left: Range & Per-page */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-[#7A6E62] font-medium">
                    {t.admin.dashboard.table.pagination.showing
                      .replace("{start}", String(startDemandIndex))
                      .replace("{end}", String(endDemandIndex))
                      .replace("{total}", String(totalDemands))}
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-[#E5DDD2]">
                    <span className="text-[#7A6E62] text-[11px] whitespace-nowrap">
                      {t.admin.dashboard.table.pagination.perPage}
                    </span>
                    <select
                      value={demandsPageSize}
                      onChange={(e) => {
                        setDemandsPageSize(Number(e.target.value));
                        setDemandsPage(1);
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

                {/* Right: Page Buttons */}
                {totalDemandPages > 1 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                    <button
                      type="button"
                      onClick={() => setDemandsPage(1)}
                      disabled={validDemandPage === 1}
                      className="p-1.5 sm:px-2 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title={t.admin.dashboard.table.pagination.first}
                      aria-label={t.admin.dashboard.table.pagination.first}
                    >
                      <ChevronsLeftIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemandsPage((p) => Math.max(1, p - 1))}
                      disabled={validDemandPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                      aria-label={t.admin.dashboard.table.pagination.previous}
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.previous}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(validDemandPage, totalDemandPages).map((num, idx) => {
                        if (num === "...") {
                          return (
                            <span
                              key={`ellipsis-dem-${idx}`}
                              className="w-7 sm:w-8 h-8 flex items-center justify-center text-[#7A6E62] font-bold select-none text-xs"
                            >
                              …
                            </span>
                          );
                        }
                        const pageNum = num as number;
                        const isActive = pageNum === validDemandPage;
                        return (
                          <button
                            key={`page-dem-${pageNum}`}
                            type="button"
                            onClick={() => setDemandsPage(pageNum)}
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

                    <button
                      type="button"
                      onClick={() => setDemandsPage((p) => Math.min(totalDemandPages, p + 1))}
                      disabled={validDemandPage === totalDemandPages}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD2] bg-white text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs min-h-[34px] flex items-center gap-1"
                      aria-label={t.admin.dashboard.table.pagination.next}
                    >
                      <span className="hidden sm:inline">{t.admin.dashboard.table.pagination.next}</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemandsPage(totalDemandPages)}
                      disabled={validDemandPage === totalDemandPages}
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
        </>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#E5DDD2] my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5DDD2] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1B18] font-heading">
                    {inqT.title}
                  </h2>
                  <span className="font-mono text-xs font-bold text-[#A12D3A] bg-white px-2 py-0.5 rounded border border-[#E5DDD2]">
                    {selectedInquiry.referenceId}
                  </span>
                </div>
                <p className="text-xs text-[#7A6E62] mt-0.5">
                  Submitted: {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : "Recently"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm text-[#1E1B18]">
              {/* Section 1: Contact Details */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2.5">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  Kontaktdaten (Contact Details)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[#7A6E62] text-xs block">Dein Name (Parent Name):</span>
                    <strong className="text-sm text-[#1E1B18]">{selectedInquiry.parentName}</strong>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] text-xs block">Eingereicht am (Submitted):</span>
                    <strong className="text-sm text-[#1E1B18]">
                      {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : "Recently"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] text-xs block">Deine Email (Email):</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="text-[#A12D3A] hover:underline font-bold text-sm block truncate">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] text-xs block">Deine Telefonnummer (Phone):</span>
                    <a href={`tel:${selectedInquiry.phone}`} className="text-[#A12D3A] hover:underline font-bold text-sm block">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Section 2: Message */}
              <div className="p-4 rounded-xl bg-white border border-[#E5DDD2] space-y-1.5">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  Deine Nachricht (Message)
                </span>
                <p className="text-[#332A22] leading-relaxed whitespace-pre-line text-xs sm:text-[13px] bg-[#FAF7F2] p-3 rounded-lg border border-[#EFE8DC]">
                  {selectedInquiry.note || <span className="text-[#9C8E7E] italic">Keine Nachricht angegeben (No message provided)</span>}
                </p>
              </div>

              {/* Section 3: Target Daycares */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  {inqT.modal.secDaycare}
                </span>
                <div className="font-bold text-[#1E1B18]">
                  {selectedInquiry.daycareNames?.join(", ") || inqT.modal.allMapResults}
                </div>
                <div className="text-[11px] text-[#7A6E62]">
                  {inqT.modal.scope}: <strong className="capitalize">{selectedInquiry.scope}</strong>
                </div>
                {selectedInquiry.caretakerId && (
                  <div className="text-[11px] text-[#7A6E62]">
                    {inqT.modal.caretakerId}: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E5DDD2]">{selectedInquiry.caretakerId}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#F0E8DC] flex items-center justify-end gap-3 p-4 bg-[#FAF7F2]">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] cursor-pointer min-h-[38px]"
              >
                {inqT.modal.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
