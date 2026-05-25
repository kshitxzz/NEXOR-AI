import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/api';
import { useUser } from '../context/UserContext';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { refreshPlan } = useUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setMessage('No order ID found.');
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPayment(orderId);
        await refreshPlan();
        if (result.success && result.status === 'paid') {
          setStatus('success');
          setMessage('Your Pro plan is now active. Enjoy unlimited AI generations!');
        } else {
          setStatus('pending');
          setMessage('Payment is being processed. Your plan will activate shortly.');
        }
      } catch (err) {
        setStatus('error');
        setMessage((err as Error).message || 'Verification failed. Contact support if charged.');
      }
    };

    verify();
  }, [orderId, refreshPlan]);

  return (
    <main className="payment-result section">
      <div className="container">
        <div className="result-card glass-card">
          {status === 'loading' && (
            <>
              <div className="loader" />
              <h2>Verifying Payment...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <span className="result-icon success">✓</span>
              <h2>Payment Successful!</h2>
              <p>{message}</p>
              <Link to="/tool/youtube-script" className="btn btn-primary">
                Start Using Tools
              </Link>
            </>
          )}
          {status === 'pending' && (
            <>
              <span className="result-icon pending">⏳</span>
              <h2>Processing</h2>
              <p>{message}</p>
              <button className="btn btn-outline" onClick={() => window.location.reload()}>
                Check Again
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="result-icon error">✕</span>
              <h2>Something Went Wrong</h2>
              <p>{message}</p>
              <Link to="/pricing" className="btn btn-primary">
                Back to Pricing
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
