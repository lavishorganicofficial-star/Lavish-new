'use client';

import { useEffect } from 'react';
import { trackCheckoutComplete } from '@/lib/analytics';

export function CheckoutSuccessTracker({ orderId, total }: { orderId: string; total: number }) {
  useEffect(() => {
    trackCheckoutComplete(orderId, total);
  }, [orderId, total]);

  return null;
}
