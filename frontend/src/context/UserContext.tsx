import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchUserPlan, setAuthTokenGetter, type UserPlan } from '../services/api';
import { useAuth } from './AuthContext';

interface UserContextValue {
  plan: UserPlan | null;
  loading: boolean;
  refreshPlan: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
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
