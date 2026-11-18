import { Document, Types } from "mongoose";

export interface IBookingParentContact {
  parents?: string;
  phone: string;
  email: string;
}

export interface IBooking extends Document {
  caretakerId: Types.ObjectId | string;
  daycareId?: Types.ObjectId | string;
  inquiryId?: string;
  referenceId: string;
  childName: string;
  childDob: string;
  placementStart: string;
  kindergartenTransition: string;
  dailyHours: string;
  slotNumber: number;
  category?: "current" | "future";
  status: "confirmed" | "completed" | "cancelled";
  preferences?: string;
  parentContact: IBookingParentContact;
  notes?: string;
  startMonthIndex?: number;
  endMonthIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  caretakerId?: string;
  daycareId?: string;
  inquiryId?: string;
  referenceId?: string;
  childName: string;
  childDob: string;
  placementStart: string;
  kindergartenTransition: string;
  dailyHours: string;
  slotNumber?: number;
  category?: "current" | "future";
  status?: "confirmed" | "completed" | "cancelled";
  preferences?: string;
  parentContact: IBookingParentContact;
  notes?: string;
  startMonthIndex?: number;
  endMonthIndex?: number;
}
