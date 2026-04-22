import express from "express";
import Cruise from "../models/Cruise";
import Booking from "../models/Booking";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

// 🔹 Get all cruises
router.get("/cruises", async (_, res) => {
    const cruises = await Cruise.find().sort({ createdAt: -1 });
    res.json(cruises);
});

// 🔹 Create cruise
router.post("/cruises", verifyToken, async (req: AuthRequest, res) => {
    const cruise = await Cruise.create({
        ...req.body,
        available_spots: req.body.capacity
    });
    res.json(cruise);
});

// 🔹 Update cruise
router.put("/cruises/:id", verifyToken, async (req, res) => {
    const cruise = await Cruise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cruise);
});

// 🔹 Delete cruise
router.delete("/cruises/:id", verifyToken, async (req, res) => {
    await Cruise.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
});

// 🔹 Get bookings (with user + cruise)
router.get("/bookings", async (_, res) => {
    const bookings = await Booking.find()
        .populate("cruise", "name")
        .populate("user", "name email");

    res.json(bookings);
});

// 🔹 Update booking status
router.put("/bookings/:id", async (req, res) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
    );
    res.json(booking);
});

router.delete("/bookings/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Access denied" });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: "Booking not found" });
        }

        // ✅ INCREASE AVAILABLE SPOTS
        await Cruise.findByIdAndUpdate(booking.cruise, {
            $inc: { available_spots: booking.passenger_count }
        });

        await booking.deleteOne();

        res.json({ msg: "Booking deleted and slots updated" });
    } catch {
        res.status(500).json({ msg: "Delete failed" });
    }
});

router.put("/bookings/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Access denied" });
        }

        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.json(booking);
    } catch {
        res.status(500).json({ msg: "Update failed" });
    }
});
export default router;