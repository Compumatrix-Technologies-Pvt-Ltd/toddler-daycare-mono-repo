import Daycare from "@/modules/caretaker/daycare";
import { Request } from "express";
import path from "path";
import { Types } from "mongoose";
import fs from "fs/promises";
import "@/types/caretaker/caretaker";

type UploadedFiles = {
    photos?: Express.Multer.File[];
    workPermit?: Express.Multer.File[];
};

const parseField = (value: unknown) => {
    if (typeof value === "string") {
        return JSON.parse(value);
    }
    return value;
};

const deleteUploadedFiles = async (files: UploadedFiles) => {
    const allFiles = [
        ...(files.photos || []),
        ...(files.workPermit || []),
    ];

    await Promise.all(
        allFiles.map((file) => {
            return fs.unlink(file.path).catch(() => undefined);
        })
    );
};

//cerate daycare
export const createDaycareService = async (req: Request) => {
    const files = (req.files || {}) as UploadedFiles;

    try {
        const caretakerId = req.caretaker?.caretakerId;

        if (!caretakerId || !Types.ObjectId.isValid(caretakerId)) {
            throw new Error("Invalid caretaker ID");
        }

        //check uploaded photos
        const photos = files.photos || [];

        if (photos.length < 4) {
            throw new Error("Minimum 4 photos are required");
        }

        //check work permit
        const workPermit = files.workPermit?.[0];
        if (!workPermit) {
            throw new Error("Work permit document is required");
        }

        //check existing daycare
        const existingDaycare = await Daycare.findOne({
            caretakerId,
        });

        if (existingDaycare) {
            throw new Error("Daycare already exists for this caretaker");
        }

        //Parse multipart JSON fields
        const parseField = (field: string) => {
            try {
                return typeof req.body[field] === "string"
                    ? JSON.parse(req.body[field])
                    : req.body[field];
            } catch {
                throw new Error(`Failed to parse ${field} field`);
            }
        };

        const operations = parseField("operations");
        const contact = parseField("contact");
        const additionalDetails = parseField("additionalDetails");
        const location = parseField("location");

        const daycareData = {
            caretakerId,

            daycareName: req.body.daycareName,
            caregiverName: req.body.caregiverName,
            caregiverGender: req.body.caregiverGender,

            operations,
            contact,
            additionalDetails,

            photos: photos.map((file) => ({
                url: `/uploads/daycare/photos/${path.basename(file.path)}`,
            })),

            location,

            workPermit: {
                url: `/private/daycare/documents/${path.basename(workPermit.path)}`,
                fileName: workPermit.originalname,
            },
        };

        const daycare = await Daycare.create(daycareData);

        return daycare;
    } catch (error) {
        // Remove files if database operation fails
        await deleteUploadedFiles(files);
        throw error;
    }
};

//Get Daycare
export const getDaycareService = async (req: Request) => {
    const caretakerId = req.caretaker?.caretakerId;

    if (!caretakerId) {
        throw new Error("Caretaker authentication required");

        const daycare = await Daycare.findOne({ caretakerId });
        if (!daycare) {
            throw new Error("Daycare not Found");
        }

        return daycare;
    }
}

//Update daycare
export const updatedDaycareService = async (req: Request) => {
    const caretakerId = req.caretaker?.caretakerId;

    if (!caretakerId) {
        throw new Error("caretaker authentication required");
    }

    const daycare = await Daycare.findOne({ caretakerId });
    if (!daycare) {
        throw new Error("daycare not found");
    }

    const files = req.files as UploadedFiles | undefined;

    //updata normal text fields
    const fields = [
        "daycareName",
        "caregiverName",
        "caregiverGender",
        "operations",
        "contact",
        "additionalDetails",
        "location",
    ] as const;

    for (const field of fields) {
        if (req.body[field] !== undefined) {
            (daycare as any)[field] = parseField(req.body[field]);
        }
    }

    //handle photo updates
    const newPhotos = (files?.photos || []).map((file) => ({
        url: `/uploads/daycare/photos/${file.filename}`,
    }));

    if (newPhotos.length > 0) {
        daycare.photos = [...daycare.photos, ...newPhotos];
    }

    // Validate total photos after update
    if (daycare.photos.length < 4) {
        throw new Error("Minimum 4 photos are required");
    }

    //Replace Work permit only if a new pdf is uploaded
    const newWorkPermit = files?.workPermit?.[0];

    if (newWorkPermit) {
        daycare.workPermit = {
            url: `daycare/documents/${newWorkPermit.filename}`,
            fileName: newWorkPermit.originalname,
        };
    }

    await daycare.save();

    return daycare;
}
