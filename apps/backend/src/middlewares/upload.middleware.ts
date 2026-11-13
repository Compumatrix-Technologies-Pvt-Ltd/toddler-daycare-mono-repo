import multer from "multer";
import path from "path";
import fs from "fs";
import { Document } from "mongoose";

//Create upload directories
const photosDir = path.join(
    process.cwd(),
    "src/uploads/daycare/photos"
);

const documentDir = path.join(
    process.cwd(),
    "src/uploads/daycare/documents"
);

[photosDir, documentDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
});

//Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "photos") {
            cb(null, photosDir);
        } else if (file.fieldname === "workPermit") {
            cb(null, documentDir);
        } else {
            cb(new Error("Invalid file field"), " ");
        }
    },

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}` + path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName)
    },
});

//File Validation
const fileFilter: multer.Options["fileFilter"] = (
    req,
    file,
    cb
) => {
    if (file.fieldname === "photos") {
        const allowedImages = ["image/jpeg", "image/png", "image/webp"];

        if (allowedImages.includes(file.mimetype)) {
            return cb(null, true)
        }

        return cb(new Error("Only JPG, PNG, and WebP images are Allowed"));
    }

    if (file.fieldname === "workPermit") {
        const allowedPermitTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];
        if (allowedPermitTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        return cb(new Error("Work permit must be a PDF, DOC, DOCX, JPG, or PNG document"));
    }

    cb(new Error("Unexpected file field"));
};


//Multer Configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 11,
        fileSize: 10 * 1024 * 1024,
    },
});

//Upload fields
export const daycareUpload = upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "workPermit", maxCount: 1 },
])