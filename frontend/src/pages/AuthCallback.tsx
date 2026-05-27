import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { consumeOAuthRedirect } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import './Auth.css';

const FRIENDLY_MESSAGES = [
  'Almost there...',
  'Setting things up for you...',
  'Thank you for your patience!',
  'Just a moment...',
  'Hold on, nearly done!',
  'Getting everything ready...',
];

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshPlan } = useUser();
  const [messageIndex, setMessageIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Rotate friendly messages every 1.8 seconds while loading
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FRIENDLY_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsError(true);
      setErrorText('Supabase is not configured.');
      return;
    }

    const client = supabase;
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthError =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (oauthError) {
        const friendlyError = oauthError.includes('improperly formatted')
          ? 'There was a configuration error with the sign-in URL. Please try again or contact support.'
          : decodeURIComponent(oauthError.replace(/\+/g, ' '));
        setIsError(true);
        setErrorText(friendlyError);
        setTimeout(() => navigate('/login', { replace: true }), 5000);
        return;
      }

      const code = params.get('code');

      try {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          // Silently handle PKCE errors — they usually mean the session
          // was already established in another tab or the verifier expired.
          // Try getting the existing session before giving up.
          if (error) {
            const isPkceError =
              error.message?.toLowerCase().includes('pkce') ||
              error.message?.toLowerCase().includes('verifier') ||
              error.message?.toLowerCase().includes('code_verifier');

            if (!isPkceError) throw error;

            // PKCE issue — check if we already have a valid session
            const { data: sessionData } = await client.auth.getSession();
            if (!sessionData.session) {
              // No session at all — send back to login gracefully
              setTimeout(() => navigate('/login', { replace: true }), 1500);
              return;
            }
          }
        } else {
          const { data, error } = await client.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            throw new Error('No session found after sign in.');
          }
        }

        const redirect = consumeOAuthRedirect();
        await refreshPlan();
        navigate(redirect, { replace: true });
      } catch (err) {
        const msg = (err as Error).message || '';
        // Don't show raw technical errors to the user
        const isPkceError =
          msg.toLowerCase().includes('pkce') ||
          msg.toLowerCase().includes('verifier') ||
          msg.toLowerCase().includes('code_verifier');

        if (isPkceError) {
          // Silently redirect to login
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        } else {
          setIsError(true);
          setErrorText('Sign in could not be completed. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      }
    };

    finish();
  }, [navigate, refreshPlan]);

  return (
    <main className="auth-page">
      <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
        {!isError ? (
          <>
            <div className="loader" style={{ margin: '0 auto 1.25rem' }} />
            <p
              className="auth-sub"
              style={{
                marginBottom: 0,
                transition: 'opacity 0.4s ease',
                minHeight: '1.4em',
              }}
            >
              {FRIENDLY_MESSAGES[messageIndex]}
            </p>
          </>
        ) : (
          <>
            <p className="auth-sub" style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>
              {errorText}
            </p>
            <p className="auth-sub" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
              Redirecting you back to login...
            </p>
          </>
        )}
      </div>
    </main>
  );
}
