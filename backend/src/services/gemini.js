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
  // gemini-2.0-flash is most stable and widely available on free tier — always try it first
  return [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
  ];
}

/**
 * True only when the API key itself is invalid/revoked.
 * A 403 on a specific model (e.g. model not in free tier) is NOT a key failure —
 * we should still try the next model with the same key.
 */
function isKeyFailure(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  // 401 is always a key failure
  if (status === 401) return true;

  // 403 is only a key failure if the message explicitly says so
  if (status === 403) {
    return (
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('api key was reported') ||
      msg.includes('api key expired') ||
      msg.includes('invalid api key')
    );
  }

  return (
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('api key was reported') ||
    msg.includes('api key expired') ||
    msg.includes('invalid api key')
  );
}

function isModelRetryable(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 403 || // model permission — try next model
    status === 404 || // model not found — try next model
    status === 429 || // quota/rate limit — try next model
    status === 503 || // overloaded
    msg.includes('not found') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('permission') ||
    msg.includes('not supported')
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
  const statuses = failures.map((f) => f.err?.status);

  const allKeyFailures = failures.length > 0 && failures.every((f) => isKeyFailure(f.err));
  if (allKeyFailures) {
    console.error('[Gemini] All API keys rejected. Go to https://aistudio.google.com/apikey and generate new keys, then update GEMINI_API_KEY in your .env / Render environment.');
    return 'AI_KEY_INVALID';
  }

  if (messages.includes('quota') || messages.includes('rate limit') || statuses.includes(429)) {
    return 'AI_QUOTA_EXCEEDED';
  }

  if (messages.includes('safety') || messages.includes('blocked')) {
    return 'AI_SAFETY_BLOCK';
  }

  return 'AI_UNAVAILABLE';
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
    console.error('[Gemini] No API keys configured. Set GEMINI_API_KEY in your environment.');
    throw new Error('AI_NOT_CONFIGURED');
  }

  const templateFn = PROMPT_TEMPLATES[toolId];
  const prompt = templateFn(userInput.trim());
  const models = getModelCandidates();
  const failures = [];

  for (const apiKey of apiKeys) {
    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelName = models[modelIndex];
      try {
        const result = await generateOnce(apiKey, modelName, prompt);
        if (failures.length > 0) {
          console.log(`[Gemini] Succeeded on key=${maskKey(apiKey)} model=${modelName} after ${failures.length} failure(s)`);
        }
        return result;
      } catch (err) {
        failures.push({ key: maskKey(apiKey), model: modelName, err });
        console.warn(`[Gemini] key=${maskKey(apiKey)} model=${modelName}: ${err.message?.slice(0, 120)}`);

        // Key is invalid — skip remaining models for this key, try next key
        if (isKeyFailure(err)) {
          console.warn(`[Gemini] Key ${maskKey(apiKey)} appears invalid/revoked. Trying next key if available.`);
          break;
        }

        // Model-level issue — try next model
        const lastModel = modelIndex === models.length - 1;
        if (lastModel) break; // no more models to try

        const shouldRetryNextModel = isModelRetryable(err) || isTransient(err);
        if (!shouldRetryNextModel) break;
      }
    }
  }

  throw new Error(toUserFacingError(failures));
}