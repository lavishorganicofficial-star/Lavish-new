export type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'search' | 'share_product' | 'checkout_start' | 'checkout_complete' | 'coupon_apply';

interface TrackingData {
  pagePath?: string;
  productId?: string;
  searchQuery?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a UUIDv4
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('lo_session_id');
  if (!sid) {
    sid = uuidv4();
    sessionStorage.setItem('lo_session_id', sid);
  }
  return sid;
}

export function getVisitorId() {
  if (typeof window === 'undefined') return '';
  let vid = localStorage.getItem('lo_visitor_id');
  if (!vid) {
    vid = uuidv4();
    localStorage.setItem('lo_visitor_id', vid);
  }
  return vid;
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getUtmParams() {
  if (typeof window === 'undefined') return { source: '', medium: '', campaign: '' };
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || ''
  };
}

export async function track(eventType: EventType, data?: TrackingData): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const visitorId = getVisitorId();
  const deviceType = getDeviceType();
  const utmParams = getUtmParams();

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      visitorId,
      eventType,
      ...data,
      deviceType,
      referrer: document.referrer,
      utmSource: utmParams.source,
      utmMedium: utmParams.medium,
      utmCampaign: utmParams.campaign,
    })
  }).catch(() => {}); // silently ignore failures
}

export const trackPageView = (path: string) => track('page_view', { pagePath: path });
export const trackProductView = (productId: string) => track('product_view', { productId });
export const trackAddToCart = (productId: string, qty: number) => track('add_to_cart', { productId, metadata: { qty } });
export const trackRemoveCart = (productId: string) => track('remove_from_cart', { productId });
export const trackWishlist = (productId: string) => track('add_to_wishlist', { productId });
export const trackSearch = (query: string, count: number) => track('search', { searchQuery: query, metadata: { resultCount: count } });
export const trackShare = (productId: string, platform: string) => track('share_product', { productId, metadata: { platform } });
export const trackCheckoutStart = () => track('checkout_start');
export const trackCheckoutComplete = (orderId: string, total: number) => track('checkout_complete', { metadata: { orderId, total } });
export const trackCouponApply = (code: string, success: boolean) => track('coupon_apply', { metadata: { code, success } });
