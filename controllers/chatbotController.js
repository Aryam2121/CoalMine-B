import { getChatResponse } from '../models/chatbotModel.js';

export const handleChatRequest = async (req, res) => {
  const { message, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await getChatResponse(message, language);
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Error processing chatbot request' });
  }
};
