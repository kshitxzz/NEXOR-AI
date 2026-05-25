import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createPaymentOrder,
  fetchPaymentPlans,
  getYearlyPlanAmount,
  type PaymentPlans,
} from '../services/api';
import { useUser } from '../context/UserContext';
import { openCashfreeCheckout } from '../utils/cashfreeCheckout';
import { API_NOT_CONFIGURED_MSG, isApiConfigured } from '../utils/apiConfig';
import './Pricing.css';

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlans | null>(null);

  useEffect(() => {
    fetchPaymentPlans()
      .then((data) => {
        if (data?.plans?.pro_monthly) {
          setPaymentPlans(data);
        } else {
          throw new Error('Invalid plans response');
        }
      })
      .catch(() => {
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

        {plan && (
          <p className="current-plan">
            Current plan: <strong>{plan.plan === 'pro' ? 'Pro' : 'Free'}</strong>
            {plan.plan === 'free' && plan.remaining !== null && (
              <> · {plan.remaining} generations left today</>
            )}
          </p>
        )}

        {!cashfreeReady && (
          <div className="pricing-warning glass-card">
            Payments are not configured yet. Add your Cashfree PG sandbox keys to{' '}
            <code>backend/.env</code> and restart the API server.
          </div>
        )}

        {!isApiConfigured() && (
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
                (!!user && plan?.plan === 'pro') ||
                !cashfreeReady ||
                !isApiConfigured()
              }
            >
              {loading === 'pro_monthly'
                ? 'Opening checkout...'
                : user
                  ? 'Upgrade Now'
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
                (!!user && plan?.plan === 'pro') ||
                !cashfreeReady ||
                !isApiConfigured()
              }
            >
              {loading === 'pro_yearly'
                ? 'Opening checkout...'
                : user
                  ? 'Subscribe Yearly'
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
