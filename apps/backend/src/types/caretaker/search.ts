import { Document, Types } from "mongoose";

export interface Iparentsearchhistory extends Document {
    parentname: string;
    parentName?: string;
    email: string;
    phone: string;
    message?: string;
    scope?: "single" | "allMap" | "favorites" | string;
    inquiryId?: Types.ObjectId | string;
    referenceId?: string;

    search: {
        location: {
            lat: number;
            log: number;
            lng?: number;
            area: string;
            address?: string;
        };
        filter: {
            child?: number;
            month?: string;
            year?: string;
            tolerance?: string;
            hours?: string;
            food?: string;
            pet?: string;
            gender?: string;
        };
    };

    parentcurrentlocation?: {
        lat: number;
        log: number;
        lng?: number;
        area?: string;
    };

    daycareIds?: (Types.ObjectId | string)[];
    daycareNames?: string[];
    caretakerIds?: (Types.ObjectId | string)[];

    expiresAt: Date;
    isActive: boolean;
    status: "active" | "expired" | "contacted" | "archived";

    createdAt: Date;
    updatedAt: Date;
}
