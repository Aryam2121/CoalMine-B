import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';

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
import dashboardRoutes from './routes/dashboardRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import capaRoutes from './routes/capaRoutes.js';
import complianceCenterRoutes from './routes/complianceCenterRoutes.js';
import executiveRoutes from './routes/executiveRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { initializeSocket } from './utils/socketHandler.js';
import { startComplianceReminderScheduler } from './jobs/complianceReminderJob.js';
import http from 'http';

const app = express();
const server = http.createServer(app);

// MongoDB connection
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(mongoSanitize());
app.use(xss());

// CORS configuration (must run before rate limiter so 429 responses include CORS headers)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://coal-mine-sepia.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting (disabled in dev — SPAs burst many parallel requests on load)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});
app.use('/api/', limiter);

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

// Compliance reminder scheduler (hourly)
startComplianceReminderScheduler(60 * 60 * 1000);

// Initialize session and passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check (must be before /api routes with /:id wildcards)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
// IMPORTANT: Register /api/auth first. Never mount router.use(protect) on app.use('/api', …)
// with catch-all paths like PUT /:id — they shadow /api/attendance, /api/auth/*, etc.
app.use('/api/auth', authRoutes);
app.use('/api', AttendanceRoutes);

app.use('/api/notifications',notficationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', maintenanceRoutes);
app.use('/api', coalMineRoutes);
app.use('/api/mines', mineRoutes);
app.use('/api', safetyPlanRoutes);
app.use('/api', shiftLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', locationRoutes);
app.use('/api/prod', Prodrouter);
app.use('/api', Resourceroutes);
app.use('/api',AuditRoutes);
app.use('/api',AchievementRoutes);
app.use('/api',CompilanceRoutes);
app.use('/api',SafetyReportRoutes);
app.use('/api', SafetyCheckRoutes);
app.use('/api', predictiveAnalyticsRoutes);
app.use('/api', emergencyRoutes);
app.use('/api', trainingRoutes);
app.use('/api', advancedAnalyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', monitoringRoutes);
app.use('/api', capaRoutes);
app.use('/api', complianceCenterRoutes);
app.use('/api', executiveRoutes);
app.use('/api', chatRoutes);

// Static uploads for safety check images
app.use('/uploads', express.static('uploads'));

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
