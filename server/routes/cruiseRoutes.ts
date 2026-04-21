import express from "express";
import Cruise from "../models/Cruise";

const router = express.Router();

// 🔹 Get active cruises (for homepage)
router.get("/", async (req, res) => {
    try {
        const cruises = await Cruise.find()
            .sort({ departure_date: 1 });

        res.json(cruises);
    } catch (err) {
        res.status(500).json({ msg: "Error fetching cruises" });
    }
});

// 🔹 Get single cruise
router.get("/:id", async (req, res) => {
    try {
        const cruise = await Cruise.findById(req.params.id);
        res.json(cruise);
    } catch {
        res.status(500).json({ msg: "Error fetching cruise" });
    }
});

export default router;