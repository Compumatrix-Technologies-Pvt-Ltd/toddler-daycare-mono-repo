import { useState, useEffect, useMemo } from "react";
import { AdminContactMessage } from "../../types/admin";
import { adminContactService } from "../../services/adminContactService";
import { useLanguage } from "../../context/LanguageContext";
import { ReplyContactModal } from "../modals/ReplyContactModal";
import {
  MessageSquareIcon,
  SearchIcon,
  RefreshCwIcon,
  CloseIcon,
  EyeIcon,
  CheckIcon,
  TrashIcon,
  ReplyIcon,
} from "../icons/AdminIcons";

interface ContactMessagesViewProps {
  onUnreadCountChange?: (count: number) => void;
}

export function ContactMessagesView({ onUnreadCountChange }: ContactMessagesViewProps) {
  const { t } = useLanguage();
  const cT = t.admin.contactMessages;

  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTargetMessage, setReplyTargetMessage] = useState<AdminContactMessage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminContactService.getAllMessages();
      setMessages(res.messages);
      onUnreadCountChange?.(res.unread);
    } catch (err) {
      console.error("Failed to load contact messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setActionLoadingId(id);
      await adminContactService.updateStatus(id, newStatus);
      setMessages((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: newStatus as any } : item))
      );
      if (selectedMessage?._id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      // Re-calculate unread count
      const updatedList = messages.map((m) =>
        m._id === id ? { ...m, status: newStatus as any } : m
      );
      onUnreadCountChange?.(updatedList.filter((m) => m.status === "unread").length);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(cT.deleteConfirm)) return;
    try {
      setActionLoadingId(id);
      await adminContactService.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selectedMessage?._id === id) {
        setSelectedMessage(null);
      }
      const remaining = messages.filter((m) => m._id !== id);
      onUnreadCountChange?.(remaining.filter((m) => m.status === "unread").length);
    } catch (err: any) {
      alert(err.message || "Failed to delete message");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenDetail = (msg: AdminContactMessage) => {
    setSelectedMessage(msg);
    // Auto-mark as read if unread
    if (msg.status === "unread") {
      handleStatusChange(msg._id, "read");
    }
  };

  const handleOpenReply = (msg: AdminContactMessage) => {
    setReplyTargetMessage(msg);
    setReplyModalOpen(true);
  };

  const handleReplySuccess = (updatedMessage: AdminContactMessage, recipientEmail: string) => {
    setMessages((prev) =>
      prev.map((item) => (item._id === updatedMessage._id ? updatedMessage : item))
    );
    if (selectedMessage?._id === updatedMessage._id) {
      setSelectedMessage(updatedMessage);
    }
    const updatedList = messages.map((m) =>
      m._id === updatedMessage._id ? updatedMessage : m
    );
    onUnreadCountChange?.(updatedList.filter((m) => m.status === "unread").length);
    setToastMessage(`${cT.replySuccessToast || "Email reply sent successfully to"} ${recipientEmail}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.fullName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((m) => m.status === "unread").length,
      replied: messages.filter((m) => m.status === "replied").length,
    };
  }, [messages]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "read":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "replied":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "archived":
        return "bg-stone-100 text-stone-600 border-stone-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#166534] hover:text-[#14532D] text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DDD2] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shrink-0">
            <MessageSquareIcon className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-lg sm:text-xl font-bold text-[#1E1B18] tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {cT.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6E62] mt-0.5">{cT.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-[#F3ECE2] text-xs sm:text-sm font-semibold text-[#423223] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RefreshCwIcon className={`w-4 h-4 text-[#A12D3A] ${loading ? "animate-spin" : ""}`} />
          <span>{cT.refresh}</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E9080]">
            {cT.kpiTotal}
          </div>
          <div className="text-2xl font-bold text-[#1E1B18] mt-1">{stats.total}</div>
        </div>

        {/* Unread */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E9080]">
            {cT.kpiUnread}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-[#B45309]">{stats.unread}</span>
            {stats.unread > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Replied */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5DDD2] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E9080]">
            {cT.kpiReplied}
          </div>
          <div className="text-2xl font-bold text-[#15803D] mt-1">{stats.replied}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E5DDD2] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9080]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={cT.searchPlaceholder}
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-xs sm:text-sm text-[#1E1B18] placeholder:text-[#9E9080] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9E9080] hover:text-[#1E1B18] p-1 cursor-pointer"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5DDD2] bg-white text-xs sm:text-sm font-medium text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#A12D3A]/20 focus:border-[#A12D3A] cursor-pointer"
          >
            <option value="all">{cT.filterAll}</option>
            <option value="unread">{cT.filterUnread}</option>
            <option value="read">{cT.filterRead}</option>
            <option value="replied">{cT.filterReplied}</option>
            <option value="archived">{cT.filterArchived}</option>
          </select>
        </div>
      </div>

      {/* Messages List / Table */}
      <div className="bg-white rounded-2xl border border-[#E5DDD2] shadow-2xs overflow-hidden">
        {loading && messages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-[#7A6E62] mt-3">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#9E9080] flex items-center justify-center mx-auto mb-3">
              <MessageSquareIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1E1B18]">{cT.noMessages}</h3>
            <p className="text-xs text-[#7A6E62] mt-1">{cT.noMessagesDesc}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on compact screens) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DDD2] bg-[#FAF8F5]/80 text-[#7A6E62] font-semibold">
                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">{cT.colSender}</th>
                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">{cT.colSubject}</th>
                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider whitespace-nowrap">{cT.colDate}</th>
                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">{cT.colStatus}</th>
                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">{cT.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {filteredMessages.map((msg) => (
                    <tr
                      key={msg._id}
                      onClick={() => handleOpenDetail(msg)}
                      className={`hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                        msg.status === "unread" ? "bg-[#FFFDF7] font-medium" : ""
                      }`}
                    >
                      {/* Sender */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1E1B18]">{msg.fullName}</div>
                        <div className="text-xs text-[#7A6E62] mt-0.5">{msg.email}</div>
                      </td>

                      {/* Subject & Preview */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="text-xs sm:text-sm font-semibold text-[#1E1B18] truncate">
                          {msg.subject}
                        </div>
                        <div className="text-xs text-[#7A6E62] truncate mt-0.5">
                          {msg.message}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#7A6E62]">
                        {formatDate(msg.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            msg.status
                          )}`}
                        >
                          {msg.status === "unread"
                            ? cT.statusUnread
                            : msg.status === "read"
                              ? cT.statusRead
                              : msg.status === "replied"
                                ? cT.statusReplied
                                : cT.statusArchived}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(msg)}
                            title={cT.viewDetails}
                            className="w-8 h-8 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#423223] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReply(msg)}
                            title={cT.replyEmail}
                            className="w-8 h-8 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#15803D] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <ReplyIcon className="w-4 h-4" />
                          </button>

                          {msg.status !== "replied" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  msg._id,
                                  msg.status === "read" ? "unread" : "read"
                                )
                              }
                              title={msg.status === "read" ? cT.markAsUnread : cT.markAsRead}
                              disabled={actionLoadingId === msg._id}
                              className="w-8 h-8 rounded-lg border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-[#B45309] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(msg._id)}
                            title={cT.deleteMessage}
                            disabled={actionLoadingId === msg._id}
                            className="w-8 h-8 rounded-lg border border-[#E5DDD2] bg-white hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden divide-y divide-[#F0EBE1]">
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => handleOpenDetail(msg)}
                  className={`p-4 transition-colors cursor-pointer ${
                    msg.status === "unread" ? "bg-[#FFFDF7]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[#1E1B18] text-sm truncate">{msg.fullName}</div>
                      <div className="text-xs text-[#7A6E62] truncate mt-0.5">{msg.email}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(
                        msg.status
                      )}`}
                    >
                      {msg.status === "unread"
                        ? cT.statusUnread
                        : msg.status === "read"
                          ? cT.statusRead
                          : msg.status === "replied"
                            ? cT.statusReplied
                            : cT.statusArchived}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs sm:text-sm font-semibold text-[#1E1B18] truncate">
                      {msg.subject}
                    </div>
                    <div className="text-xs text-[#7A6E62] line-clamp-2 mt-0.5">
                      {msg.message}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F5EFE6] flex items-center justify-between text-xs text-[#9E9080]" onClick={(e) => e.stopPropagation()}>
                    <span>{formatDate(msg.createdAt)}</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReply(msg)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#15803D] hover:text-[#166534] cursor-pointer"
                        aria-label={cT.replyEmail}
                        title={cT.replyEmail}
                      >
                        <ReplyIcon className="w-5 h-5" />
                      </button>
                      {msg.status !== "replied" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              msg._id,
                              msg.status === "read" ? "unread" : "read"
                            )
                          }
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#B45309] hover:text-[#92400E]"
                          aria-label={msg.status === "read" ? cT.markAsUnread : cT.markAsRead}
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(msg._id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:text-red-700"
                        aria-label={cT.deleteMessage}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Message Detail Lightbox Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl border border-[#E5DDD2] shadow-xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#F0EBE1] bg-[#FAF8F5]/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#FAF7F2] border border-[#E5DDD2] text-[#A12D3A] font-bold text-base flex items-center justify-center shrink-0">
                  {selectedMessage.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-base sm:text-lg font-bold text-[#1E1B18] tracking-tight leading-tight truncate"
                    style={{ fontFamily: "var(--font-plus-jakarta)" }}
                  >
                    {selectedMessage.fullName}
                  </h2>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-xs sm:text-sm text-[#A12D3A] font-medium hover:underline block truncate"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:bg-[#F0EBE1] transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Meta & Status bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A6E62] pb-3 border-b border-[#F0EBE1]">
                <span>
                  {cT.receivedOn}: <strong>{formatDate(selectedMessage.createdAt)}</strong>
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                    selectedMessage.status
                  )}`}
                >
                  {selectedMessage.status === "unread"
                    ? cT.statusUnread
                    : selectedMessage.status === "read"
                      ? cT.statusRead
                      : selectedMessage.status === "replied"
                        ? cT.statusReplied
                        : cT.statusArchived}
                </span>
              </div>

              {/* Subject */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9080] block mb-1">
                  Subject
                </span>
                <div className="text-sm sm:text-base font-bold text-[#1E1B18] bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DDD2]">
                  {selectedMessage.subject}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9080] block mb-1">
                  {cT.messageContent}
                </span>
                <div className="text-xs sm:text-sm text-[#3E342B] whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] p-4 rounded-xl border border-[#E5DDD2] min-h-[120px]">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 sm:p-5 border-t border-[#F0EBE1] bg-[#FAF8F5]/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedMessage.status === "replied" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{cT.statusReplied}</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          selectedMessage._id,
                          selectedMessage.status === "read" ? "unread" : "read"
                        )
                      }
                      className="px-3.5 py-2 min-h-[44px] rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#F3ECE2] text-xs font-semibold text-[#423223] transition-colors cursor-pointer"
                    >
                      {selectedMessage.status === "read" ? cT.markAsUnread : cT.markAsRead}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage._id, "replied")}
                      className="px-3.5 py-2 min-h-[44px] rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-xs font-semibold text-[#15803D] transition-colors cursor-pointer"
                    >
                      {cT.markAsReplied}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedMessage;
                    setSelectedMessage(null);
                    handleOpenReply(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <ReplyIcon className="w-4 h-4 text-white" />
                  <span>{cT.replyEmail}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal Popup */}
      <ReplyContactModal
        isOpen={replyModalOpen}
        message={replyTargetMessage}
        onClose={() => setReplyModalOpen(false)}
        onSuccess={handleReplySuccess}
      />
    </div>
  );
}
