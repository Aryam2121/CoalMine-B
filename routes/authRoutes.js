import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp, sendOtpEmail, saveOtpToUser } from "../utils/otpUtils.js";
import passport from "../config/passport.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "aura";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Function to verify Google token
async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error("Invalid Google token");
  }
}

// 🟢 **Signup Route**
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields (name, email, password, role) are required" });
  }

  if (!["worker", "supervisor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role. Choose from 'worker', 'supervisor', or 'admin'" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });

    await newUser.save();

    // Generate and send OTP
    const otp = generateOtp();
    await saveOtpToUser(newUser._id, otp);
    await sendOtpEmail(email, otp);

    res.status(201).json({ message: "User registered successfully. OTP sent to email.", role: newUser.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🟢 **Login Route**
router.post("/login", async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || (!password && !otp)) {
    return res.status(400).json({ message: "Email and either password or OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (otp) {
      const now = new Date();
      if (!user.otpExpiry || user.otpExpiry < now) return res.status(400).json({ message: "OTP has expired. Request a new one." });

      if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "OTP login successful", token });
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid password" });

      const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

      return res.status(200).json({ message: "Password login successful", token, role: user.role });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🟢 **Send OTP Route**
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    if (user.otp && user.otpExpiry > now) {
      return res.status(200).json({ message: "OTP already sent and still valid. Please check your email." });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Error sending OTP", details: error.message });
  }
});

// 🟢 **Verify OTP Route**
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  user.otp = null;
  await user.save();

  res.status(200).json({ message: "OTP verified successfully" });
});

// 🟢 **Google OAuth Route**
router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) throw new Error("Token missing");

    // Verify the Google token
    const payload = await verifyGoogleToken(token);
    const { sub: googleId, name, email } = payload;

    // Check if the Google ID is valid
    if (!googleId) {
      return res.status(400).send({ message: "Invalid Google ID or token." });
    }

    // Check if the user already exists by email
    let user = await User.findOne({ email });

    if (user) {
      // If the user exists and doesn't have a Google ID, update it
      if (!user.googleId) {
        user.googleId = googleId; // Assign googleId only if it's missing
        await user.save();
      }

      // Generate JWT token for the existing user
      const authToken = jwt.sign(
        { userId: user._id, email: user.email, googleId: user.googleId || null },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ message: "User logged in successfully", token: authToken });
    }

    // If the user doesn't exist, create a new user with the Google ID
    user = new User({
      name,
      email,
      googleId, // Only save googleId if it's present
      role: "worker",
    });
    await user.save();

    // Generate JWT token for the newly created user
    const authToken = jwt.sign(
      { userId: user._id, email: user.email, googleId: user.googleId || null },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "User registered successfully", token: authToken });

  } catch (error) {
    console.error("Google OAuth Error:", error);
    return res.status(400).json({ message: "Invalid Google token or error processing the request" });
  }
});


// 🟢 **Google OAuth Callback**
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

export default router;
