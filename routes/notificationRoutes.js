// routes/notificationRoutes.js
import express from 'express';
import { sendNotification } from '../controllers/NotificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-notification', protect, sendNotification);

export default router;
