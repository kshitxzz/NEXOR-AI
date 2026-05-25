import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createCashfreeOrder,
  verifyOrderPayment,
  PLAN_PRICES,
  getCashfreeMode,
  isCashfreeConfigured,
} from '../services/cashfree.js';
import {
  getOrCreateProfile,
  createOrder,
  getOrder,
  updateOrderStatus,
  setUserPlan,
} from '../db/supabaseDb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getPlanExpiresAt(planType) {
  if (planType === 'pro_monthly') {
    return new Date(Date.now() + 30 * MS_PER_DAY).toISOString();
  }
  if (planType === 'pro_yearly' || planType === 'pro_onetime') {
    return new Date(Date.now() + 365 * MS_PER_DAY).toISOString();
  }
  return null;
}

router.get('/plans', (_req, res) => {
  res.json({
    plans: {
      pro_monthly: { amount: PLAN_PRICES.pro_monthly, currency: 'INR', label: 'Pro Monthly' },
      pro_yearly: { amount: PLAN_PRICES.pro_yearly, currency: 'INR', label: 'Pro Annual' },
    },
    cashfreeConfigured: isCashfreeConfigured(),
    mode: getCashfreeMode(),
  });
});

router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.userId;

    const validPlans = ['pro_monthly', 'pro_yearly'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ error: 'Invalid planType', validPlans });
    }

    const amount = PLAN_PRICES[planType];
    const orderId = `nexor_${uuidv4().replace(/-/g, '').slice(0, 20)}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await getOrCreateProfile(userId, req.authUser.email);

    const orderData = await createCashfreeOrder({
      orderId,
      amount,
      customerId: userId,
      customerEmail: req.authUser.email || req.body.email,
      customerPhone: req.body.phone,
      returnUrl: `${frontendUrl}/payment/success?order_id={order_id}`,
      notifyUrl: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/payment/webhook`,
    });

    const paymentSessionId = orderData.payment_session_id;
    await createOrder(orderId, userId, planType, amount, paymentSessionId);

    res.json({
      success: true,
      orderId,
      paymentSessionId,
      cashfreeMode: getCashfreeMode(),
      amount,
      currency: 'INR',
    });
  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({
      error: 'Failed to create order',
      message: err.message,
    });
  }
});

router.post('/verify-payment', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const localOrder = await getOrder(orderId);
    if (!localOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (localOrder.user_id !== req.userId) {
      return res.status(403).json({ error: 'Order does not belong to this account' });
    }

    const cfOrder = await verifyOrderPayment(orderId);
    const paid = cfOrder.order_status === 'PAID' || cfOrder.payment_status === 'SUCCESS';

    if (paid) {
      await updateOrderStatus(orderId, 'paid');
      const expiresAt = getPlanExpiresAt(localOrder.plan_type);
      await setUserPlan(localOrder.user_id, 'pro', expiresAt);

      return res.json({
        success: true,
        status: 'paid',
        plan: 'pro',
        planType: localOrder.plan_type,
        expiresAt,
      });
    }

    res.json({
      success: false,
      status: cfOrder.order_status || 'pending',
      message: 'Payment not completed yet',
    });
  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(500).json({
      error: 'Verification failed',
      message: err.message,
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const orderId = req.body?.data?.order?.order_id || req.body?.orderId;
    const orderStatus = req.body?.data?.order?.order_status || req.body?.orderStatus;

    if (orderId && (orderStatus === 'PAID' || req.body?.type === 'PAYMENT_SUCCESS')) {
      const localOrder = await getOrder(orderId);
      if (localOrder && localOrder.status !== 'paid') {
        await updateOrderStatus(orderId, 'paid');
        const expiresAt = getPlanExpiresAt(localOrder.plan_type);
        await setUserPlan(localOrder.user_id, 'pro', expiresAt);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
