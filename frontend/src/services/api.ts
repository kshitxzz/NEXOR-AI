import { API_NOT_CONFIGURED_MSG, isApiConfigured, resolveApiUrl } from '../utils/apiConfig';

export interface UserPlan {
  plan: 'free' | 'pro';
  planExpiresAt: string | null;
  /** True when a paid Pro period ended — user must renew (not regular free tier). */
  subscriptionLapsed?: boolean;
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

  if (import.meta.env.PROD && !isApiConfigured() && path.startsWith('/api')) {
    const err = new Error(API_NOT_CONFIGURED_MSG) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(path), {
      ...options,
      headers,
    });
  } catch {
    const err = new Error(
      isApiConfigured()
        ? 'Cannot reach the API server. Check that the backend is running and CORS allows this site.'
        : API_NOT_CONFIGURED_MSG
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!isJson) {
    const err = new Error(
      import.meta.env.PROD && !isApiConfigured()
        ? API_NOT_CONFIGURED_MSG
        : 'Server returned an invalid response. The API URL may be wrong or the backend is down.'
    ) as Error & { status?: number };
    err.status = res.status || 502;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Request failed') as Error & {
      status?: number;
      upgrade?: boolean;
      planExpired?: boolean;
      data?: unknown;
    };
    err.status = res.status;
    err.upgrade = data.upgrade;
    err.planExpired = data.planExpired;
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

export interface PlanPrice {
  amount: number;
  currency: string;
  label: string;
}

export interface PaymentPlans {
  plans: {
    pro_monthly: PlanPrice;
    pro_yearly?: PlanPrice;
    /** @deprecated Old API shape — still supported for backward compatibility */
    pro_onetime?: PlanPrice;
  };
  cashfreeConfigured: boolean;
  mode: 'sandbox' | 'production';
}

export function getYearlyPlanAmount(plans: PaymentPlans['plans'] | undefined): number {
  return plans?.pro_yearly?.amount ?? plans?.pro_onetime?.amount ?? 4999;
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
