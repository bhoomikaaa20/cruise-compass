import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes"
import adminRoutes from "./routes/adminRoutes";
import cruiseRoutes from "./routes/cruiseRoutes";
import bookingRoutes from "./routes/bookingRoutes";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cruises", cruiseRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));