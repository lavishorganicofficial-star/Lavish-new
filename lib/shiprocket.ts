/**
 * lib/shiprocket.ts
 * Shiprocket logistics integration.
 *
 * Token persistence strategy [FIX #4]:
 * JWT is stored in Supabase `shiprocket_tokens` table (single-row pattern).
 * On every API call, we check if the token is still valid (>30 min remaining).
 * If expired or missing, we re-authenticate and upsert the new token.
 * This works correctly in serverless environments where in-memory caching is lost
 * between function invocations.
 */

import { createClient } from '@supabase/supabase-js';
import { addMinutes, parseISO, isAfter } from 'date-fns';
import type {
  ShiprocketAuthResponse,
  ShiprocketCreateOrderPayload,
  ShiprocketTrackingResponse,
  ShiprocketServiceabilityResponse,
} from '@/types';

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Service role client — needed to bypass RLS on shiprocket_tokens table
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Fetches a valid Shiprocket JWT token.
 * Checks Supabase cache first; re-authenticates if expired.
 */
async function getAuthToken(): Promise<string> {
  // Check cached token
  const { data: cached } = await adminSupabase
    .from('shiprocket_tokens')
    .select('token, expires_at')
    .eq('id', 1)
    .single();

  // Return cached token if it's valid for >30 more minutes
  if (cached?.token && cached.expires_at) {
    const expiresAt = parseISO(cached.expires_at);
    const validUntil = addMinutes(new Date(), 30);
    if (isAfter(expiresAt, validUntil)) {
      return cached.token;
    }
  }

  // Re-authenticate with Shiprocket
  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL!,
      password: process.env.SHIPROCKET_PASSWORD!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shiprocket auth failed: ${response.statusText}`);
  }

  const auth: ShiprocketAuthResponse = await response.json();

  // Cache the token — expires in 24 hours per Shiprocket docs
  const expiresAt = addMinutes(new Date(), 23 * 60); // 23 hours to be safe

  await adminSupabase.from('shiprocket_tokens').upsert({
    id: 1,
    token: auth.token,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  return auth.token;
}

/**
 * Helper: make authenticated Shiprocket API request.
 */
async function shiprocketFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Shiprocket API error [${response.status}]: ${JSON.stringify(data)}`
    );
  }

  return data as T;
}

/**
 * Creates a new order in Shiprocket.
 */
export async function createShiprocketOrder(
  payload: ShiprocketCreateOrderPayload
): Promise<{ order_id: number; shipment_id: number; status: string }> {
  return shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Assigns an AWB (tracking number) to a shipment.
 */
export async function assignAWB(
  shipmentId: number,
  courierCompanyId?: number
): Promise<{ awb_code: string; courier_name: string }> {
  return shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierCompanyId,
    }),
  });
}

/**
 * Schedules a pickup for a shipment.
 */
export async function schedulePickup(
  shipmentId: number
): Promise<{ pickup_status: number; response: string }> {
  return shiprocketFetch('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/**
 * Tracks a shipment by AWB code.
 */
export async function trackShipment(awb: string): Promise<ShiprocketTrackingResponse> {
  return shiprocketFetch(`/courier/track/awb/${awb}`);
}

/**
 * Checks courier serviceability for a delivery pincode.
 * Used in product detail page "Check Delivery" and checkout.
 */
export async function checkServiceability(
  deliveryPincode: string,
  weightGrams: number = 500
): Promise<ShiprocketServiceabilityResponse> {
  const pickupPostcode = process.env.PICKUP_POSTCODE ?? '380001';
  const weightKg = weightGrams / 1000;
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPincode,
    weight: weightKg.toString(),
    cod: '0',
  });

  return shiprocketFetch(`/courier/serviceability/?${params.toString()}`);
}

/**
 * Generates a shipping label PDF URL for an order.
 */
export async function generateShippingLabel(
  shipmentIds: number[]
): Promise<{ label_url: string }> {
  return shiprocketFetch('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}

/**
 * Cancels a Shiprocket order.
 */
export async function cancelShiprocketOrder(
  orderIds: number[]
): Promise<{ message: string; status: string }> {
  return shiprocketFetch('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: orderIds }),
  });
}
