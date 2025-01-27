import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp, sendOtpEmail, saveOtpToUser } from "../utils/otpUtils.js";
import passport from "../config/passport.js";
import { OAuth2Client } from "google-auth-library";
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Add a secure secret key in .env
const client = new OAuth2Client("415677898308-qbe137kknqc0d3j8hnf2gbrvs47k95aa.apps.googleusercontent.com");

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: "415677898308-qbe137kknqc0d3j8hnf2gbrvs47k95aa.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  return payload;  // This contains the user info from Google
}

// User Signup Route
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Save to database
    await newUser.save();

    // Generate OTP and send to user's email
    const otp = generateOtp();
    await sendOtpEmail(email, otp);
    await saveOtpToUser(newUser._id, otp);

    res.status(201).json({ message: "User registered successfully. OTP sent to email for verification." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// User Login Route (Password or OTP)
router.post("/login", async (req, res) => {
  const { email, password, otp } = req.body;

  // Validate input
  if (!email || (!password && !otp)) {
    return res.status(400).json({ message: "Email and either password or OTP are required" });
  }

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (otp) {
      // OTP Login
      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Clear OTP after successful validation
      user.otp = null;
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ message: "OTP login successful", token });
    }

    if (password) {
      // Password-based login
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ message: "Password login successful", token });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Send OTP for Signup or Login (for email verification)
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = generateOtp();
  await sendOtpEmail(email, otp);
  await saveOtpToUser(user._id, otp); // Save OTP for later validation
  res.status(200).json({ message: 'OTP sent to your email' });
});

// Verify OTP for Login or Signup
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  user.otp = null; // Clear OTP after successful validation
  await user.save();
  res.status(200).json({ message: 'OTP verified successfully' });
});

// Google OAuth Route and Callback
router.post("/google", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send({ message: 'Token is missing' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '415677898308-qbe137kknqc0d3j8hnf2gbrvs47k95aa.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const { sub, name, email } = payload;

    let user = await User.findOne({ googleId: sub });

    if (!user) {
      user = new User({
        name,
        email,
        googleId: sub,
      });

      await user.save();
    }

    res.status(200).send({ message: 'User registered successfully with Google!' });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(400).send({ message: 'Invalid Google token or error occurred.' });
  }
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

export default router;
