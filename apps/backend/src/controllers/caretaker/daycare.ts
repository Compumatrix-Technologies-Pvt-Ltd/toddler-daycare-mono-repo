import { Request, Response, NextFunction } from "express";
import {
    createDaycareService,
    getDaycareService,
    updatedDaycareService,
    allDaycareService,
    deleteDaycarePhotoService,
} from "@/services/caretaker/daycare";
import { emitDaycareUpdated } from "@/config/socket";

export const createDaycare = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const daycare = await createDaycareService(req);
        const daycareDoc = daycare as any;

        emitDaycareUpdated({
            daycareId: String(daycareDoc?._id || ""),
            ...(daycareDoc?.caretakerId ? { caretakerId: String(daycareDoc.caretakerId) } : {}),
            status: daycareDoc?.status,
            action: "created",
        });

        return res.status(201).json({
            success: true,
            message: "Daycare created successfully",
            data: daycare,
        });

    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create daycare",
        });
    }
}

//Get daycare
export const getDaycare = async (req: Request, res: Response) => {
    try {
        const daycare = await getDaycareService(req);
        return res.status(200).json({
            success: true,
            message: "Daycare fetched successfully",
            data: daycare,
        });
    } catch (error: any) {
        return res.status(error.message === "Daycare not found" ? 404 : 400).json({
            success: false,
            message: error.message,
        });
    }
}

//Get all
export const allDaycare = async (req: Request, res: Response) => {
    try {
        const daycare = await allDaycareService(req);
        return res.status(200).json({
            success: true,
            data: daycare
        });
    } catch (error: any) {
        return res.status(error.message === "Daycare not found" ? 404 : 400).json({
            success: false,
            message: error.message,
        });
    }
}

// UPDATE daycare
export const updateDaycare = async (req: Request, res: Response) => {
    try {
        const daycare = await updatedDaycareService(req);

        emitDaycareUpdated({
            daycareId: String(daycare._id),
            ...(daycare.caretakerId ? { caretakerId: String(daycare.caretakerId) } : {}),
            status: daycare.status,
            action: "updated",
        });

        return res.status(200).json({
            success: true,
            message: "Daycare updated successfully",
            data: daycare,
        });
    } catch (error: any) {
        const statusCode = error.message === "Daycare not found" ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

// DELETE single photo
export const deleteDaycarePhoto = async (req: Request, res: Response) => {
    try {
        const daycare = await deleteDaycarePhotoService(req);
        return res.status(200).json({
            success: true,
            message: "Photo deleted successfully",
            data: daycare,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
