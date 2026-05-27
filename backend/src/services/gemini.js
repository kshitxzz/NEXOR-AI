import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_TEMPLATES, VALID_TOOL_IDS } from '../prompts/templates.js';

const PLACEHOLDER_KEYS = new Set([
  'your_gemini_api_key_here',
  'your_primary_gemini_api_key',
  'your_backup_gemini_api_key',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/**
 * Model list ordered by free-tier quota (highest first).
 * gemini-2.0-flash-lite: 30 RPM on free tier
 * gemini-2.0-flash:      15 RPM on free tier
 * gemini-1.5-flash:      15 RPM on free tier
 * gemini-1.5-flash-8b:   15 RPM on free tier (smallest/fastest fallback)
 */
function getModelCandidates() {
  return [
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];
}

/** True only when the API key itself is invalid/revoked (not a model-level issue). */
function isKeyFailure(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 401) return true;

  // 403 is a key failure ONLY if the message explicitly says the key is bad
  const keyBadPhrases = [
    'api_key_invalid',
    'api key not valid',
    'api key was reported',
    'api key expired',
    'invalid api key',
    'provide an api key',
  ];
  if (keyBadPhrases.some((p) => msg.includes(p))) return true;

  return false;
}

/** True when we should try the next model (not a key problem, just this model). */
function isModelRetryable(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 403 ||
    status === 404 ||
    status === 503 ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('permission') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable')
  );
}

function isRateLimited(err) {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 429 ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('too many requests')
  );
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
    throw new Error('Empty response from AI model');
  }
  return text;
}

function maskKey(k) {
  if (!k || k.length <= 8) return '***';
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

function buildUserFacingError(failures) {
  const allKeyFailures = failures.length > 0 && failures.every((f) => isKeyFailure(f.err));
  if (allKeyFailures) {
    console.error(
      '[Gemini] All API keys are invalid/revoked. ' +
      'Go to https://aistudio.google.com/apikey → create a new key → ' +
      'update GEMINI_API_KEY in Render dashboard (Environment tab) and redeploy.'
    );
    return 'AI_KEY_INVALID';
  }

  const anyRateLimit = failures.some((f) => isRateLimited(f.err));
  if (anyRateLimit) return 'AI_RATE_LIMITED';

  return 'AI_UNAVAILABLE';
}

/**
 * Try one (key, model) pair with up to `maxAttempts` retries on rate-limit errors.
 */
async function generateWithRetry(apiKey, modelName, prompt, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generateOnce(apiKey, modelName, prompt);
    } catch (err) {
      lastErr = err;

      if (isRateLimited(err)) {
        const waitMs = attempt * 2500; // 2.5s, 5s, 7.5s
        console.warn(
          `[Gemini] Rate-limited on key=${maskKey(apiKey)} model=${modelName}. ` +
          `Attempt ${attempt}/${maxAttempts}. Waiting ${waitMs}ms before retry...`
        );
        if (attempt < maxAttempts) {
          await sleep(waitMs);
          continue;
        }
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function generateWithGemini(toolId, userInput) {
  if (!VALID_TOOL_IDS.includes(toolId)) {
    throw new Error(`Invalid tool: ${toolId}`);
  }
  if (!userInput?.trim()) {
    throw new Error('Input is required');
  }

  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    console.error('[Gemini] No API keys configured. Set GEMINI_API_KEY in your environment.');
    throw new Error('AI_NOT_CONFIGURED');
  }

  const prompt = PROMPT_TEMPLATES[toolId](userInput.trim());
  const models = getModelCandidates();
  const failures = [];

  for (const apiKey of apiKeys) {
    for (let mi = 0; mi < models.length; mi++) {
      const modelName = models[mi];
      try {
        const result = await generateWithRetry(apiKey, modelName, prompt);
        if (failures.length > 0) {
          console.log(
            `[Gemini] Success on key=${maskKey(apiKey)} model=${modelName} after ${failures.length} failure(s).`
          );
        }
        return result;
      } catch (err) {
        failures.push({ key: maskKey(apiKey), model: modelName, err });
        console.warn(
          `[Gemini] FAILED key=${maskKey(apiKey)} model=${modelName}: ${err.message?.slice(0, 120)}`
        );

        // Key is dead — skip remaining models for this key
        if (isKeyFailure(err)) {
          console.warn(`[Gemini] Key ${maskKey(apiKey)} is invalid. Moving to next key.`);
          break;
        }

        // Rate-limited on all retries AND this is the last model — give up on this key
        if (isRateLimited(err) && mi === models.length - 1) break;

        // Model-level issue — try next model
        if (isModelRetryable(err)) continue;

        // Unknown error on last model — move to next key
        if (mi === models.length - 1) break;
      }
    }
  }

  throw new Error(buildUserFacingError(failures));
}