import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import EmailInput, { normalizeEmailWithGmail } from '../components/EmailInput';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

export default function Login() {
  const { signIn } = useAuth();
  const { refreshPlan } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const needsToolAuth = from.startsWith('/tool/');
  const needsPricingAuth = from === '/pricing';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const normalizedEmail = normalizeEmailWithGmail(email);
    if (normalizedEmail !== email) setEmail(normalizedEmail);
    const { error: err } = await signIn(normalizedEmail, password);
    if (err) {
      setLoading(false);
      setError(err);
      return;
    }

    await refreshPlan();
    setLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-card glass-card">
        <h1>
          Welcome back to <span className="gradient-text">NexorAI</span>
        </h1>
        <p className="auth-sub">
          {needsToolAuth
            ? 'Sign in to use this AI tool. New here? Create a free account below.'
            : needsPricingAuth
              ? 'Sign in to purchase a Pro subscription. New here? Create an account below.'
              : 'Log in to use AI tools and manage your plan'}
        </p>

        {(needsToolAuth || needsPricingAuth) && (
          <p className="auth-tool-hint">
            <Link to="/signup" state={{ from }}>
              Sign up free
            </Link>{' '}
            {needsPricingAuth
              ? '— then return here to complete your purchase.'
              : '— each account has its own daily generation limit.'}
          </p>
        )}

        <GoogleAuthButton redirectPath={from} label="Continue with Google" />

        <div className="auth-divider">or continue with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div>
            <label htmlFor="email">Email</label>
            <EmailInput id="email" value={email} onChange={setEmail} />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" state={{ from }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
