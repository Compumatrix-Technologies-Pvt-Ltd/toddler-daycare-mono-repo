import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Caretaker from "@/modules/caretaker/auth";

interface CaretakerTokenPayload {
    caretakerId: string
}

export const caretakerMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required",
            });
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            throw new Error("JWT_ACCESS_SECREP is missing");
        }

        const decoded = jwt.verify(
            token, secret
        ) as CaretakerTokenPayload;

        const caretaker = await Caretaker.findById(decoded.caretakerId);

        if (!caretaker) {
            return res.status(401).json({
                succes: false,
                message: "Caretaker not Found",
            });
        };

        req.caretaker = {
            caretakerId: caretaker._id.toString(),
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}