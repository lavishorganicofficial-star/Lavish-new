'use client';

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, getSessionId, getVisitorId } from '@/lib/analytics';
import { captureReferral } from '@/lib/referral';

function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const referralCaptured = useRef(false);

  useEffect(() => {
    // Normal page view tracking
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const ref = searchParams?.get('ref');
    if (ref && !referralCaptured.current) {
      referralCaptured.current = true;
      // Store in localStorage
      captureReferral(searchParams);

      // Record the click in DB
      fetch('/api/referral/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: ref,
          landingPage: pathname || window.location.pathname,
          referrer: document.referrer,
          sessionId: getSessionId(),
          visitorId: getVisitorId()
        })
      }).catch(() => {});
    }
  }, [searchParams, pathname]);

  return null;
}

export function GlobalTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
