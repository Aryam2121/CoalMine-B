import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import winston from 'winston';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';

// Import Routes
import alertRoutes from './routes/alerts.js';
import maintenanceRoutes from './routes/maintenance.js';
import mineRoutes from './routes/mines.js';
import safetyPlanRoutes from './routes/safetyPlans.js';
import shiftLogRoutes from './routes/shiftLogs.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import coalMineRoutes from './routes/coalMineRoutes.js';
import "./config/passport.js";
import locationRoutes from './routes/locationRoutes.js';
import notficationRoutes from './routes/notificationRoutes.js';
import Prodrouter from './routes/productivityRoutes.js';
import Resourceroutes from './routes/resourceRoutes.js';
import AttendanceRoutes from "./routes/attendanceRoutes.js";
import AuditRoutes from "./routes/AuditRoutes.js";
const app = express();

// Set up logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI); // No need for deprecated options
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit process if MongoDB connection fails
  }
};


// Initialize MongoDB connection
connectDB();

// Initialize session and passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/notifications',notficationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', maintenanceRoutes);
app.use('/api', coalMineRoutes);
app.use('/api/mines', mineRoutes);
app.use('/api/safety-plans', safetyPlanRoutes);
app.use('/api', shiftLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', locationRoutes);
app.use('/api/prod', Prodrouter);
app.use('/api/resource', Resourceroutes);
app.use('/api',AttendanceRoutes);
app.use('/api',AuditRoutes);
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
