import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { consumeOAuthRedirect } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import './Auth.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshPlan } = useUser();
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    const client = supabase;
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      try {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data, error } = await client.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            throw new Error('No session found after Google sign in.');
          }
        }

        const redirect = consumeOAuthRedirect();
        await refreshPlan();
        navigate(redirect, { replace: true });
      } catch (err) {
        setMessage((err as Error).message || 'Sign in failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    finish();
  }, [navigate, refreshPlan]);

  return (
    <main className="auth-page">
      <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
        <div className="loader" style={{ margin: '0 auto 1rem' }} />
        <p className="auth-sub" style={{ marginBottom: 0 }}>{message}</p>
      </div>
    </main>
  );
}
