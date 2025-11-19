import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import winston from 'winston';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';

// Import Routes
import alertRoutes from './routes/alerts.js';
import maintenanceRoutes from './routes/maintenance.js';
import mineRoutes from './routes/mines.js';
import safetyPlanRoutes from './routes/safetyPlanRoutes.js';
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
import AchievementRoutes from "./routes/AchievementRoutes.js";
import CompilanceRoutes from "./routes/CompilanceRoutes.js";
import SafetyReportRoutes from "./routes/SafetReportRoutes.js";
import SafetyCheckRoutes from './routes/safetyCheckRoutes.js';
import predictiveAnalyticsRoutes from './routes/predictiveAnalyticsRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import advancedAnalyticsRoutes from './routes/advancedAnalyticsRoutes.js';
import { initializeSocket } from './utils/socketHandler.js';
import http from 'http';

const app = express();
const server = http.createServer(app);

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

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// Initialize WebSocket
initializeSocket(server);

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
app.use('/api', safetyPlanRoutes);
app.use('/api', shiftLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', locationRoutes);
app.use('/api/prod', Prodrouter);
app.use('/api', Resourceroutes);
app.use('/api',AttendanceRoutes);
app.use('/api',AuditRoutes);
app.use('/api',AchievementRoutes);
app.use('/api',CompilanceRoutes);
app.use('/api',SafetyReportRoutes);
app.use('/api', SafetyCheckRoutes);
app.use('/api', predictiveAnalyticsRoutes);
app.use('/api', emergencyRoutes);
app.use('/api', trainingRoutes);
app.use('/api', advancedAnalyticsRoutes);
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
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server initialized`);
});
