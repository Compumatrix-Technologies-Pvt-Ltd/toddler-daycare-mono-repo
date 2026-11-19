import { Request, Response } from 'express';
import {
    registerService,
    loginService,
    forgotPasswordService,
    verifyResetCodeService,
    resetPasswordService,
} from '@/services/caretaker/caretaker';
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

// Forgot Password controller
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body || {};
        const result = await forgotPasswordService(email);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to process forgot password request",
        });
    }
};

// Verify 6-digit Code controller
export const verifyResetCode = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body || {};
        const result = await verifyResetCodeService(email, code);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Invalid or expired verification code",
        });
    }
};

// Reset Password controller
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body || {};
        const result = await resetPasswordService(email, code, newPassword);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to reset password",
        });
    }
};