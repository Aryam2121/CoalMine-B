import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database (without password)
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(404).json({ error: "User not found" });
    }

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check admin role
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Access denied, admin only" });
  }
};
