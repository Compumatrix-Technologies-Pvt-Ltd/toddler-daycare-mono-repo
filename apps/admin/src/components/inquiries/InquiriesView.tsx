import { useState, useEffect, useMemo } from "react";
import { AdminInquiry } from "../../types/admin";
import { adminInquiryService } from "../../services/adminInquiryService";

export function InquiriesView() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await adminInquiryService.updateStatus(id, newStatus);
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

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
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
  }, [inquiries, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === "pending").length,
      contacted: inquiries.filter((i) => i.status === "contacted").length,
      accepted: inquiries.filter((i) => i.status === "accepted").length,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-semibold text-[#A12D3A] mb-1">
            <span>✉️</span>
            <span>Platform Inquiries</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight font-heading">
            Daycare Search Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6E62]">
            Monitor all inquiry forms submitted by families across certified daycare centers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6E62] uppercase tracking-wider block">
            Total Inquiries
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] mt-1 font-heading">
            {stats.total}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
            Submitted via web form
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#D97706] uppercase tracking-wider block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            <span>Pending Action</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#D97706] mt-1 font-heading">
            {stats.pending}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
            Awaiting daycare review
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>Contacted</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#2563EB] mt-1 font-heading">
            {stats.contacted}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
            Caretaker reached out
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Accepted</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#16A34A] mt-1 font-heading">
            {stats.accepted}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#8A7A6A] mt-0.5 block truncate">
            Placement confirmed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ref ID, Child name, Parent, Email, Phone, or Daycare..."
            className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9C8E7E] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-colors min-h-[40px]"
          />
          <span className="absolute left-3 top-2.5 text-[#9C8E7E] text-sm">🔍</span>
        </div>

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
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7A6E62]">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center mx-auto text-2xl">
              📬
            </div>
            <h3 className="text-sm font-bold text-[#1E1B18]">No inquiries found</h3>
            <p className="text-xs text-[#7A6E62]">No submissions match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E5DDD2] text-[#7A6E62] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Child Information</th>
                  <th className="py-3 px-4">Parent Contact</th>
                  <th className="py-3 px-4">Timing & Hours</th>
                  <th className="py-3 px-4">Preferences</th>
                  <th className="py-3 px-4">Target Daycare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    {/* Ref ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#A12D3A] whitespace-nowrap">
                      {inquiry.referenceId}
                    </td>

                    {/* Child Information */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1E1B18] text-sm">
                        {inquiry.childName}
                      </div>
                      <div className="text-[11px] text-[#7A6E62]">
                        {inquiry.childBirthday ? `DOB: ${inquiry.childBirthday}` : "Age specified"}
                      </div>
                    </td>

                    {/* Parent Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1E1B18]">
                        {inquiry.parentName}
                      </div>
                      <div className="text-[11px] text-[#7A6E62]">
                        <a href={`tel:${inquiry.phone}`} className="hover:underline text-[#A12D3A]">
                          {inquiry.phone}
                        </a>
                      </div>
                      <div className="text-[11px] text-[#7A6E62] truncate max-w-[150px]">
                        {inquiry.email}
                      </div>
                    </td>

                    {/* Timing & Hours */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1E1B18]">
                        {inquiry.desiredStart}
                      </div>
                      <div className="text-[11px] text-[#7A6E62]">
                        {inquiry.careHours}
                      </div>
                      <div className="text-[10px] text-[#8A7A6A]">
                        Transition: {inquiry.estTransition || "2-4 Weeks"}
                      </div>
                    </td>

                    {/* Preferences */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E5DDD2] text-[#4E443B]">
                        {inquiry.preferences?.gender || "Any"} &bull; {inquiry.preferences?.food || "Any"} &bull; {inquiry.preferences?.pets || "Pets OK"}
                      </span>
                    </td>

                    {/* Target Daycare */}
                    <td className="py-3.5 px-4 font-medium text-[#1E1B18]">
                      {inquiry.daycareNames?.join(", ") || "General Inquiry"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <select
                        value={inquiry.status}
                        disabled={updatingId === inquiry._id}
                        onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border uppercase tracking-wider cursor-pointer ${getStatusBadge(
                          inquiry.status
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] shadow-2xs transition-colors cursor-pointer"
                      >
                        View Form
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E5DDD2] w-full max-w-xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E8DC]">
              <div>
                <span className="text-xs font-mono font-bold text-[#A12D3A]">
                  {selectedInquiry.referenceId}
                </span>
                <h3 className="font-bold text-lg text-[#1E1B18] font-heading">
                  Inquiry: {selectedInquiry.childName}
                </h3>
                <span className="text-xs text-[#7A6E62]">
                  Submitted on {new Date(selectedInquiry.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6E62] hover:bg-[#FAF7F2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 text-xs">
              {/* Section 1: Child */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  1. Child Information
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Child Name:</span>
                    <span className="font-bold text-[#1E1B18] text-sm">{selectedInquiry.childName}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Birthday:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.childBirthday || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Timing & Schedule */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  2. Timing & Schedule
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Desired Start:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.desiredStart}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Est. Transition:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.estTransition || "2-4 Weeks"}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Care Hours:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.careHours}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Preferences:</span>
                    <span className="font-bold text-[#1E1B18]">
                      {selectedInquiry.preferences?.gender} &bull; {selectedInquiry.preferences?.food} &bull; {selectedInquiry.preferences?.pets}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Parent Contact */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  3. Parent Contact Details
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Parent Name:</span>
                    <span className="font-bold text-[#1E1B18]">{selectedInquiry.parentName}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Phone:</span>
                    <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-[#A12D3A] hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#7A6E62] block text-[11px]">Email:</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-bold text-[#A12D3A] hover:underline truncate block">
                      {selectedInquiry.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Section 4: Target Daycares */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
                <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                  4. Contacted Daycare Centers
                </span>
                <div className="font-bold text-[#1E1B18]">
                  {selectedInquiry.daycareNames?.join(", ") || "All Map Results"}
                </div>
                <div className="text-[11px] text-[#7A6E62]">
                  Scope: <strong className="capitalize">{selectedInquiry.scope}</strong>
                </div>
                {selectedInquiry.caretakerId && (
                  <div className="text-[11px] text-[#7A6E62]">
                    Caretaker ID: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E5DDD2]">{selectedInquiry.caretakerId}</code>
                  </div>
                )}
              </div>

              {/* Section 5: Parent Note */}
              {selectedInquiry.note && (
                <div className="p-3.5 rounded-xl bg-white border border-[#E5DDD2] space-y-1">
                  <span className="font-bold text-[#7A6E62] uppercase tracking-wider block text-[10px]">
                    5. Personal Note from Parent
                  </span>
                  <p className="text-[#4E443B] leading-relaxed whitespace-pre-line bg-[#FAF7F2] p-3 rounded-lg border border-[#E5DDD2]">
                    {selectedInquiry.note}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#F0E8DC] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C4C3E] cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                >
                  Call Parent
                </a>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Betreuungsanfrage%20${selectedInquiry.referenceId}&body=Hallo%20${encodeURIComponent(
                    selectedInquiry.parentName
                  )},%0A%0Abezugnehmend%20auf%20Ihre%20Anfrage%20f%C3%BCr%20${encodeURIComponent(
                    selectedInquiry.childName
                  )}...`}
                  className="px-3.5 py-2 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs font-bold shadow-2xs"
                >
                  Email Parent
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
