import { useState, useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getToolById } from '../data/tools';
import { generateContent } from '../services/api';
import { useUser } from '../context/UserContext';
import './ToolPage.css';

const COLD_START_DELAY_MS = 7000;

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? getToolById(toolId) : undefined;
  const { plan, refreshPlan } = useUser();

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isColdStart, setIsColdStart] = useState(false);

  const coldStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter some input before generating.');
      return;
    }

    setError('');
    setLoading(true);
    setOutput('');
    setIsColdStart(false);

    coldStartTimer.current = setTimeout(() => setIsColdStart(true), COLD_START_DELAY_MS);

    try {
      const result = await generateContent(tool.id, input);

      if (coldStartTimer.current) clearTimeout(coldStartTimer.current);
      setIsColdStart(false);
      setOutput(result.output);

      // Refresh plan in the background — don't await so it never blocks or redirects
      refreshPlan().catch(() => {});
    } catch (err) {
      if (coldStartTimer.current) clearTimeout(coldStartTimer.current);
      setIsColdStart(false);

      const e = err as Error & { upgrade?: boolean; planExpired?: boolean; status?: number };

      // Daily limit reached
      if (e.upgrade && !e.planExpired) {
        setError('You have reached your daily free limit. Upgrade to Pro for unlimited generations.');
        return;
      }

      // Plan expired — show inline message instead of auto-redirecting
      if (e.planExpired) {
        setError('Your Pro plan has ended. Renew your subscription to keep using all tools.');
        return;
      }

      // Network / server unreachable
      const msg = e.message || '';
      if (
        e.status === 503 ||
        msg.toLowerCase().includes('cannot reach') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('networkerror') ||
        msg.toLowerCase().includes('backend is not connected')
      ) {
        setError(
          'Sorry for the inconvenience, but the AI is not working at this time. The server may be starting up — please try again in a moment.'
        );
        return;
      }

      // All other errors (from backend AI_ERROR_MESSAGES or generic)
      setError(
        msg || 'Sorry for the inconvenience, but the AI is not working at this time. Please try again shortly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const limitReached =
    plan?.plan === 'free' && plan.remaining !== null && plan.remaining <= 0;

  return (
    <main className="tool-page section">
      <div className="container tool-container">
        <Link to="/#tools" className="back-link">
          ← Back to Tools
        </Link>

        <header className="tool-header">
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
          {plan && (
            <div className="usage-bar glass-card">
              {plan.plan === 'pro' ? (
                <span className="usage-pro">✓ Pro — Unlimited generations</span>
              ) : (
                <span>
                  Free plan: {plan.dailyUsed}/{plan.dailyLimit} generations used today
                  {plan.remaining !== null && plan.remaining > 0 && (
                    <> · {plan.remaining} remaining</>
                  )}
                </span>
              )}
            </div>
          )}
        </header>

        <div className="tool-workspace">
          <div className="tool-input glass-card">
            <label htmlFor="tool-input">Your Input</label>
            <textarea
              id="tool-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tool.placeholder}
              rows={10}
              disabled={loading || limitReached}
            />
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={loading || limitReached}
            >
              {loading ? (
                <>
                  <span className="btn-loader" />
                  Generating...
                </>
              ) : limitReached ? (
                'Daily Limit Reached'
              ) : (
                'Generate'
              )}
            </button>
            {limitReached && (
              <Link to="/pricing" className="upgrade-link">
                Upgrade to Pro for unlimited access →
              </Link>
            )}
          </div>

          <div className="tool-output glass-card">
            <label>AI Output</label>

            {loading && (
              <div className="output-loading">
                <div className="loader" />
                <p>Generating with AI...</p>
                {isColdStart && (
                  <p className="cold-start-hint">
                    The server is waking up from sleep — this can take up to 30 seconds on first use. Hang tight!
                  </p>
                )}
              </div>
            )}

            {error && !loading && (
              <div className="output-error">
                <p>{error}</p>
                <div className="output-error-actions">
                  <button className="btn btn-outline btn-sm" onClick={handleGenerate}>
                    Try Again
                  </button>
                  {(error.includes('Upgrade') || error.includes('plan has ended')) && (
                    <Link to="/pricing" className="btn btn-primary btn-sm">
                      View Plans
                    </Link>
                  )}
                </div>
              </div>
            )}

            {output && !loading && (
              <div className="markdown-output">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            )}

            {!output && !loading && !error && (
              <p className="output-placeholder">
                Your AI-generated result will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}