import Admin from "@/modules/admin/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "@/types/admin/admin";

const generateToken = (adminId: string, role: string) => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is missing");
    }

    return jwt.sign({ adminId, role }, secret, {
        expiresIn: "7d",
    });
};

//Register
export const registerService = async (data: RegisterInput) => {
    const { name, email, password } = data;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const admin = await Admin.create({
        name,
        email,
        password: hashedPassword,
    });

    const adminId = String(admin._id);
    const token = generateToken(adminId, admin.role);

    return {
        admin: {
            id: adminId,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
        token,
    };
};

//Login
export const loginService = async (data: LoginInput) => {
    const { email, password } = data;

    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
        throw new Error("Invalid email or Password");
    }

    if (!admin.isActive) {
        throw new Error("Your account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        admin.password
    );
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }

    const adminId = String(admin._id);
    const token = generateToken(adminId, admin.role);

    return {
        admin: {
            id: adminId,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
        token,
    };
};

//get profile
export const profileService = async (adminId: string) => {
    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
        throw new Error("Admin not Found");
    }

    return admin;
};
