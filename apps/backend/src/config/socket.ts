import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export interface DaycareSocketPayload {
  daycareId: string;
  caretakerId?: string;
  status?: string;
  action: "created" | "updated" | "status_changed" | "deleted";
}

export interface InquirySocketPayload {
  inquiryId: string;
  referenceId?: string;
  caretakerIds?: string[];
  status?: string;
  action: "created" | "status_changed";
}

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:caretaker", (caretakerId: string) => {
      if (typeof caretakerId === "string" && caretakerId.trim()) {
        socket.join(`caretaker:${caretakerId.trim()}`);
      }
    });

    socket.on("join:admin", () => {
      socket.join("admin");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitDaycareUpdated(payload: DaycareSocketPayload): void {
  if (!io) return;

  io.emit("daycare:updated", payload);

  if (payload.action === "status_changed") {
    io.emit("daycare:status_changed", payload);
    if (payload.caretakerId) {
      io.to(`caretaker:${payload.caretakerId}`).emit("daycare:status_changed", payload);
    }
  }
}

export function emitInquiryUpdated(payload: InquirySocketPayload): void {
  if (!io) return;

  const eventName = payload.action === "created" ? "inquiry:created" : "inquiry:updated";
  io.emit(eventName, payload);
  io.to("admin").emit(eventName, payload);

  if (Array.isArray(payload.caretakerIds)) {
    for (const id of payload.caretakerIds) {
      if (id) {
        io.to(`caretaker:${id}`).emit(eventName, payload);
      }
    }
  }
}

