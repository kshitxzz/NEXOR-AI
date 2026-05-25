import { load } from '@cashfreepayments/cashfree-js';

type CashfreeMode = 'sandbox' | 'production';

const cashfreeCache: Partial<Record<CashfreeMode, Awaited<ReturnType<typeof load>>>> = {};

async function getCashfree(mode: CashfreeMode) {
  if (!cashfreeCache[mode]) {
    cashfreeCache[mode] = await load({ mode });
  }
  return cashfreeCache[mode];
}

export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: CashfreeMode = 'sandbox'
) {
  const cashfree = await getCashfree(mode);
  if (!cashfree) {
    throw new Error('Cashfree SDK failed to load');
  }

  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_self',
  });
}
