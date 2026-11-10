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
        const trimmed = value.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return value;
            }
        }
        return value;
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

//create daycare
export const createDaycareService = async (req: Request) => {
    const files = (req.files || {}) as UploadedFiles;

    try {
        const caretakerId = req.caretaker?.caretakerId;

        if (!caretakerId || !Types.ObjectId.isValid(caretakerId)) {
            throw new Error("Invalid caretaker ID");
        }

        // Check uploaded photos (use uploaded files or fallback to default daycare photo set)
        const photos = files.photos || [];
        const photoData =
            photos.length > 0
                ? photos.map((file) => ({
                    url: `/uploads/daycare/photos/${path.basename(file.path)}`,
                }))
                : [
                    { url: "/assets/classroom.png" },
                    { url: "/assets/playground.png" },
                    { url: "/assets/toys.png" },
                    { url: "/assets/classroom.png" },
                ];

        // Check work permit (optional on initial draft creation)
        const workPermit = files.workPermit?.[0];
        const workPermitData = workPermit
            ? {
                url: `/uploads/daycare/documents/${path.basename(workPermit.path)}`,
                fileName: workPermit.originalname,
            }
            : {
                url: "",
                fileName: "",
            };

        // Check existing daycare
        const existingDaycare = await Daycare.findOne({
            caretakerId,
        });

        if (existingDaycare) {
            throw new Error("Daycare already exists for this caretaker");
        }

        const operations = parseField(req.body.operations);
        const contact = parseField(req.body.contact);
        const additionalDetails = parseField(req.body.additionalDetails);
        const location = parseField(req.body.location);

        const daycareData = {
            caretakerId,

            daycareName: req.body.daycareName,
            caregiverName: req.body.caregiverName,
            caregiverGender: req.body.caregiverGender,

            operations,
            contact,
            additionalDetails,

            photos: photoData,

            location,

            workPermit: workPermitData,
            status: "pending",
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
    }

    const daycare = await Daycare.findOne({ caretakerId });
    if (!daycare) {
        throw new Error("Daycare not found");
    }

    return daycare;
};


//get all - public daycares on toddler home screen (ONLY ACTIVE & ADMIN APPROVED)
export const allDaycareService = async (req: Request) => {
    const daycares = await Daycare.find({ status: "approved" });

    return daycares;
};

//Update daycare
export const updatedDaycareService = async (req: Request) => {
    const files = req.files as UploadedFiles | undefined;

    try {
        const caretakerId = req.caretaker?.caretakerId;

        if (!caretakerId) {
            throw new Error("caretaker authentication required");
        }

        const daycare = await Daycare.findOne({ caretakerId });
        if (!daycare) {
            throw new Error("daycare not found");
        }

        // Update normal text fields
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

        // Handle photo deletions & reconciliation
        // Only run reconciliation if client explicitly passed existingPhotos in body
        if (req.body.existingPhotos !== undefined) {
            const parsedExisting = parseField(req.body.existingPhotos);
            const retainedPhotosList: string[] = Array.isArray(parsedExisting) ? parsedExisting : [];

            // Identify photos currently in DB that are NO LONGER in the retained list
            const photosToDelete = daycare.photos.filter((dbPhoto) => {
                const dbFileName = path.basename(dbPhoto.url);
                return !retainedPhotosList.some((retainedItem) => {
                    const retainedStr = typeof retainedItem === "string" ? retainedItem : (retainedItem as any).url || "";
                    const retFileName = path.basename(retainedStr);
                    return dbPhoto.url === retainedStr || dbFileName === retFileName;
                });
            });

            // Delete physical files of removed photos from uploads directory
            for (const photo of photosToDelete) {
                if (photo.url && photo.url.startsWith("/uploads/daycare/photos/")) {
                    const fileName = path.basename(photo.url);
                    const filePath = path.join(
                        process.cwd(),
                        "src/uploads/daycare/photos",
                        fileName
                    );
                    try {
                        await fs.unlink(filePath);
                        console.log(`[Photo Cleanup] Deleted disk file: ${fileName}`);
                    } catch (err: any) {
                        if (err.code !== "ENOENT") {
                            console.error(`[Photo Cleanup] Error removing ${fileName}:`, err.message);
                        }
                    }
                }
            }

            // Keep only the retained photos in the daycare document
            daycare.photos = daycare.photos.filter((dbPhoto) => {
                const dbFileName = path.basename(dbPhoto.url);
                return retainedPhotosList.some((retainedItem) => {
                    const retainedStr = typeof retainedItem === "string" ? retainedItem : (retainedItem as any).url || "";
                    const retFileName = path.basename(retainedStr);
                    return dbPhoto.url === retainedStr || dbFileName === retFileName;
                });
            });
        }

        // Append new uploaded photos
        const newPhotos = (files?.photos || []).map((file) => ({
            url: `/uploads/daycare/photos/${file.filename}`,
        }));

        if (newPhotos.length > 0) {
            daycare.photos = [...daycare.photos, ...newPhotos];
        }

        // Replace Work permit only if a new pdf is uploaded
        const newWorkPermit = files?.workPermit?.[0];

        if (newWorkPermit) {
            // Delete old work permit from uploads folder if it exists
            if (
                daycare.workPermit?.url &&
                daycare.workPermit.url.startsWith("/uploads/daycare/documents/")
            ) {
                const oldPdfPath = path.join(
                    process.cwd(),
                    "src/uploads/daycare/documents",
                    path.basename(daycare.workPermit.url)
                );
                try {
                    await fs.unlink(oldPdfPath);
                    console.log(`[Document Cleanup] Deleted old work permit: ${oldPdfPath}`);
                } catch {
                    // Ignore ENOENT
                }
            }

            daycare.workPermit = {
                url: `/uploads/daycare/documents/${newWorkPermit.filename}`,
                fileName: newWorkPermit.originalname,
            };
        }

        await daycare.save();

        return daycare;
    } catch (error) {
        if (files) {
            await deleteUploadedFiles(files);
        }
        throw error;
    }
};

// Delete single photo by ID/filename
export const deleteDaycarePhotoService = async (req: Request) => {
    const caretakerId = req.caretaker?.caretakerId;
    const photoId = req.params.photoId;

    if (!caretakerId) throw new Error("Caretaker authentication required");
    if (!photoId) throw new Error("Photo ID is required");

    const daycare = await Daycare.findOne({ caretakerId });
    if (!daycare) throw new Error("Daycare not found");

    const photoIndex = daycare.photos.findIndex(
        (p: any) => p._id?.toString() === photoId || path.basename(p.url) === photoId
    );

    if (photoIndex === -1) {
        throw new Error("Photo not found in daycare profile");
    }

    const [deletedPhoto] = daycare.photos.splice(photoIndex, 1);

    if (deletedPhoto?.url && deletedPhoto.url.startsWith("/uploads/daycare/photos/")) {
        const filePath = path.join(
            process.cwd(),
            "src/uploads/daycare/photos",
            path.basename(deletedPhoto.url)
        );
        try {
            await fs.unlink(filePath);
        } catch {
            // ignore
        }
    }

    await daycare.save();
    return daycare;
};
