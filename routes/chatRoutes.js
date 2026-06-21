import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

router.get('/chat/history', protect, async (req, res) => {
  try {
    const { mineId, channel, limit = 50 } = req.query;
    if (!mineId) return res.status(400).json({ success: false, message: 'mineId required' });

    const query = { mineId };
    if (channel) query.channel = channel;

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('userId', 'name role');

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
