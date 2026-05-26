import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/** Redirects users whose paid Pro period has ended to renew on the pricing page. */
export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { plan, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && plan?.subscriptionLapsed) {
      navigate('/pricing', {
        replace: true,
        state: { subscriptionExpired: true },
      });
    }
  }, [loading, plan?.subscriptionLapsed, navigate]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="loader" />
      </div>
    );
  }

  if (plan?.subscriptionLapsed) {
    return null;
  }

  return <>{children}</>;
}
