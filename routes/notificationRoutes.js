// routes/notificationRoutes.js
import express from 'express';
const router = express.Router();
import { sendNotification } from '../controllers/NotificationController.js';

// POST request to send notification
router.post('/send-notification', sendNotification);

export default router;