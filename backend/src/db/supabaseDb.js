import { getSupabaseAdmin } from '../services/supabase.js';

function db() {
  return getSupabaseAdmin();
}

export async function getOrCreateProfile(userId, email = null) {
  const supabase = db();

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: userId, email, plan: 'free' })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: retry } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return retry;
    }
    throw new Error(error.message);
  }

  return created;
}

export async function getDailyUsageCount(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await db()
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('used_at', today);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function recordUsage(userId, toolId) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await db().from('usage_logs').insert({
    user_id: userId,
    tool_id: toolId,
    used_at: today,
  });
  if (error) throw new Error(error.message);
}

export async function setUserPlan(userId, plan, expiresAt = null) {
  const { error } = await db()
    .from('profiles')
    .update({
      plan,
      plan_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function createOrder(orderId, userId, planType, amount, sessionId) {
  const { error } = await db().from('orders').insert({
    order_id: orderId,
    user_id: userId,
    plan_type: planType,
    amount,
    payment_session_id: sessionId,
    status: 'pending',
  });
  if (error) throw new Error(error.message);
}

export async function getOrder(orderId) {
  const { data, error } = await db().from('orders').select('*').eq('order_id', orderId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await db().from('orders').update({ status }).eq('order_id', orderId);
  if (error) throw new Error(error.message);
}
