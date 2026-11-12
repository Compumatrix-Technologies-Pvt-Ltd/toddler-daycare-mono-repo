import { Request, Response } from 'express';
import { registerService, loginService } from '@/services/caretaker/caretaker';

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