import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

// REGISTER
router.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashed,
            name
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json(err);
    }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json(err);
    }
});


router.post("/upload", verifyToken, upload.single("image"), (req, res) => {
    const fileUrl = `http://localhost:5000/uploads/${req.file?.filename}`;
    res.json({ url: fileUrl });
});

// GET CURRENT USER
router.get("/me", verifyToken, async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

export default router;