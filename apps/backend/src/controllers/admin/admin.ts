import { Request, Response } from "express";
import { registerService, loginService, profileService } from "@/services/admin/admin";
import Daycare from "@/modules/caretaker/daycare";

//Register controller
export const register = async (req: Request, res: Response) => {
    try {
        const result = await registerService(req.body);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

//Login controller
export const login = async (req: Request, res: Response) => {
    try {
        const result = await loginService(req.body);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: error.message,
        });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const result = await profileService(req.admin!.adminId);

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all daycares for admin
export const getAllDaycaresAdmin = async (req: Request, res: Response) => {
    try {
        const daycares = await Daycare.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: daycares,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch daycares",
        });
    }
};

// Update daycare verification status (approved / rejected / pending)
export const updateDaycareStatusAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const daycare = await Daycare.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!daycare) {
            return res.status(404).json({
                success: false,
                message: "Daycare not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Daycare status updated to ${status}`,
            data: daycare,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update daycare status",
        });
    }
};
