import mongoose, { Schema, Document } from "mongoose";

export interface Iadmin extends Document {
    name: string;
    email: string;
    password: string;
    role: "admin" | "superadmin";
    isActive: boolean;
}

const adminSchema = new Schema<Iadmin>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["admin", "superadmin"],
            default: "admin",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Admin = mongoose.model<Iadmin>("Admin", adminSchema);

export default Admin;
