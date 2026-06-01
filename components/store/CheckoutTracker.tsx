'use client';

import { useEffect } from 'react';
import { trackCheckoutStart } from '@/lib/analytics';

export function CheckoutTracker() {
  useEffect(() => {
    trackCheckoutStart();
  }, []);

  return null;
}
