import axios from 'axios';
import { getOfflineSafetyReply } from '../utils/mineSafetyKnowledge.js';

const SYSTEM_PROMPT =
  'You are Mine Manager AI, a coal mine safety assistant. Give clear, practical answers about underground safety, shift operations, compliance, emergencies, and training. Use short paragraphs or bullet lists. Do not make up regulations — say to follow site procedures when unsure.';

// One request per chat message — avoid cycling models (burns free-tier quota fast).
const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash-lite';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-8b'];

const replyCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Google AI Studio keys: legacy AIza… or newer AQ.… (both work with generateContent).
 * Use only ONE GEMINI_API_KEY line in .env — duplicate lines overwrite each other.
 */
export function resolveGeminiApiKey() {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key) return { key: null, issue: 'missing' };
  const valid = key.startsWith('AIza') || key.startsWith('AQ.');
  if (!valid) {
    return {
      key,
      issue: 'invalid_format',
      message:
        'GEMINI_API_KEY must be from Google AI Studio (starts with AIza or AQ.).',
    };
  }
  return { key, issue: null, format: key.startsWith('AQ.') ? 'aq' : 'aiza' };
}

function classifyGeminiError(error) {
  const status = error.response?.status;
  if (status === 429) {
    return {
      code: 'quota_exceeded',
      message:
        'Gemini free-tier limit reached (429). Wait for daily reset, enable billing in Google AI Studio, or use built-in answers below.',
    };
  }

  const msg = (
    error.response?.data?.error?.message ||
    error.message ||
    ''
  ).toLowerCase();

  if (msg.includes('suspended') || msg.includes('permission denied')) {
    return {
      code: 'key_suspended',
      message:
        'Your Gemini API key is suspended or disabled. Create a new key at https://aistudio.google.com/apikey',
    };
  }
  if (
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests')
  ) {
    return {
      code: 'quota_exceeded',
      message:
        'Gemini free-tier limit reached (429). Wait for daily reset, enable billing in Google AI Studio, or use built-in answers below.',
    };
  }
  if (msg.includes('api key not valid') || msg.includes('invalid') && msg.includes('key')) {
    return {
      code: 'invalid_key',
      message: 'Invalid GEMINI_API_KEY. Check the key in CoalMine-B/.env (Google AI Studio).',
    };
  }
  if (msg.includes('not found') && msg.includes('model')) {
    return { code: 'model_error', message: null };
  }
  return { code: 'api_error', message: error.response?.data?.error?.message || error.message };
}

async function generateWithModel(key, model, fullPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
  );
  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return { text, model };
}

async function callGemini(fullPrompt) {
  const resolved = resolveGeminiApiKey();
  if (!resolved.key) return { error: { code: 'missing', message: 'GEMINI_API_KEY is not set in CoalMine-B/.env' } };
  if (resolved.issue === 'invalid_format') {
    return { error: { code: 'invalid_format', message: resolved.message } };
  }

  const cacheKey = fullPrompt.slice(0, 500);
  const cached = replyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { text: cached.text, model: cached.model, offline: false, cached: true };
  }

  const { key } = resolved;
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];
  let lastError;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const result = await generateWithModel(key, model, fullPrompt);
      replyCache.set(cacheKey, { text: result.text, model: result.model, at: Date.now() });
      return result;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const classified = classifyGeminiError(error);
      console.warn(`Gemini ${model} (${status || 'err'}):`, classified.message || error.message);

      // Never burn more quota retrying after 429 / auth errors
      if (['key_suspended', 'quota_exceeded', 'invalid_key', 'invalid_format'].includes(classified.code)) {
        return { error: classified };
      }
      // Only try next model when this one does not exist (404)
      if (classified.code !== 'model_error' && status !== 404) {
        return { error: classified };
      }
    }
  }

  return { error: classifyGeminiError(lastError || new Error('All Gemini models failed')) };
}

export const getChatResponse = async (message, language = 'en') => {
  const userMessage = (message || '').trim();
  if (!userMessage) {
    return { reply: 'Please enter a question.', offline: true, reason: 'empty' };
  }

  const langHint =
    language && language !== 'en'
      ? `Reply in ${language === 'hi' ? 'Hindi' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language}. `
      : '';

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${langHint}User: ${userMessage}`;

  const result = await callGemini(fullPrompt);

  if (result?.text) {
    return {
      reply: result.text,
      offline: false,
      model: result.model,
      reason: 'online',
    };
  }

  const err = result?.error || { code: 'api_error', message: null };
  const hint =
    err.message ||
    (err.code === 'missing'
      ? 'Add GEMINI_API_KEY to CoalMine-B/.env and restart the backend.'
      : 'Using built-in safety knowledge (Gemini unavailable).');

  return {
    reply: getOfflineSafetyReply(userMessage, language),
    offline: true,
    reason: err.code || 'offline',
    hint,
  };
};

export default { getChatResponse, resolveGeminiApiKey };
