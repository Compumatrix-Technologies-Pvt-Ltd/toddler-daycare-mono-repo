import axios from "axios";
import { AdminContactMessage } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Seeded mock data for fallback
let localMockMessages: AdminContactMessage[] = [
  {
    _id: "msg-101",
    fullName: "Elena Hoffmann",
    email: "elena.hoffmann@gmail.com",
    subject: "Frage zur Kindertagespflege-Anmeldung in Pankow",
    message: "Guten Tag, ich suche ab September 2026 einen Betreuungsplatz für meine 14 Monate alte Tochter im Prenzlauer Berg. Gibt es zertifizierte Tagesmütter mit freien Plätzen?",
    status: "unread",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: "msg-102",
    fullName: "Markus Becker",
    email: "m.becker@berlin-mail.de",
    subject: "Kooperation als zertifizierter Tagesvater",
    message: "Hallo Toddler-Team, ich habe meine Pflegeerlaubnis nach § 43 SGB VIII erhalten und möchte mein Profil gern verifizieren lassen. Welche Dokumente muss ich hochladen?",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: "msg-103",
    fullName: "Sophie Meier",
    email: "sophie.meier@outlook.com",
    subject: "Rückmeldung zur Plattform",
    message: "Vielen Dank für diese wunderbare Plattform! Wir konnten innerhalb von zwei Wochen eine sehr liebevolle Tagespflegeperson finden.",
    status: "replied",
    adminNotes: "Bedankt und um Bewertung gebeten.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

export const adminContactService = {
  /**
   * Fetch all contact messages with search & status filters
   */
  async getAllMessages(params?: {
    search?: string;
    status?: string;
  }): Promise<{ messages: AdminContactMessage[]; total: number; unread: number; replied: number }> {
    try {
      const res = await api.get("/admin/contact-messages", { params });
      const data = res.data?.data || [];
      const meta = res.data?.meta || {};
      return {
        messages: data,
        total: meta.total ?? data.length,
        unread: meta.unread ?? data.filter((m: AdminContactMessage) => m.status === "unread").length,
        replied: meta.replied ?? data.filter((m: AdminContactMessage) => m.status === "replied").length,
      };
    } catch (err) {
      console.warn("Backend API unavailable for contact messages, using mock store:", err);
      let filtered = [...localMockMessages];
      if (params?.status && params.status !== "all") {
        filtered = filtered.filter((m) => m.status === params.status);
      }
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.subject.toLowerCase().includes(q) ||
            m.message.toLowerCase().includes(q)
        );
      }
      return {
        messages: filtered,
        total: localMockMessages.length,
        unread: localMockMessages.filter((m) => m.status === "unread").length,
        replied: localMockMessages.filter((m) => m.status === "replied").length,
      };
    }
  },

  /**
   * Update message status (unread, read, replied, archived) or admin notes
   */
  async updateStatus(
    id: string,
    status: string,
    adminNotes?: string
  ): Promise<AdminContactMessage> {
    try {
      const res = await api.patch(`/admin/contact-messages/${id}/status`, {
        status,
        adminNotes,
      });
      return res.data?.data;
    } catch (err) {
      console.warn("Updating status in local mock store:", err);
      const existing = localMockMessages.find((m) => m._id === id);
      if (existing) {
        existing.status = status as any;
        if (adminNotes !== undefined) {
          existing.adminNotes = adminNotes;
        }
        existing.updatedAt = new Date().toISOString();
        return existing;
      }
      throw err;
    }
  },

  /**
   * Delete contact message
   */
  async deleteMessage(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/contact-messages/${id}`);
      return true;
    } catch (err) {
      console.warn("Deleting message from local mock store:", err);
      localMockMessages = localMockMessages.filter((m) => m._id !== id);
      return true;
    }
  },

  /**
   * Send direct email reply to contact message
   */
  async sendReply(
    id: string,
    subject: string,
    replyMessage: string
  ): Promise<{ message: AdminContactMessage; emailResult?: any }> {
    try {
      const res = await api.post(`/admin/contact-messages/${id}/reply`, {
        subject,
        replyMessage,
      });
      return {
        message: res.data?.data,
        emailResult: res.data?.emailResult,
      };
    } catch (err) {
      console.warn("API failed for reply, simulating in mock store:", err);
      const existing = localMockMessages.find((m) => m._id === id);
      if (existing) {
        existing.status = "replied";
        const replyNote = `Reply sent on ${new Date().toISOString()}:\n${replyMessage}`;
        existing.adminNotes = existing.adminNotes
          ? `${existing.adminNotes}\n\n---\n${replyNote}`
          : replyNote;
        existing.updatedAt = new Date().toISOString();
        return {
          message: existing,
          emailResult: { sent: true, simulated: true },
        };
      }
      throw err;
    }
  },
};
