import mongoose, { Schema, Document } from "mongoose";

export interface IInquiry extends Document {
  referenceId: string;
  scope: "single" | "allMap" | "favorites";
  caretakerId?: string;
  caretakerIds: string[];
  daycareIds?: string[];
  daycareNames: string[];
  parentName: string;
  phone: string;
  email: string;
  note?: string;
  consentMapVisibility: boolean;
  searchLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
    address?: string;
  };
  currentLocation?: {
    lat?: number;
    log?: number;
    lng?: number;
    area?: string;
    address?: string;
  };
  locationDistance?: string;
  locationDistanceDe?: string;
  distanceKm?: number;
  status: "pending" | "reviewed" | "contacted" | "accepted" | "declined" | "booked";

  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "contacted", "accepted", "declined", "booked"],
      default: "pending",
      index: true,
    },
    scope: {
      type: String,
      enum: ["single", "allMap", "favorites"],
      default: "single",
    },
    caretakerId: {
      type: String,
      index: true,
      default: "",
    },
    caretakerIds: [
      {
        type: String,
        index: true,
      },
    ],
    daycareIds: [
      {
        type: String,
      },
    ],
    daycareNames: [
      {
        type: String,
      },
    ],
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    note: {
      type: String,
      trim: true,
    },
    consentMapVisibility: {
      type: Boolean,
      default: true,
    },
    searchLocation: {
      lat: { type: Number },
      lng: { type: Number },
      log: { type: Number },
      area: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      log: { type: Number },
      area: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    locationDistance: {
      type: String,
      default: "",
      trim: true,
    },
    locationDistanceDe: {
      type: String,
      default: "",
      trim: true,
    },
    distanceKm: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Inquiry = mongoose.model<IInquiry>("Inquiry", InquirySchema);

