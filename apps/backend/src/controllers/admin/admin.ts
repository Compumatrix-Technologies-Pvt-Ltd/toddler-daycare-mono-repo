import { Request, Response } from "express";
import { registerService, loginService, profileService } from "@/services/admin/admin";
import Daycare from "@/modules/caretaker/daycare";
import Caretaker from "@/modules/caretaker/auth";
import { Inquiry } from "@/modules/inquiry/inquiry";
import { emailService } from "@/services/email/emailService";
import { emitDaycareUpdated } from "@/config/socket";

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

// Get live dashboard KPI stats for admin
export const getDashboardStatsAdmin = async (req: Request, res: Response) => {
    try {
        const [
            totalDaycares,
            pendingPermits,
            verifiedCaretakers,
            demandInquiries,
            allDaycares,
        ] = await Promise.all([
            Daycare.countDocuments({}),
            Daycare.countDocuments({ status: "pending" }),
            Daycare.countDocuments({ status: "approved" }),
            Inquiry.countDocuments({}),
            Daycare.find({}).sort({ createdAt: -1 }),
        ]);

        const totalCapacity = allDaycares.reduce((sum, d) => {
            const cap = d.workPermit?.authorizedCapacity ?? d.operations?.maxCapacity ?? 0;
            return sum + (typeof cap === "number" && Number.isFinite(cap) ? cap : 0);
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                totalDaycares,
                pendingPermits,
                verifiedCaretakers,
                demandInquiries,
                totalCapacity,
                applications: allDaycares,
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch admin dashboard statistics",
        });
    }
};

// Update daycare verification status (approved / rejected / pending) along with verified work permit details
export const updateDaycareStatusAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            status,
            workPermitDetails,
            permitId,
            registrationDate,
            expirationDate,
            issuingAuthority,
            authorizedCapacity,
            adminNotes,
        } = req.body || {};

        if (!status || !["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const details = workPermitDetails || {};
        const updateDoc: Record<string, any> = { status };

        const finalPermitId = details.permitId ?? permitId;
        const finalRegDate = details.registrationDate ?? registrationDate;
        const finalExpDate = details.expirationDate ?? expirationDate;
        const finalAuthority = details.issuingAuthority ?? issuingAuthority;
        const finalCapacity = details.authorizedCapacity ?? authorizedCapacity;
        const finalNotes = details.adminNotes ?? adminNotes;

        // Validation: Ensure permitId / permitNumber is unique across other daycares
        if (finalPermitId && String(finalPermitId).trim()) {
            const trimmedPermitId = String(finalPermitId).trim();
            const duplicate = await Daycare.findOne({
                _id: { $ne: id },
                "workPermit.permitId": { $regex: new RegExp(`^${trimmedPermitId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
            }).select("name workPermit.permitId");

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: `Permit Number "${trimmedPermitId}" is already assigned to "${duplicate.name || "another daycare"}". Permit numbers must be unique.`,
                    errors: {
                        permitId: ["Permit number is already registered to another daycare."],
                    },
                });
            }
            updateDoc["workPermit.permitId"] = trimmedPermitId;
        }
        if (finalRegDate !== undefined) {
            updateDoc["workPermit.registrationDate"] = String(finalRegDate).trim();
        }
        if (finalExpDate !== undefined) {
            updateDoc["workPermit.expirationDate"] = String(finalExpDate).trim();
        }
        if (finalAuthority !== undefined) {
            updateDoc["workPermit.issuingAuthority"] = String(finalAuthority).trim();
        }
        if (finalNotes !== undefined) {
            updateDoc["workPermit.adminNotes"] = String(finalNotes).trim();
        }
        if (finalCapacity !== undefined && finalCapacity !== "" && !isNaN(Number(finalCapacity))) {
            updateDoc["workPermit.authorizedCapacity"] = Number(finalCapacity);
            updateDoc["operations.maxCapacity"] = Number(finalCapacity);
        }
        if (status === "approved") {
            updateDoc["workPermit.approvedAt"] = new Date();
        }

        const daycare = await Daycare.findByIdAndUpdate(
            id,
            { $set: updateDoc },
            { new: true }
        );

        if (!daycare) {
            return res.status(404).json({
                success: false,
                message: "Daycare not found",
            });
        }

        // Send approval/rejection notification email to caretaker
        let emailResults: any[] = [];
        if (status === "approved" || status === "rejected") {
            try {
                const caretaker = daycare.caretakerId
                    ? await Caretaker.findById(daycare.caretakerId).select("email")
                    : null;

                const recipients = Array.from(
                    new Set(
                        [caretaker?.email, daycare.contact?.email]
                            .map((e) => (e ? String(e).trim().toLowerCase() : ""))
                            .filter(Boolean)
                    )
                );

                if (recipients.length > 0) {
                    emailResults = await Promise.all(
                        recipients.map((recipient) =>
                            emailService.sendDaycareStatusNotificationToCaretaker(recipient, {
                                status: status as "approved" | "rejected",
                                daycareName: daycare.daycareName,
                                caregiverName: daycare.caregiverName,
                                permitId: daycare.workPermit?.permitId,
                                registrationDate: daycare.workPermit?.registrationDate,
                                expirationDate: daycare.workPermit?.expirationDate,
                                issuingAuthority: daycare.workPermit?.issuingAuthority,
                                authorizedCapacity: daycare.workPermit?.authorizedCapacity,
                                adminNotes: daycare.workPermit?.adminNotes,
                            })
                        )
                    );
                }
            } catch (emailErr: any) {
                console.error(
                    "[AdminController] Failed to dispatch daycare status email:",
                    emailErr?.message || emailErr
                );
            }
        }

        emitDaycareUpdated({
            daycareId: String(daycare._id),
            ...(daycare.caretakerId ? { caretakerId: String(daycare.caretakerId) } : {}),
            status: daycare.status,
            action: "status_changed",
        });

        return res.status(200).json({
            success: true,
            message: `Daycare status updated to ${status}`,
            data: daycare,
            emailNotification: emailResults,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update daycare status",
        });
    }
};
