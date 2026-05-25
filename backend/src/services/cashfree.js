const CASHFREE_BASE = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};

export const PLAN_PRICES = {
  pro_monthly: 499,
  pro_yearly: 4999,
};

const PLACEHOLDER_PATTERNS = [
  'your_cashfree',
  'your-cashfree',
  'xxx',
  'placeholder',
  'changeme',
];

export function isCashfreeConfigured() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) return false;
  const combined = `${appId}${secret}`.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => combined.includes(p));
}

function getBaseUrl() {
  const env = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
  return CASHFREE_BASE[env];
}

export function getCashfreeMode() {
  return process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
}

function getApiVersion() {
  return process.env.CASHFREE_API_VERSION?.trim() || '2025-01-01';
}

function getHeaders() {
  if (!isCashfreeConfigured()) {
    throw new Error(
      'Cashfree is not configured. Add your Payment Gateway App ID and Secret Key from https://merchant.cashfree.com/merchants/pg/developers/api-keys to backend/.env (use Sandbox keys for testing).'
    );
  }

  return {
    'Content-Type': 'application/json',
    'x-client-id': process.env.CASHFREE_APP_ID.trim(),
    'x-client-secret': process.env.CASHFREE_SECRET_KEY.trim(),
    'x-api-version': getApiVersion(),
  };
}

function parseCashfreeError(data, status) {
  const message =
    data?.message ||
    data?.error?.message ||
    data?.error_description ||
    (typeof data?.error === 'string' ? data.error : null) ||
    'Cashfree request failed';

  if (data?.type === 'authentication_error' || /authentication/i.test(message)) {
    return (
      'Cashfree authentication failed. Use Payment Gateway (PG) sandbox App ID and Secret from the Cashfree merchant dashboard — not Payout keys. Ensure CASHFREE_ENV=sandbox matches your keys.'
    );
  }

  return `${message}${status ? ` (HTTP ${status})` : ''}`;
}

function sanitizeCustomerId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'nexor_user';
}

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return '9876543210';
}

export async function createCashfreeOrder({
  orderId,
  amount,
  customerId,
  customerEmail,
  customerPhone,
  returnUrl,
  notifyUrl,
}) {
  const body = {
    order_id: orderId,
    order_amount: Number(amount),
    order_currency: 'INR',
    customer_details: {
      customer_id: sanitizeCustomerId(customerId),
      customer_email: customerEmail || 'user@nexorai.app',
      customer_phone: sanitizePhone(customerPhone),
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
  };

  const res = await fetch(`${getBaseUrl()}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(parseCashfreeError(data, res.status));
  }

  const paymentSessionId =
    data.payment_session_id || data.payment_sessions_id || data.data?.payment_session_id;

  if (!paymentSessionId) {
    throw new Error('Cashfree did not return a payment session ID. Check API credentials and version.');
  }

  return { ...data, payment_session_id: paymentSessionId };
}

export async function verifyOrderPayment(orderId) {
  const res = await fetch(`${getBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(parseCashfreeError(data, res.status));
  }

  return data;
}
