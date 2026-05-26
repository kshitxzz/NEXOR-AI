import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUserPlan, setAuthTokenGetter, type UserPlan } from '../services/api';
import { useAuth } from './AuthContext';

const EXPIRED_ALLOWED_PATHS = [
  '/pricing',
  '/payment/success',
  '/login',
  '/signup',
  '/auth/callback',
];

interface UserContextValue {
  plan: UserPlan | null;
  loading: boolean;
  refreshPlan: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(getAccessToken);
  }, [getAccessToken]);

  const refreshPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchUserPlan();
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshPlan();
  }, [authLoading, refreshPlan]);

  useEffect(() => {
    if (authLoading || loading || !plan?.subscriptionLapsed) return;
    const path = location.pathname;
    if (EXPIRED_ALLOWED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return;
    navigate('/pricing', {
      replace: true,
      state: { subscriptionExpired: true },
    });
  }, [authLoading, loading, plan?.subscriptionLapsed, location.pathname, navigate]);

  return (
    <UserContext.Provider value={{ plan, loading: loading || authLoading, refreshPlan }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
