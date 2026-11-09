import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "@/types/admin/admin";

export const adminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required",
            });
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            throw new Error("JWT_ACCESS_SECRET is missing");
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required",
            });
        }

        const decoded = jwt.verify(token, secret) as {
            adminId: string;
            role: string;
        };

        req.admin = {
            adminId: decoded.adminId,
            role: decoded.role,
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
