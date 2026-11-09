import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try {
        const mongoURL = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;

        if (!mongoURL) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(mongoURL);

        console.log("MongoDB connected successfully")
    }
    catch (err) {
        console.log("MongoDB connected Failed : ", err)
        process.exit(1);
    }
}


export default connectDB