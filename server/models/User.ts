import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
}

const userSchema = new Schema<IUser>({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String, default: "user" }
}, { timestamps: true });

export default mongoose.model<IUser>("User", userSchema);