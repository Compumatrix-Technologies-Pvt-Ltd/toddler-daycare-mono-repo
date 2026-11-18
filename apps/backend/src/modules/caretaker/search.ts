import mongoose, { Schema } from "mongoose";
import { Iparentsearchhistory } from "@/types/caretaker/search.js";

const parentsearchSchema = new Schema<Iparentsearchhistory>(
    {
        parentname: {
            type: String,
            required: true,
            trim: true,
        },

        parentName: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            default: "",
        },

        scope: {
            type: String,
            enum: ["single", "allMap", "favorites", "search-only"],
            default: "single",
        },

        inquiryId: {
            type: Schema.Types.ObjectId,
            ref: "Inquiry",
        },

        referenceId: {
            type: String,
            trim: true,
        },

        search: {
            location: {
                lat: { type: Number, },
                log: { type: Number, },
                lng: { type: Number, },
                area: { type: String, default: "" },
                address: { type: String, default: "" },
            },
            filter: {
                child: { type: Number, default: 1 },
                month: { type: String, default: "" },
                year: { type: String, default: "" },
                tolerance: { type: String, default: "" },
                hours: { type: String, default: "" },
                food: { type: String, default: "" },
                pet: { type: String, default: "" },
                gender: { type: String, default: "" },
            },
        },

        parentcurrentlocation: {
            lat: { type: Number },
            log: { type: Number },
            lng: { type: Number },
            area: { type: String, default: "" },
        },

        daycareIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "Daycare",
            },
        ],

        daycareNames: [
            {
                type: String,
            },
        ],

        caretakerIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "expired", "contacted", "archived"],
            default: "active",
            index: true,
        },
    },
    { timestamps: true }
);

// Helpful compound indexes for query efficiency
parentsearchSchema.index({ isActive: 1, expiresAt: 1 });
parentsearchSchema.index({ "search.location.lat": 1, "search.location.log": 1 });

const ParentSearch = mongoose.model<Iparentsearchhistory>(
    "ParentSearch",
    parentsearchSchema
);

export { ParentSearch };
export default ParentSearch;
