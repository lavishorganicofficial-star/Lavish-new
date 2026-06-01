// lib/referral.ts
// Handles ?ref= captures and persists in localStorage for 30 days

export function captureReferral(searchParams: URLSearchParams): void {
  // Execute only in browser environment
  if (typeof window === 'undefined') return;

  const ref = searchParams.get('ref');
  if (!ref) return;

  // Store in localStorage (persists 30 days)
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem('lo_ref', JSON.stringify({
    code: ref.toUpperCase(),
    expires,
    capturedAt: new Date().toISOString(),
    landingPage: window.location.pathname
  }));
}

export function getReferral(): { code: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('lo_ref');
    if (!stored) return null;
    const data = JSON.parse(stored);
    
    // Check expiration
    if (Date.now() > data.expires) {
      localStorage.removeItem('lo_ref');
      return null;
    }
    return { code: data.code };
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lo_ref');
}
