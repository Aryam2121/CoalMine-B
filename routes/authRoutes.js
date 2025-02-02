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
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: "415677898308-qbe137kknqc0d3j8hnf2gbrvs47k95aa.apps.googleusercontent.com",
  });
  return ticket.getPayload(); // Contains Google user info
}

// 🟢 **Signup Route**
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body; // Include role

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
    const newUser = new User({ name, email, password: hashedPassword, role }); // Assign role

    await newUser.save();

    // Generate OTP
    const otp = generateOtp();
    await sendOtpEmail(email, otp);
    await saveOtpToUser(newUser._id, otp);

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
      // ✅ Check OTP expiry
      const now = new Date();
      if (user.otpExpiry < now) return res.status(400).json({ message: "OTP has expired. Request a new one." });

      if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

      // ✅ Clear OTP after successful login
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

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Check if OTP is still valid
    const now = new Date();
    if (user.otp && user.otpExpiry > now) {
      return res.status(200).json({ message: "OTP already sent. Please wait before requesting a new one." });
    }

    // ✅ Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(now.getTime() + 5 * 60 * 1000); // ✅ OTP expires in 5 minutes

    // ✅ Save OTP and expiry time to DB
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully!", otp });
  } catch (error) {
    res.status(500).json({ error: "Error sending OTP", details: error.message });
  }
});

// 🟢 **Verify OTP Route**
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  user.otp = null;
  await user.save();
  
  res.status(200).json({ message: 'OTP verified successfully' });
});


// 🟢 **Google OAuth Route**
router.post("/google", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send({ message: 'Token is missing' });

  try {
    const payload = await verifyGoogleToken(token);
    const { sub: googleId, name, email } = payload;
  
    if (!googleId) {
      return res.status(400).send({ message: 'Google ID is missing' });
    }
  
    let user = await User.findOne({ email });
  
    if (!user) {
      user = new User({ name, email, googleId, role: "worker" }); // Default role for Google signups
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  
    // Generate JWT Token
    const authToken = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  
    res.status(200).json({ message: "Google login successful", token: authToken });
  
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(400).send({ message: 'Invalid Google token or error processing the request' });
  }
  
});

// 🟢 **Google OAuth Callback**
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

export default router;
