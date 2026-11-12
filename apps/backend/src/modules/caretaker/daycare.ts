
import mongoose, { Schema } from "mongoose";
import { IDaycare } from "@/types/caretaker/daycare";

const daycareSchema = new Schema<IDaycare>(
    {
        caretakerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        daycareName: {
            type: String,
            required: true,
            trim: true,
        },

        caregiverName: {
            type: String,
            required: true,
            trim: true,
        },

        caregiverGender: {
            type: String,
            enum: ["male", "female", "other"],
            required: true,
        },

        operations: {
            visibilityWindow: { type: String, required: true },
            operatingHours: { type: String, required: true },
            maxCapacity: { type: Number, required: true, min: 1 },
        },

        contact: {
            email: { type: String, required: true },
            website: { type: String },
            phone: { type: String, required: true },
        },

        additionalDetails: {
            meals: {
                type: String,
                enum: ["self-cooked", "delivered"],
                required: true,
            },
            pets: {
                type: String,
                enum: ["have-pets", "no-pets"],
                required: true,
            },
        },

        photos: {
            type: [
                {
                    url: {
                        type: String,
                        required: true,
                    },
                    publicId: {
                        type: String,
                    },
                },
            ],
            default: [],
        },

        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            street: { type: String, required: true },
            houseNumber: { type: String, default: "" },
            postcode: { type: String, default: "" },
            city: { type: String, required: true },
        },

        workPermit: {
            url: { type: String, default: "" },
            publicId: String,
            fileName: { type: String, default: "" },
            permitId: { type: String, default: "" },
            registrationDate: { type: String, default: "" },
            expirationDate: { type: String, default: "" },
            issuingAuthority: { type: String, default: "" },
            authorizedCapacity: { type: Number },
            adminNotes: { type: String, default: "" },
            approvedAt: { type: Date },
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        ratings: [
            {
                parentId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                review: String,
                rating: {
                    type: Number,
                    min: 1,
                    max: 5,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

const Daycare = mongoose.model<IDaycare>(
    "Daycare",
    daycareSchema
);

export { Daycare };
export default Daycare;
