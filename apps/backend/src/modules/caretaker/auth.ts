import mongoose, { Schema, Document } from "mongoose";

export interface ICaretaker extends Document {
    email: string;
    password: string;
    isActive: boolean;
    resetPasswordCode?: string;
    resetPasswordExpires?: Date;
}

const caretakerSchema = new Schema<ICaretaker>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            require: true,
            select: false,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        resetPasswordCode: {
            type: String,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
        },
    },
    { timestamps: true }
)

const Caretaker = mongoose.model<ICaretaker>("Caretaker", caretakerSchema);

export default Caretaker;