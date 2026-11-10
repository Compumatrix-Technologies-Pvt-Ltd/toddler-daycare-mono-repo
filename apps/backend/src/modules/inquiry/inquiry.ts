import mongoose, { Schema, Document } from "mongoose";

export interface IInquiry extends Document {
  referenceId: string;
  scope: "single" | "allMap" | "favorites";
  caretakerId?: string;
  caretakerIds: string[];
  daycareIds?: string[];
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
  consentMapVisibility: boolean;
  status: "pending" | "reviewed" | "accepted" | "declined";
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
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    childBirthday: {
      type: String,
      trim: true,
    },
    desiredStart: {
      type: String,
      required: true,
      trim: true,
    },
    estTransition: {
      type: String,
      trim: true,
      default: "2-4 Weeks",
    },
    careHours: {
      type: String,
      required: true,
      default: "Mon – Fri • 08:00 – 15:00",
    },
    preferences: {
      gender: { type: String, default: "Any" },
      food: { type: String, default: "Self-cooked" },
      pets: { type: String, default: "Pets OK" },
    },
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
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Inquiry = mongoose.model<IInquiry>("Inquiry", InquirySchema);

