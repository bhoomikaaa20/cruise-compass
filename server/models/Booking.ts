import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
    user: mongoose.Types.ObjectId;
    cruise: mongoose.Types.ObjectId;
    passenger_count: number;
    travel_date: string;
    total_price: number;
    status: "pending" | "confirmed" | "cancelled";
}

const bookingSchema = new Schema<IBooking>({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    cruise: { type: Schema.Types.ObjectId, ref: "Cruise" },
    passenger_count: Number,
    travel_date: String,
    total_price: Number,
    status: { type: String, default: "pending" }
}, { timestamps: true });

export default mongoose.model<IBooking>("Booking", bookingSchema);