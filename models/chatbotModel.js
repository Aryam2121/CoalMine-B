import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export const getChatResponse = async (message, language) => {
  try {
    // Payload for Gemini API
    const payload = {
      contents: [{
        parts: [{ text: message }],
      }],
    };

    // Call the Gemini API
    const response = await axios.post(GEMINI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Parse response and get the text from the first candidate
    const botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no reply from Gemini';
    return botReply;
  } catch (error) {
    console.error('Error with Gemini API:', error.response?.data || error.message);
    return 'Sorry, something went wrong!';
  }
};
