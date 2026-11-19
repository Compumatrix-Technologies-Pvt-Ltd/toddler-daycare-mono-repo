import Caretaker from "@/modules/caretaker/auth";
import Daycare from "@/modules/caretaker/daycare";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "@/types/caretaker/caretaker";
import { emailService } from "../email/emailService.js";

const isDaycareProfileComplete = (daycare: any): boolean => {
    if (!daycare) return false;
    const hasLocation = Boolean(
        daycare.location?.street?.trim() &&
        daycare.location?.city?.trim() &&
        daycare.location?.latitude !== undefined &&
        daycare.location?.longitude !== undefined
    );
    const hasOperations = Boolean(
        daycare.daycareName?.trim() &&
        daycare.caregiverName?.trim() &&
        daycare.caregiverGender?.trim() &&
        daycare.operations?.operatingHours?.trim()
    );
    const hasContactPhotos = Boolean(
        daycare.contact?.email?.trim() &&
        daycare.contact?.phone?.trim() &&
        daycare.additionalDetails?.meals &&
        daycare.additionalDetails?.pets &&
        Array.isArray(daycare.photos) &&
        daycare.photos.length >= 1
    );
    const hasPermit = Boolean(
        daycare.workPermit?.url?.trim() || daycare.workPermit?.fileName?.trim()
    );
    return hasLocation && hasOperations && hasContactPhotos && hasPermit;
};

const generateToken = (caretakerId: string) => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is missing");
    }

    return jwt.sign({ caretakerId }, secret, {
        expiresIn: "7d",
    });
};

//Register
export const registerService = async (data: RegisterInput) => {
    const { email, password } = data;

    const existingCaretaker = await Caretaker.findOne({ email });
    if (existingCaretaker) {
        throw new Error("Caretaker already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const caretaker = await Caretaker.create({
        email,
        password: hashedPassword,
    });

    const caretakerId = String(caretaker._id);
    const token = generateToken(caretakerId);

    return {
        caretaker: {
            id: caretakerId,
            email: caretaker.email,
        },
        token,
    };
};

//Login
export const loginService = async (data: LoginInput) => {
    const { email, password } = data;

    const caretaker = await Caretaker.findOne({ email }).select("+password");

    if (!caretaker) {
        throw new Error("Invalid email or Password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        caretaker.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid Password");
    }

    const daycare = await Daycare.findOne({ caretakerId: caretaker._id });
    const isProfileComplete = isDaycareProfileComplete(daycare);

    // Block login while 100% profile is pending admin approval/rejection
    if (isProfileComplete && daycare?.status === "pending") {
        const reviewError: any = new Error(
            "Your daycare profile is 100% complete and currently under admin review. You can log in after an administrator approves or rejects your daycare."
        );
        reviewError.statusCode = 403;
        reviewError.code = "DAYCARE_UNDER_REVIEW";
        throw reviewError;
    }

    const caretakerId = String(caretaker._id);
    const token = generateToken(caretakerId);

    return {
        caretaker: {
            id: caretakerId,
            email: caretaker.email,
        },
        token,
        daycareStatus: daycare?.status || null,
        isProfileComplete,
    };
};

// Forgot Password - Generates & sends 6-digit verification code
export const forgotPasswordService = async (email: string) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
        throw new Error("Email address is required");
    }

    const caretaker = await Caretaker.findOne({ email: cleanEmail });
    if (!caretaker) {
        throw new Error("No caretaker account found with this email address");
    }

    // Generate random 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    caretaker.resetPasswordCode = code;
    caretaker.resetPasswordExpires = expires;
    await caretaker.save();

    // Send email with 6-digit code
    await emailService.sendPasswordResetCode(cleanEmail, code);

    return {
        success: true,
        message: "A 6-digit verification code has been dispatched to your email address.",
        email: cleanEmail,
        ...(process.env.NODE_ENV !== "production" ? { code } : {}),
    };
};

// Verify 6-digit code
export const verifyResetCodeService = async (email: string, code: string) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!cleanEmail || !cleanCode) {
        throw new Error("Email and 6-digit verification code are required");
    }

    const caretaker = await Caretaker.findOne({
        email: cleanEmail,
        resetPasswordCode: cleanCode,
        resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordCode +resetPasswordExpires");

    if (!caretaker) {
        throw new Error("Invalid or expired 6-digit verification code. Please request a new code.");
    }

    return {
        success: true,
        message: "Verification code is valid.",
    };
};

// Reset Password with verified code
export const resetPasswordService = async (
    email: string,
    code: string,
    newPassword: string
) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!cleanEmail || !cleanCode || !newPassword) {
        throw new Error("Email, verification code, and new password are required");
    }

    if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new Error(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
    }

    const caretaker = await Caretaker.findOne({
        email: cleanEmail,
        resetPasswordCode: cleanCode,
        resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordCode +resetPasswordExpires +password");

    if (!caretaker) {
        throw new Error("Invalid or expired 6-digit verification code. Please request a new code.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 8);
    caretaker.password = hashedPassword;
    caretaker.resetPasswordCode = undefined;
    caretaker.resetPasswordExpires = undefined;
    await caretaker.save();

    return {
        success: true,
        message: "Password has been reset successfully. Please log in with your new password.",
    };
};
