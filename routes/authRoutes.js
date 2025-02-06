import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp, sendOtpEmail } from "../utils/otpUtils.js";
import passport from "../config/passport.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Save OTP to user with hashing
async function saveOtpToUser(userId, otp) {
  const hashedOtp = await bcrypt.hash(otp, 10);
  await User.findByIdAndUpdate(userId, {
    otp: hashedOtp,
    otpExpiry: Date.now() + 5 * 60 * 1000,
  });
}

// Verify OTP
async function verifyOtp(user, otp) {
  if (!user.otpExpiry || user.otpExpiry < Date.now()) {
    throw new Error("OTP expired. Request a new one.");
  }
  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) {
    throw new Error("Invalid OTP");
  }
}

// Verify Google Token
async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role , googleId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["worker", "supervisor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if a user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role, googleId: googleId || null });
    await newUser.save();

    const otp = generateOtp();
    await saveOtpToUser(newUser._id, otp);
    await sendOtpEmail(email, otp);

    res.status(201).json({ message: "User registered successfully. OTP sent to email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (otp) {
      await verifyOtp(user, otp);
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else {
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }
    const token = jwt.sign({ userId: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send OTP Route
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    await saveOtpToUser(user._id, otp);
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP Route
// Verify OTP Route
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    await verifyOtp(user, otp);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT token after OTP verification
    const token = jwt.sign({ userId: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Google OAuth Route
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);
    const { sub: googleId, name, email } = payload;
    if (!googleId || !email) {
      return res.status(400).send({ message: "Invalid Google ID or token." });
    }

    // Check if the user exists with Google ID or email
    let user = await User.findOne({ email });
    
    if (user) {
      if (!user.googleId) {
        // Instead of rejecting, allow linking of Google login
        user.googleId = googleId;
        await user.save();
      }
    }
    
    

    if (!user) {
      // If no user found with this email, create a new one with Google ID
      user = new User({ name, email, googleId, role: "worker" });
      await user.save();
    }

    // Generate JWT token for the user
    const authToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: "User logged in successfully", token: authToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Google OAuth Callback
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

export default router;
