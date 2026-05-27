import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import generateRouter from './routes/generate.js';
import paymentRouter from './routes/payment.js';
import userRouter from './routes/user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always load .env from backend/ regardless of cwd when starting the server
dotenv.config({ path: path.join(__dirname, '../.env') });
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function getAllowedOrigins() {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set([FRONTEND_URL, ...extra])];
}

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  const allowed = getAllowedOrigins();
  if (allowed.includes(normalized)) return true;
  // Vercel production/preview deployments (*.vercel.app)
  if (process.env.NODE_ENV === 'production' && /\.vercel\.app$/i.test(normalized)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Rate limit exceeded. Please wait a moment.' },
});

app.use('/api', limiter);
app.use('/api/generate', generateLimiter);

app.get('/api/health', async (_, res) => {
  const { isGeminiConfigured, getApiKeys } = await import('./services/gemini.js');
  const { isSupabaseConfigured } = await import('./services/supabase.js');
  res.json({
    status: 'ok',
    service: 'NexorAI API',
    geminiConfigured: isGeminiConfigured(),
    geminiKeyCount: getApiKeys().length,
    supabaseConfigured: isSupabaseConfigured(),
  });
});

// Test endpoint — visits this URL to instantly check if your Gemini key is alive
app.get('/api/health/gemini', async (_, res) => {
  try {
    const { generateWithGemini } = await import('./services/gemini.js');
    const result = await generateWithGemini('blog_post', 'Write one sentence about technology.');
    res.json({ status: 'ok', working: true, sample: result.slice(0, 120) });
  } catch (err) {
    res.status(500).json({ status: 'error', working: false, reason: err.message });
  }
});

app.use('/api/generate', generateRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/user', userRouter);

// Root: redirect to the React app (port 5000 is API-only in development)
app.get('/', (_req, res) => {
  res.redirect(FRONTEND_URL);
});

// Serve built frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`NexorAI Backend running on http://${HOST}:${PORT}`);
  console.log(`CORS allowed: ${getAllowedOrigins().join(', ')}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
});