import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_TEMPLATES, VALID_TOOL_IDS } from '../prompts/templates.js';

const PLACEHOLDER_KEYS = new Set([
  'your_gemini_api_key_here',
  'your_primary_gemini_api_key',
  'your_backup_gemini_api_key',
]);

function normalizeKey(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

/** Primary + optional backup keys (deduplicated, non-empty). */
export function getApiKeys() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ]
    .map(normalizeKey)
    .filter((key) => key && !PLACEHOLDER_KEYS.has(key));

  return [...new Set(candidates)];
}

export function isGeminiConfigured() {
  return getApiKeys().length > 0;
}

function getModelCandidates() {
  const preferred = process.env.GEMINI_MODEL?.trim();
  if (preferred) {
    return [preferred, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
  }
  return ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
}

function isKeyFailure(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('api key was reported') ||
    msg.includes('api key expired') ||
    msg.includes('permission denied')
  );
}

function isModelRetryable(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 404 ||
    status === 429 ||
    status === 503 ||
    msg.includes('not found') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable')
  );
}

function isTransient(err) {
  const status = err?.status;
  return status === 408 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function generateOnce(apiKey, modelName, prompt) {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error('No response generated from AI model');
  }
  return text;
}

function maskKey(apiKey) {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

function toUserFacingError(failures) {
  const messages = failures.map((f) => f.err?.message || '').join(' ').toLowerCase();

  const allKeyFailures = failures.length > 0 && failures.every((f) => isKeyFailure(f.err));
  if (allKeyFailures) {
    console.error(
      '[Gemini] All configured API keys failed authentication. Add fresh keys at https://aistudio.google.com/apikey'
    );
    return 'AI service is temporarily unavailable. Please try again in a few minutes.';
  }

  if (messages.includes('429') || messages.includes('quota') || messages.includes('rate limit')) {
    return 'AI is busy right now. Please wait a minute and try again.';
  }

  if (messages.includes('safety') || messages.includes('blocked')) {
    return 'Content could not be generated for this input. Try rephrasing your request.';
  }

  return 'Generation failed. Please try again in a moment.';
}

export async function generateWithGemini(toolId, userInput) {
  if (!VALID_TOOL_IDS.includes(toolId)) {
    throw new Error(`Invalid tool type: ${toolId}`);
  }

  if (!userInput?.trim()) {
    throw new Error('User input is required');
  }

  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error(
      'AI service is not configured. Set GEMINI_API_KEY (and optionally GEMINI_API_KEY_2) on the server.'
    );
  }

  const templateFn = PROMPT_TEMPLATES[toolId];
  const prompt = templateFn(userInput.trim());
  const models = getModelCandidates();
  const failures = [];

  for (const apiKey of apiKeys) {
    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelName = models[modelIndex];
      try {
        return await generateOnce(apiKey, modelName, prompt);
      } catch (err) {
        failures.push({ key: maskKey(apiKey), model: modelName, err });
        console.warn(
          `[Gemini] key=${maskKey(apiKey)} model=${modelName}: ${err.message?.slice(0, 120)}`
        );

        if (isKeyFailure(err)) {
          break;
        }

        const lastModel = modelIndex === models.length - 1;
        const canRetryModel = isModelRetryable(err) || isTransient(err);
        if (!canRetryModel || lastModel) {
          break;
        }
      }
    }
  }

  throw new Error(toUserFacingError(failures));
}
