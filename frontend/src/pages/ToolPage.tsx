import { useState, useRef } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getToolById } from '../data/tools';
import { generateContent } from '../services/api';
import { useUser } from '../context/UserContext';
import './ToolPage.css';

const COLD_START_DELAY_MS = 6000; // Show cold-start hint after 6s

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? getToolById(toolId) : undefined;
  const { plan, refreshPlan } = useUser();
  const navigate = useNavigate();

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

    // Show cold-start hint if the request takes too long
    coldStartTimer.current = setTimeout(() => {
      setIsColdStart(true);
    }, COLD_START_DELAY_MS);

    try {
      const result = await generateContent(tool.id, input);

      if (coldStartTimer.current) clearTimeout(coldStartTimer.current);
      setIsColdStart(false);

      setOutput(result.output);
      await refreshPlan();
    } catch (err) {
      if (coldStartTimer.current) clearTimeout(coldStartTimer.current);
      setIsColdStart(false);

      const e = err as Error & { upgrade?: boolean; planExpired?: boolean };

      if (e.planExpired) {
        navigate('/pricing', {
          replace: true,
          state: { subscriptionExpired: true },
        });
        return;
      }

      let msg = e.message || 'Something went wrong. Please try again.';

      // Make network / server-down errors friendlier
      if (
        msg.toLowerCase().includes('cannot reach') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('networkerror') ||
        msg.toLowerCase().includes('backend is not connected')
      ) {
        msg =
          'The server is taking too long to respond. It may be waking up — please wait a moment and try again.';
      }

      if (e.upgrade) {
        msg = `Daily limit reached. Upgrade to Pro for unlimited generations.`;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handleGenerate();
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
                <p>Generating with Gemini AI...</p>
                {isColdStart && (
                  <p className="cold-start-hint">
                    The server is waking up — this may take up to 30 seconds on first use. Hang tight!
                  </p>
                )}
              </div>
            )}

            {error && !loading && (
              <div className="output-error">
                <p>{error}</p>
                <div className="output-error-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleRetry}
                  >
                    Try Again
                  </button>
                  {error.includes('Upgrade') && (
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
