"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { Footer } from "../../../components/Footer";
import { useLanguage } from "../../../i18n/LanguageContext";
import { fetchInquiries, updateInquiryStatus } from "../../../utils/inquery";
import { caretakerApi } from "../../../utils/caretakerApi";
import { getSocket } from "../../../utils/socket";
import {
  MailIcon,
  RefreshCwIcon,
  InboxIcon,
  BabyIcon,
  PhoneIcon,
  CloseIcon,
} from "../../../components/icons/WebIcons";

interface InquiryRecord {
  _id: string;
  referenceId: string;
  scope: string;
  caretakerId?: string;
  caretakerIds?: string[];
  daycareNames: string[];
  childName: string;
  childBirthday?: string;
  desiredStart: string;
  estTransition?: string;
  careHours: string;
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
  status: "pending" | "reviewed" | "contacted" | "accepted" | "declined";
  createdAt: string;
}

export default function CaretakerInquiriesPage() {
  const { t, language } = useLanguage();
  const inqT = t.caretakerProfile.inquiriesPage;
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getHistoryKey = useCallback(() => {
    const caretakerId = caretakerApi.getCaretakerId();
    return `toddler_caretaker_inquiry_search_history_${caretakerId || "default"}`;
  }, []);

  // Load saved search history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getHistoryKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8));
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, [getHistoryKey]);

  // Close history dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const saveSearchTerm = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (clean.length < 2) return;
      setSearchHistory((prev) => {
        const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
        try {
          localStorage.setItem(getHistoryKey(), JSON.stringify(next));
        } catch {
          // Ignore storage error
        }
        return next;
      });
    },
    [getHistoryKey]
  );

  const removeHistoryTerm = (term: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(getHistoryKey(), JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(getHistoryKey());
    } catch {
      // Ignore storage error
    }
  };

  // Auto-save meaningful search queries after a brief pause
  useEffect(() => {
    const clean = searchQuery.trim();
    if (clean.length < 2) return;
    const timer = setTimeout(() => {
      saveSearchTerm(clean);
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery, saveSearchTerm]);

  // Load inquiries from backend filtered by caretakerId
  const loadData = async () => {
    try {
      setLoading(true);
      const caretakerId = caretakerApi.getCaretakerId();
      const token = caretakerApi.getToken();
      const data = await fetchInquiries({
        caretakerId: caretakerId || undefined,
        token: token || undefined,
      });
      setInquiries(data);
    } catch (err) {
      console.error("Failed to load caretaker inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    if (!socket) return;

    const caretakerId = caretakerApi.getCaretakerId();
    if (caretakerId) {
      socket.emit("join:caretaker", caretakerId);
    }

    const handleInquirySync = () => {
      loadData();
    };

    socket.on("inquiry:created", handleInquirySync);
    socket.on("inquiry:updated", handleInquirySync);

    return () => {
      socket.off("inquiry:created", handleInquirySync);
      socket.off("inquiry:updated", handleInquirySync);
    };
  }, []);

  // Update Status handler
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await updateInquiryStatus(id, newStatus);
      setInquiries((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: newStatus as any } : item))
      );
      if (selectedInquiry?._id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.referenceId.toLowerCase().includes(q);
        const matchesChild = item.childName.toLowerCase().includes(q);
        const matchesParent = item.parentName.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesPhone = item.phone.toLowerCase().includes(q);
        return matchesRef || matchesChild || matchesParent || matchesEmail || matchesPhone;
      }
      return true;
    });
  }, [inquiries, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === "pending").length,
      contacted: inquiries.filter((i) => i.status === "contacted" || i.status === "accepted").length,
    };
  }, [inquiries]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "contacted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "reviewed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "declined":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      <CaretakerHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5DDD2] text-xs font-semibold text-[#A12D3A] mb-1.5 shadow-2xs">
              <MailIcon className="w-3.5 h-3.5 text-[#A12D3A]" />
              <span>{inqT.badge}</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] tracking-tight font-heading"
            >
              {inqT.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6E62] mt-0.5">
              {inqT.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 min-h-[40px] rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{inqT.refresh}</span>
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
              {inqT.kpi.total}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] mt-1 font-heading">
              {stats.total}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              {inqT.kpi.totalSub}
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              <span>{inqT.kpi.pending}</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706] mt-1 font-heading">
              {stats.pending}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              {inqT.kpi.pendingSub}
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>{inqT.kpi.contacted}</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] mt-1 font-heading">
              {stats.contacted}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              {inqT.kpi.contactedSub}
            </span>
          </div>
        </div>

        {/* Filter & Search Matrix */}
        <div className="bg-white rounded-2xl border border-[#E5DDD2] p-3 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input + Search History Dropdown */}
            <div ref={searchBoxRef} className="relative flex-1">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#9C8E7E] pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setHistoryOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHistoryOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveSearchTerm(searchQuery);
                      setHistoryOpen(false);
                    } else if (e.key === "Escape") {
                      setHistoryOpen(false);
                    }
                  }}
                  placeholder={
                    language === "de"
                      ? "Nach Kind, Eltern, Telefon oder Referenz-ID suchen..."
                      : "Search by child, parent, phone, or reference ID..."
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-colors min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EBE3D7] transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Search History Dropdown */}
              {historyOpen && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border border-[#E5DDD2] rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#FAF7F2] border-b border-[#EFE8DC]">
                    <span className="text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{language === "de" ? "Suchverlauf" : "Recent Parent Searches"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearSearchHistory}
                      className="text-[11px] font-semibold text-[#A12D3A] hover:underline cursor-pointer"
                    >
                      {language === "de" ? "Alle löschen" : "Clear all"}
                    </button>
                  </div>
                  <ul className="max-h-56 overflow-y-auto divide-y divide-[#F5F0E8]">
                    {searchHistory.map((term) => (
                      <li key={term} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-[#FAF7F2] transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            saveSearchTerm(term);
                            setHistoryOpen(false);
                          }}
                          className="flex-1 text-left text-xs sm:text-sm text-[#1E1B18] font-medium flex items-center gap-2 truncate cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-[#9C8E7E] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">{term}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistoryTerm(term)}
                          aria-label={`Remove ${term}`}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[#9C8E7E] hover:text-[#A12D3A] hover:bg-[#FEF2F2] transition-colors shrink-0 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: "all", label: inqT.filters.all },
                { id: "pending", label: inqT.filters.pending },
                { id: "reviewed", label: inqT.filters.reviewed },
                { id: "contacted", label: inqT.filters.contacted },
                { id: "accepted", label: inqT.filters.accepted },
                { id: "declined", label: inqT.filters.declined },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`py-2 px-3 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === pill.id
                      ? "bg-[#A12D3A] text-white shadow-2xs"
                      : "bg-[#FAF7F2] text-[#6B5E51] border border-[#E5DDD2] hover:bg-white"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Recent Search History Chips */}
          {searchHistory.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#F4EFE7]">
              <span className="text-[11px] font-semibold text-[#7A6E62] flex items-center gap-1 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{language === "de" ? "Letzte Suchen:" : "Recent:"}</span>
              </span>
              {searchHistory.map((term) => {
                const isActive = searchQuery.trim().toLowerCase() === term.toLowerCase();
                return (
                  <span
                    key={term}
                    className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      isActive
                        ? "bg-[#FDF2F2] border-[#A12D3A] text-[#A12D3A]"
                        : "bg-[#FAF7F2] border-[#E5DDD2] text-[#5C4C3E] hover:border-[#C4B7A5]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        saveSearchTerm(term);
                      }}
                      className="cursor-pointer hover:underline max-w-[160px] truncate"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistoryTerm(term)}
                      aria-label={`Remove ${term}`}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={clearSearchHistory}
                className="text-[11px] font-semibold text-[#A12D3A] hover:underline ml-auto cursor-pointer"
              >
                {language === "de" ? "Verlauf löschen" : "Clear history"}
              </button>
            </div>
          )}
        </div>

        {/* Inquiries Cards List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#E5DDD2] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7A6E62]">{inqT.loading}</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5DDD2] p-6 sm:p-14 text-center max-w-[560px] mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center mx-auto text-[#A12D3A]">
              <InboxIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1E1B18] font-heading">
                {inqT.emptyTitle}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6E62] leading-relaxed">
                {searchQuery || statusFilter !== "all"
                  ? inqT.emptyDescFiltered
                  : inqT.emptyDescDefault}
              </p>
            </div>
            {(searchQuery || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-bold text-[#5C4C3E] hover:bg-white cursor-pointer"
              >
                {inqT.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry._id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DDD2] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#D5C9B8] transition-all"
              >
                {/* Header Row: Child Name, Reference ID, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#F0E8DC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shrink-0">
                      <BabyIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-[#1E1B18] leading-tight">
                          {inquiry.childName}
                        </h3>
                        {inquiry.childBirthday && (
                          <span className="text-xs text-[#7A6E62]">
                            (Geb. {inquiry.childBirthday})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#7A6E62] mt-0.5">
                        <span className="font-mono text-[#A12D3A] font-semibold">
                          {inquiry.referenceId}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill & Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                        inquiry.status
                      )}`}
                    >
                      {inquiry.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="px-3 py-1.5 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-white text-xs font-bold text-[#5C4C3E] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-3.5 text-xs text-[#4E443B]">
                  {/* Desired Start & Transition */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8A7A6A] uppercase tracking-wider block">
                      DESIRED START
                    </span>
                    <span className="font-bold text-[#1E1B18] text-sm block">
                      {inquiry.desiredStart}
                    </span>
                    <span className="text-[#7A6E62]">
                      Est. Transition: <strong>{inquiry.estTransition || "2-4 Weeks"}</strong>
                    </span>
                  </div>

                  {/* Care Hours */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8A7A6A] uppercase tracking-wider block">
                      CARE HOURS
                    </span>
                    <span className="font-bold text-[#1E1B18] text-sm block">
                      {inquiry.careHours}
                    </span>
                    <span className="text-[#7A6E62]">
                      Mon – Fri schedule
                    </span>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8A7A6A] uppercase tracking-wider block">
                      PREFERENCES
                    </span>
                    <span className="font-bold text-[#1E1B18] block">
                      {inquiry.preferences?.gender || "Any"} &bull; {inquiry.preferences?.food || "Any"}
                    </span>
                    <span className="text-[#7A6E62]">
                      {inquiry.preferences?.pets || "Pets OK"}
                    </span>
                  </div>

                  {/* Parent Contact */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8A7A6A] uppercase tracking-wider block">
                      PARENT CONTACT
                    </span>
                    <span className="font-bold text-[#1E1B18] text-sm block">
                      {inquiry.parentName}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <a href={`tel:${inquiry.phone}`} className="text-[#A12D3A] font-bold hover:underline">
                        {inquiry.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Parent Note (if present) */}
                {inquiry.note && (
                  <div className="mt-1 p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs text-[#5C4C3E] leading-relaxed">
                    <span className="font-bold text-[#1E1B18] block mb-0.5">{inqT.parentNoteLabel}</span>
                    <p className="whitespace-pre-line">{inquiry.note}</p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-3 border-t border-[#F0E8DC]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6E62]">{inqT.setStatusLabel}</span>
                    {(["reviewed", "contacted", "accepted", "declined"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingId === inquiry._id || inquiry.status === st}
                        onClick={() => handleStatusChange(inquiry._id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer capitalize ${
                          inquiry.status === st
                            ? "bg-[#1E1B18] text-white border-[#1E1B18]"
                            : "bg-white text-[#5C4C3E] border-[#E5DDD2] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {inqT.filters[st] || st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span>{inqT.callParent}</span>
                    </a>
                    <a
                      href={`mailto:${inquiry.email}?subject=Betreuungsanfrage%20${inquiry.referenceId}&body=Hallo%20${encodeURIComponent(
                        inquiry.parentName
                      )},%0A%0Avielen%20Dank%20f%C3%BCr%20Ihre%20Anfrage%20f%C3%BCr%20${encodeURIComponent(
                        inquiry.childName
                      )}.`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <MailIcon className="w-3.5 h-3.5" />
                      <span>{inqT.emailParent}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Inquiry Full Details */}
        {selectedInquiry && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedInquiry(null)}
          >
            <div
              className="bg-white rounded-3xl border border-[#E5DDD2] w-full max-w-lg p-5 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DC]">
                <div>
                  <span className="text-xs font-mono font-bold text-[#A12D3A]">
                    {selectedInquiry.referenceId}
                  </span>
                  <h3 className="font-bold text-lg text-[#1E1B18] font-heading">
                    {selectedInquiry.childName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6E62] hover:bg-[#FAF7F2] cursor-pointer"
                  aria-label="Close modal"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="py-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    {inqT.modal.secChild}
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.childName}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.childName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.childDob}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.childBirthday || (language === "de" ? "Nicht angegeben" : "Not specified")}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    {inqT.modal.secSchedule}
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.desiredStart}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.desiredStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.estTransition}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.estTransition || "2-4 Weeks"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.careHours}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.careHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.secPreferences}:</span>
                    <span className="font-bold text-[#1E1B18]">
                      {selectedInquiry.preferences?.gender} &bull; {selectedInquiry.preferences?.food} &bull; {selectedInquiry.preferences?.pets}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    {inqT.modal.secContact}
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.parentName}:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">{inqT.modal.phone}:</span>
                    <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-[#A12D3A] hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6D6154] shrink-0">{inqT.modal.email}:</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-bold text-[#A12D3A] hover:underline break-all text-right">
                      {selectedInquiry.email}
                    </a>
                  </div>
                </div>

                {selectedInquiry.note && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5DDD2] space-y-1">
                    <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                      {inqT.modal.secNote}
                    </span>
                    <p className="text-[#4E443B] leading-relaxed whitespace-pre-line">
                      {selectedInquiry.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] cursor-pointer min-h-[42px]"
                >
                  {inqT.modal.close}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs min-h-[42px]"
                  >
                    {inqT.callParent}
                  </a>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold shadow-2xs min-h-[42px]"
                  >
                    {inqT.emailParent}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
