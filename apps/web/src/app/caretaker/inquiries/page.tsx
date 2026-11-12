"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CaretakerHeader } from "../../../components/caretaker/CaretakerHeader";
import { Footer } from "../../../components/Footer";
import { useLanguage } from "../../../i18n/LanguageContext";
import { fetchInquiries, updateInquiryStatus } from "../../../utils/inquery";
import { caretakerApi } from "../../../utils/caretakerApi";
import { getSocket } from "../../../utils/socket";

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
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
              <span>📩</span>
              <span>Caretaker Portal</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] tracking-tight font-heading"
            >
              {t.caretakerProfile.nav.parentInquiries || "Parent Inquiries"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6E62] mt-0.5">
              Review and manage daycare inquiries received from families in your area.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 min-h-[40px] rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
              Total Inquiries
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] mt-1 font-heading">
              {stats.total}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              Inquiries received across your daycares
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              <span>Pending Review</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706] mt-1 font-heading">
              {stats.pending}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              Waiting for your initial response
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
            <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Contacted & Accepted</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] mt-1 font-heading">
              {stats.contacted}
            </div>
            <span className="text-[11px] text-[#8A7A6A] mt-0.5 block">
              In active communication or spot secured
            </span>
          </div>
        </div>

        {/* Filter & Search Matrix */}
        <div className="bg-white rounded-2xl border border-[#E5DDD2] p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by child, parent, phone, or reference ID..."
              className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-colors min-h-[40px]"
            />
            <span className="absolute left-3 top-2.5 text-[#9C8E7E] text-sm">🔍</span>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "reviewed", label: "Reviewed" },
              { id: "contacted", label: "Contacted" },
              { id: "accepted", label: "Accepted" },
              { id: "declined", label: "Declined" },
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

        {/* Inquiries Cards List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#E5DDD2] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7A6E62]">Loading inquiries from database...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5DDD2] p-6 sm:p-14 text-center max-w-[560px] mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center mx-auto text-3xl">
              📬
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1E1B18] font-heading">
                No Inquiries Found
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6E62] leading-relaxed">
                {searchQuery || statusFilter !== "all"
                  ? "No daycare inquiries match your selected filters. Try resetting the search."
                  : "You haven't received any parent inquiries yet. As parents find your daycare on the map, their inquiries will appear here."}
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
                Clear Filters
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
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-lg font-bold text-[#A12D3A] shrink-0">
                      👶
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
                    <span className="font-bold text-[#1E1B18] block mb-0.5">Parent Note:</span>
                    <p className="whitespace-pre-line">{inquiry.note}</p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-3 border-t border-[#F0E8DC]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6E62]">Set Status:</span>
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
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span>📞</span>
                      <span>Call Parent</span>
                    </a>
                    <a
                      href={`mailto:${inquiry.email}?subject=Betreuungsanfrage%20${inquiry.referenceId}&body=Hallo%20${encodeURIComponent(
                        inquiry.parentName
                      )},%0A%0Avielen%20Dank%20f%C3%BCr%20Ihre%20Anfrage%20f%C3%BCr%20${encodeURIComponent(
                        inquiry.childName
                      )}.`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span>✉️</span>
                      <span>Email Parent</span>
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
                >
                  ✕
                </button>
              </div>

              {/* Details Content */}
              <div className="py-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    1. Child Details
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Child Name:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.childName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Date of Birth:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.childBirthday || "Not specified"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    2. Timing & Schedule
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Desired Start:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.desiredStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Est. Transition:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.estTransition || "2-4 Weeks"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Care Hours:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.careHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Preferences:</span>
                    <span className="font-bold text-[#1E1B18]">
                      {selectedInquiry.preferences?.gender} &bull; {selectedInquiry.preferences?.food} &bull; {selectedInquiry.preferences?.pets}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    3. Parent Contact Information
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Contact Name:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6154]">Phone:</span>
                    <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-[#A12D3A] hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6D6154] shrink-0">Email:</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-bold text-[#A12D3A] hover:underline break-all text-right">
                      {selectedInquiry.email}
                    </a>
                  </div>
                </div>

                {selectedInquiry.note && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5DDD2] space-y-1">
                    <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                      4. Parent Message / Note
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
                  Close
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs min-h-[42px]"
                  >
                    Call Parent
                  </a>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold shadow-2xs min-h-[42px]"
                  >
                    Email Parent
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
