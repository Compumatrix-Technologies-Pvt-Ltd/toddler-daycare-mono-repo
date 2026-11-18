import mongoose, { Schema } from "mongoose";
import { IBooking } from "@/types/caretaker/booking.js";

const bookingSchema = new Schema<IBooking>(
  {
    caretakerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    daycareId: {
      type: Schema.Types.ObjectId,
      ref: "Daycare",
      index: true,
    },
    inquiryId: {
      type: String,
      index: true,
      default: "",
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    childDob: {
      type: String,
      required: true,
      trim: true,
    },
    placementStart: {
      type: String,
      required: true,
      trim: true,
    },
    kindergartenTransition: {
      type: String,
      required: true,
      trim: true,
    },
    dailyHours: {
      type: String,
      required: true,
      trim: true,
    },
    slotNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
    },
    preferences: {
      type: String,
      default: "",
      trim: true,
    },
    parentContact: {
      parents: {
        type: String,
        default: "",
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
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    startMonthIndex: {
      type: Number,
      default: 0,
    },
    endMonthIndex: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
