import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createPaymentOrder,
  fetchPaymentPlans,
  getYearlyPlanAmount,
  type PaymentPlans,
} from '../services/api';
import { useUser } from '../context/UserContext';
import { openCashfreeCheckout } from '../utils/cashfreeCheckout';
import {
  API_NOT_CONFIGURED_MSG,
  getApiBaseUrl,
  isApiConfigured,
  resolveApiUrl,
} from '../utils/apiConfig';
import './Pricing.css';

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan } = useUser();
  const subscriptionExpired =
    (location.state as { subscriptionExpired?: boolean } | null)?.subscriptionExpired ===
      true || plan?.subscriptionLapsed === true;
  const hasActivePro = plan?.plan === 'pro' && !plan?.subscriptionLapsed;
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlans | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentPlans()
      .then((data) => {
        if (data?.plans?.pro_monthly) {
          setPaymentPlans(data);
          setPlansError(null);
        } else {
          throw new Error('Invalid plans response');
        }
      })
      .catch((err) => {
        const apiUrl = resolveApiUrl('/api/payment/plans');
        const detail = err instanceof Error ? err.message : 'Network error';
        setPlansError(
          `Cannot reach ${apiUrl}. ${detail} — Redeploy Vercel (Deployments → Redeploy) after saving env vars. On Render set FRONTEND_URL=https://nexorai-app.vercel.app and redeploy.`
        );
        setPaymentPlans({
          plans: {
            pro_monthly: { amount: 499, currency: 'INR', label: 'Pro Monthly' },
            pro_yearly: { amount: 4999, currency: 'INR', label: 'Pro Annual' },
          },
          cashfreeConfigured: false,
          mode: 'sandbox',
        });
      });
  }, []);

  const requireAuthForPurchase = () => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return false;
    }
    return true;
  };

  const handleUpgrade = async (planType: 'pro_monthly' | 'pro_yearly') => {
    if (!requireAuthForPurchase()) return;
    setError('');
    setLoading(planType);
    try {
      const result = await createPaymentOrder(planType);
      if (result.paymentSessionId) {
        await openCashfreeCheckout(result.paymentSessionId, result.cashfreeMode);
      } else {
        throw new Error('No payment session received from server');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to initiate payment');
    } finally {
      setLoading(null);
    }
  };

  const monthlyPrice = paymentPlans?.plans?.pro_monthly?.amount ?? 499;
  const yearlyPrice = getYearlyPlanAmount(paymentPlans?.plans);
  const yearlyComparePrice = 5999;
  const cashfreeReady = paymentPlans?.cashfreeConfigured ?? true;
  const plansLoading = paymentPlans === null;

  return (
    <main className="pricing-page section">
      <div className="container">
        <h1 className="section-title">
          Choose Your <span className="gradient-text">Plan</span>
        </h1>
        <p className="section-subtitle">
          Start free with 5 generations per day, or upgrade for unlimited AI power
        </p>

        {subscriptionExpired && (
          <div className="pricing-expired glass-card" role="alert">
            <strong>Your Pro plan has ended.</strong> Renew below to restore unlimited access to
            all tools.
          </div>
        )}

        {plan && (
          <p className="current-plan">
            Current plan:{' '}
            <strong>
              {hasActivePro
                ? 'Pro'
                : subscriptionExpired
                  ? 'Pro (expired)'
                  : 'Free'}
            </strong>
            {plan.plan === 'free' && !subscriptionExpired && plan.remaining !== null && (
              <> · {plan.remaining} generations left today</>
            )}
            {hasActivePro && plan.planExpiresAt && (
              <>
                {' '}
                · Renews/ends{' '}
                {new Date(plan.planExpiresAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </>
            )}
          </p>
        )}

        {plansError && (
          <div className="pricing-warning glass-card">{plansError}</div>
        )}

        {!plansError && paymentPlans && !cashfreeReady && (
          <div className="pricing-warning glass-card">
            Cashfree is not configured on the <strong>deployed API</strong>. Add{' '}
            <code>CASHFREE_APP_ID</code> and <code>CASHFREE_SECRET_KEY</code> in{' '}
            <strong>Render → Environment</strong> (not only local <code>backend/.env</code>
            ), then redeploy the backend.
          </div>
        )}

        {import.meta.env.PROD && !getApiBaseUrl() && !plansError && (
          <div className="pricing-warning glass-card">{API_NOT_CONFIGURED_MSG}</div>
        )}

        {error && <div className="pricing-error glass-card">{error}</div>}

        {plansLoading ? (
          <div className="pricing-loading glass-card">
            <div className="loader" />
            <p>Loading plans...</p>
          </div>
        ) : (
        <div className="pricing-grid">
          <div className="pricing-card glass-card">
            <h3>Basic</h3>
            <div className="price">
              <span className="amount">₹0</span>
              <span className="period">/ forever</span>
            </div>
            <ul>
              <li>5 AI generations per day</li>
              <li>Access to all 30 tools</li>
              <li>Gemini-powered responses</li>
              <li>Standard support</li>
            </ul>
            {user ? (
              <Link to="/tool/youtube-script" className="btn btn-outline">
                Get Started Free
              </Link>
            ) : (
              <Link to="/login" state={{ from: '/' }} className="btn btn-outline">
                Get Started Free
              </Link>
            )}
          </div>

          <div className="pricing-card glass-card featured">
            <span className="popular-badge">Most Popular</span>
            <h3>Pro Monthly</h3>
            <div className="price">
              <span className="amount gradient-text">₹{monthlyPrice}</span>
              <span className="period">/ month</span>
            </div>
            <ul>
              <li>Unlimited AI generations</li>
              <li>All 30 premium tools</li>
              <li>Priority Gemini processing</li>
              <li>Email support</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={() => handleUpgrade('pro_monthly')}
              disabled={
                loading !== null ||
                (!!user && hasActivePro) ||
                !cashfreeReady ||
                !isApiConfigured()
              }
            >
              {loading === 'pro_monthly'
                ? 'Opening checkout...'
                : user
                  ? subscriptionExpired
                    ? 'Renew Pro Monthly'
                    : 'Upgrade Now'
                  : 'Log in to Upgrade'}
            </button>
          </div>

          <div className="pricing-card glass-card">
            <h3>Pro Annual</h3>
            <div className="price price-annual">
              <div className="price-main">
                <span className="amount gradient-text">₹{yearlyPrice.toLocaleString('en-IN')}</span>
                <span className="period">/ year</span>
              </div>
              <span className="price-compare" aria-label={`Was ₹${yearlyComparePrice.toLocaleString('en-IN')}`}>
                ₹{yearlyComparePrice.toLocaleString('en-IN')}
              </span>
            </div>
            <ul>
              <li>Unlimited AI generations</li>
              <li>Full year of Pro access</li>
              <li>All 30 premium tools</li>
              <li>Priority support</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={() => handleUpgrade('pro_yearly')}
              disabled={
                loading !== null ||
                (!!user && hasActivePro) ||
                !cashfreeReady ||
                !isApiConfigured()
              }
            >
              {loading === 'pro_yearly'
                ? 'Opening checkout...'
                : user
                  ? subscriptionExpired
                    ? 'Renew Pro Annual'
                    : 'Subscribe Yearly'
                  : 'Log in to Subscribe'}
            </button>
          </div>
        </div>
        )}

        <p className="pricing-note">
          Secure payments powered by Cashfree
          {paymentPlans?.mode === 'sandbox' && ' · Sandbox mode for testing'}
        </p>
      </div>
    </main>
  );
}
