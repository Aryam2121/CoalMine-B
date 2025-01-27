// routes/chatbotRoutes.js
import express from 'express';
import { handleChatRequest } from '../controllers/chatbotController.js';


const router = express.Router();

// POST route for chatbot interaction
router.post('/chat', handleChatRequest);

export default router;
