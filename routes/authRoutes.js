import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp, sendOtpEmail } from "../utils/otpUtils.js";
import passport from "../config/passport.js";
import { OAuth2Client } from "google-auth-library";
import { protect } from "../middleware/authMiddleware.js";
import { ALL_ROLES, SIGNUP_ROLES, canSignupAs, normalizeRole } from "../config/roles.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const VALID_ROLES = ALL_ROLES;

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const issueAuthResponse = (user, res, expiresIn = "7d") => {
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn }
  );
  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    role: user.role,
    user: formatUser(user),
  });
};

// Save OTP to user with hashing
async function saveOtpToUser(userId, otp) {
  const hashedOtp = await bcrypt.hash(otp, 10);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        otp: hashedOtp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      },
    }
  );
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
    if (!canSignupAs(role)) {
      return res.status(400).json({
        message: "Invalid role for registration. Admin accounts must be created by an administrator.",
        allowedRoles: SIGNUP_ROLES,
      });
    }

    // Check if a user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Plain password — User model pre-save hook performs single bcrypt hash
    const newUser = new User({ name, email, password, role, googleId: googleId || null });
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
    const user = await User.findOne({ email }).select('+password +otp +otpExpiry');
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
    return issueAuthResponse(user, res, "7d");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, (req, res) => {
  res.status(200).json({ success: true, user: formatUser(req.user) });
});

/** Public — roles available on signup form */
router.get("/signup-roles", (req, res) => {
  res.json({
    roles: SIGNUP_ROLES.map((value) => ({
      value,
      label: value,
    })),
  });
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
    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ error: "User not found" });

    await verifyOtp(user, otp);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT token after OTP verification
    return issueAuthResponse(user, res, "7d");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


const buildGoogleDisplayName = (name, email, googleId) => {
  let displayName = (name || "").trim();
  if (displayName.length < 3) {
    displayName = (email?.split("@")[0] || "").replace(/[._-]/g, " ").trim();
  }
  if (displayName.length < 3) {
    displayName = `Miner ${String(googleId).slice(-6)}`;
  }
  return displayName.slice(0, 100);
};

// Google OAuth — login or auto-register first-time users
router.post("/google", async (req, res) => {
  try {
    const { token: googleIdToken, role } = req.body;
    if (!googleIdToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const payload = await verifyGoogleToken(googleIdToken);
    const { sub: googleId, name, email } = payload;

    if (!googleId || !email) {
      return res.status(400).json({ message: "Invalid Google account data." });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.name || user.name.length < 3) {
          user.name = buildGoogleDisplayName(name, email, googleId);
        }
        await user.save();
      }
    } else {
      isNewUser = true;
      if (!role) {
        return res.status(400).json({
          needsRole: true,
          message: "Select your role to complete Google sign-up.",
          allowedRoles: SIGNUP_ROLES,
        });
      }
      if (!canSignupAs(role)) {
        return res.status(400).json({
          message: "Cannot register as an administrator via Google. Choose Worker, Inspector, Safety Manager, or Shift Incharge.",
          allowedRoles: SIGNUP_ROLES,
        });
      }
      const selectedRole = role;
      user = new User({
        name: buildGoogleDisplayName(name, email, googleId),
        email: email.toLowerCase().trim(),
        googleId,
        role: selectedRole,
      });
      await user.save();
    }

    const authToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? "Account created with Google" : "Login successful",
      isNewUser,
      token: authToken,
      role: user.role,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    const isTokenError =
      error.message?.includes("Token used too late") ||
      error.message?.includes("Wrong recipient") ||
      error.message?.includes("audience");
    return res.status(400).json({
      message: isTokenError
        ? "Google sign-in expired or misconfigured. Check that the same Google Client ID is used on frontend and backend."
        : error.message || "Google authentication failed",
    });
  }
});


// Google OAuth Callback
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});

export default router;
