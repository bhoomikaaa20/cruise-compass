import mongoose, { Schema, Document } from "mongoose";

export interface ICruise extends Document {
    name: string;
    ship_name?: string;
    destination: string;
    description?: string;
    duration_nights: number;
    price_per_person: number;
    departure_port: string;
    return_port: string;
    route: string[];
    departure_date: string;
    return_date: string;
    capacity: number;
    available_spots: number;
    facilities: string[];
    image_url?: string;
}

const cruiseSchema = new Schema<ICruise>({
    name: String,
    ship_name: String,
    destination: String,
    description: String,
    duration_nights: Number,
    price_per_person: Number,
    departure_port: String,
    return_port: String,
    route: [String],
    departure_date: String,
    return_date: String,
    capacity: Number,
    available_spots: Number,
    facilities: [String],
    image_url: String,
}, { timestamps: true });

export default mongoose.model<ICruise>("Cruise", cruiseSchema);