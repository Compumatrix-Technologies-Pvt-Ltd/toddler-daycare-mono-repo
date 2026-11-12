import Caretaker from "@/modules/caretaker/auth";
import Daycare from "@/modules/caretaker/daycare";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "@/types/caretaker/caretaker";

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
