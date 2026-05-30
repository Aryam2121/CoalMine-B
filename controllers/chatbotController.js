import { getChatResponse } from '../models/chatbotModel.js';

 const handleChatRequest = async (req, res) => {
  const { message, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await getChatResponse(message, language);
    res.status(200).json({
      reply: result.reply,
      offline: result.offline ?? false,
      hint: result.hint,
      reason: result.reason,
      model: result.model,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Error processing chatbot request' });
  }
};
export {handleChatRequest};