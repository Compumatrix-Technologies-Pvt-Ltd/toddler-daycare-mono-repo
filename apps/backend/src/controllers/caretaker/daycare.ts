import { Request, Response, NextFunction } from "express";
import { createDaycareService, getDaycareService, updatedDaycareService } from "@/services/caretaker/daycare";

export const createDaycare = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const daycare = await createDaycareService(req);

        return res.status(201).json({
            success: true,
            message: "Daycare created successfully",
            data: daycare,
        });

    } catch (error) {
        next(error);
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


// UPDATE daycare
export const updateDaycare = async (req: Request, res: Response) => {
    try {
        const daycare = await updatedDaycareService(req);

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