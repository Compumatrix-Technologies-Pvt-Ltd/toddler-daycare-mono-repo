import { Request, Response } from 'express';
import { registerService, loginService } from '@/services/caretaker/caretaker';
import Caretaker from "@/modules/caretaker/auth";

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
        })
    }
}

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
        return res.status(error.statusCode || 401).json({
            success: false,
            code: error.code,
            message: error.message,
        })
    }
}

// Token Verification & Current Profile controller (protected by caretakerMiddleware)
export const getProfile = async (req: Request, res: Response) => {
    try {
        const caretakerId = req.caretaker?.caretakerId;
        if (!caretakerId) {
            return res.status(401).json({
                success: false,
                message: "Valid authorization token required",
            });
        }

        const caretaker = await Caretaker.findById(caretakerId).select("-password");
        if (!caretaker) {
            return res.status(401).json({
                success: false,
                message: "Caretaker not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            data: {
                caretaker: {
                    id: caretaker._id.toString(),
                    email: caretaker.email,
                },
            },
        });
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};