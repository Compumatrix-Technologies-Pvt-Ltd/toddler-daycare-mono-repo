
import { Document, Types } from "mongoose";

export interface IDaycare extends Document {
    caretakerId: Types.ObjectId;

    daycareName: string;

    caregiverName: string;

    caregiverGender: "male" | "female" | "other";

    operations: {
        visibilityWindow: string;
        operatingHours: string;
        maxCapacity: number;
    };

    contact: {
        email: string;
        website?: string;
        phone: string;
    };

    additionalDetails: {
        meals: "self-cooked" | "delivered";
        pets: "have-pets" | "no-pets";
    };

    photos: {
        url: string;
        publicId?: string;
    }[];

    location: {
        latitude: number;
        longitude: number;
        street: string;
        houseNumber: string;
        postcode: string;
        city: string;
    };

    workPermit: {
        url: string;
        publicId?: string;
        fileName?: string;
        permitId?: string;
        registrationDate?: string;
        expirationDate?: string;
        issuingAuthority?: string;
        authorizedCapacity?: number;
        adminNotes?: string;
        approvedAt?: Date | string;
    };

    status?: "pending" | "approved" | "rejected";

    ratings: {
        parentId: Types.ObjectId;
        review: string;
        rating: number;
    }[];
}
