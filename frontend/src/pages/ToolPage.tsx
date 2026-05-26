import { useState } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getToolById } from '../data/tools';
import { generateContent } from '../services/api';
import { useUser } from '../context/UserContext';
import './ToolPage.css';

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? getToolById(toolId) : undefined;
  const { plan, refreshPlan } = useUser();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const result = await generateContent(tool.id, input);
      setOutput(result.output);
      await refreshPlan();
    } catch (err) {
      const e = err as Error & { upgrade?: boolean; planExpired?: boolean };
      if (e.planExpired) {
        navigate('/pricing', {
          replace: true,
          state: { subscriptionExpired: true },
        });
        return;
      }
      setError(e.message);
      if (e.upgrade) {
        setError(
          `${e.message} Upgrade to Pro for unlimited generations.`
        );
      }
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
                <p>Generating with Gemini AI...</p>
              </div>
            )}
            {error && !loading && (
              <div className="output-error">
                <p>{error}</p>
                {error.includes('Upgrade') && (
                  <Link to="/pricing" className="btn btn-primary btn-sm">
                    View Plans
                  </Link>
                )}
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
