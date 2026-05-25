import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_TEMPLATES, VALID_TOOL_IDS } from '../prompts/templates.js';

let genAI = null;

function getApiKey() {
  const raw = process.env.GEMINI_API_KEY;
  const apiKey = typeof raw === 'string' ? raw.trim() : '';
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add it to backend/.env and restart the backend server.'
    );
  }
  return apiKey;
}

export function isGeminiConfigured() {
  try {
    getApiKey();
    return true;
  } catch {
    return false;
  }
}

function getClient() {
  const apiKey = getApiKey();
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateWithGemini(toolId, userInput) {
  if (!VALID_TOOL_IDS.includes(toolId)) {
    throw new Error(`Invalid tool type: ${toolId}`);
  }

  if (!userInput?.trim()) {
    throw new Error('User input is required');
  }

  const templateFn = PROMPT_TEMPLATES[toolId];
  const prompt = templateFn(userInput.trim());

  const client = getClient();
  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred
    ? [preferred, 'gemini-2.5-flash', 'gemini-2.0-flash']
    : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

  let lastError;
  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text) {
        throw new Error('No response generated from AI model');
      }

      return text;
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      const retryable =
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('not found') ||
        msg.includes('404');
      if (!retryable || modelName === models[models.length - 1]) {
        break;
      }
    }
  }

  const message = lastError?.message || 'Unknown error';
  if (message.includes('429') || message.includes('quota')) {
    throw new Error(
      'Gemini API rate limit reached. Wait a minute and try again, or enable billing at https://aistudio.google.com/apikey'
    );
  }
  if (message.includes('API key') || message.includes('API_KEY_INVALID')) {
    throw new Error('Invalid Gemini API key. Create a new key at https://aistudio.google.com/apikey');
  }

  throw new Error(message);
}
