import Caretaker from "@/modules/caretaker/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "@/types/caretaker/caretaker";

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
