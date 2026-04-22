import express from "express";
import Booking from "../models/Booking";
import Cruise from "../models/Cruise";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

// 🔹 Create booking
router.post("/", verifyToken, async (req: AuthRequest, res) => {
    try {
        const {
            cruiseId,
            passengers,
            cabin,
            travelDate,
            totalPrice
        } = req.body;

        const cruise = await Cruise.findById(cruiseId);

        if (!cruise) return res.status(404).json({ msg: "Cruise not found" });

        if (passengers > cruise.available_spots) {
            return res.status(400).json({ msg: "Not enough spots" });
        }

        const booking = await Booking.create({
            user: req.user.id,
            cruise: cruiseId,
            passenger_count: passengers,
            travel_date: travelDate,
            total_price: totalPrice,
            status: "confirmed"
        });

        // 🔹 update availability
        cruise.available_spots -= passengers;
        await cruise.save();

        res.json(booking);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 🔹 Get logged-in user's bookings
router.get("/my", verifyToken, async (req: AuthRequest, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("cruise");

        res.json(bookings);
    } catch {
        res.status(500).json({ msg: "Error fetching bookings" });
    }
});

// 🔹 Cancel booking
router.put("/:id/cancel", verifyToken, async (req: AuthRequest, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: "Booking not found" });
        }

        if (booking.status === "cancelled") {
            return res.json({ msg: "Already cancelled" });
        }

        // ✅ UPDATE STATUS
        booking.status = "cancelled";
        await booking.save();

        // ✅ INCREASE AVAILABLE SPOTS
        await Cruise.findByIdAndUpdate(booking.cruise, {
            $inc: { available_spots: booking.passenger_count }
        });

        res.json({ msg: "Booking cancelled & slots updated" });
    } catch {
        res.status(500).json({ msg: "Cancel failed" });
    }
});

export default router;