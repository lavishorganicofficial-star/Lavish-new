'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/analytics';

export function ProductTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackProductView(productId);
  }, [productId]);

  return null;
}
