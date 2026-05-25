import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import EmailInput, { normalizeEmailWithGmail } from '../components/EmailInput';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const needsToolAuth = from.startsWith('/tool/');
  const needsPricingAuth = from === '/pricing';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const normalizedEmail = normalizeEmailWithGmail(email);
    if (normalizedEmail !== email) setEmail(normalizedEmail);

    setLoading(true);
    const { error: err } = await signUp(normalizedEmail, password);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSuccess('Account created! You can log in now.');
    setTimeout(() => navigate('/login', { state: { from } }), 1500);
  };

  return (
    <main className="auth-page">
      <div className="auth-card glass-card">
        <h1>
          Join <span className="gradient-text">NexorAI</span>
        </h1>
        <p className="auth-sub">
          {needsToolAuth
            ? 'Create your account to try this tool — your free daily limit is tracked per user.'
            : needsPricingAuth
              ? 'Create an account to purchase a Pro plan — subscriptions are tied to your account.'
              : 'Create an account to save your plan and usage'}
        </p>

        <GoogleAuthButton redirectPath={from} label="Sign up with Google" />

        <div className="auth-divider">or sign up with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
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
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm">Confirm password</label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" state={{ from }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
