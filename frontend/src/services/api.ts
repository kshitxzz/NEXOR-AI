const API_BASE = import.meta.env.VITE_API_URL || '';

export interface UserPlan {
  plan: 'free' | 'pro';
  planExpiresAt: string | null;
  email?: string | null;
  dailyLimit: number | null;
  dailyUsed: number;
  remaining: number | null;
}

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;

export function setAuthTokenGetter(getter: TokenGetter) {
  tokenGetter = getter;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, authRequired = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authRequired) {
    const token = await tokenGetter();
    if (!token) {
      const err = new Error('Please log in to continue.') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Request failed') as Error & {
      status?: number;
      upgrade?: boolean;
      data?: unknown;
    };
    err.status = res.status;
    err.upgrade = data.upgrade;
    err.data = data;
    throw err;
  }

  return data as T;
}

export async function generateContent(toolId: string, input: string) {
  return apiFetch<{
    success: boolean;
    output: string;
    usage?: Pick<UserPlan, 'plan' | 'dailyLimit' | 'dailyUsed' | 'remaining'>;
  }>('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ toolId, input }),
  });
}

export async function fetchUserPlan(): Promise<UserPlan> {
  return apiFetch<UserPlan>('/api/user/plan');
}

export interface PaymentPlans {
  plans: {
    pro_monthly: { amount: number; currency: string; label: string };
    pro_yearly: { amount: number; currency: string; label: string };
  };
  cashfreeConfigured: boolean;
  mode: 'sandbox' | 'production';
}

export async function fetchPaymentPlans(): Promise<PaymentPlans> {
  return apiFetch<PaymentPlans>('/api/payment/plans', {}, false);
}

export async function createPaymentOrder(planType: 'pro_monthly' | 'pro_yearly') {
  return apiFetch<{
    success: boolean;
    orderId: string;
    paymentSessionId: string;
    cashfreeMode: 'sandbox' | 'production';
    amount: number;
  }>('/api/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({ planType }),
  });
}

export async function verifyPayment(orderId: string) {
  return apiFetch<{
    success: boolean;
    status: string;
    plan?: string;
  }>('/api/payment/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}
