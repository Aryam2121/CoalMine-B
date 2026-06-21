import express from 'express';
import { handleChatRequest } from '../controllers/chatbotController.js';
import { handleOperationsChat } from '../controllers/operationsChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, handleChatRequest);
router.post('/chat/operations', protect, handleOperationsChat);

export default router;
