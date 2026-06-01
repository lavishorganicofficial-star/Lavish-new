import Razorpay from 'razorpay';
import crypto from 'crypto';
import type {
  CreateRazorpayOrderInput,
  RazorpayOrderResponse,
} from '@/types';

// Lazy initialize Razorpay instance
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }
  return razorpayInstance;
}

/**
 * Creates a Razorpay order server-side.
 * Amount must be in paise (multiply rupees by 100).
 */
export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrderResponse> {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: input.amount,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes ?? {},
  });

  return order as unknown as RazorpayOrderResponse;
}

/**
 * Verifies the payment signature from Razorpay frontend callback.
 * Called after Razorpay checkout modal closes with success.
 *
 * Signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyPaymentSignature(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

/**
 * Verifies the webhook signature from Razorpay server-to-server events.
 * [FIX #5] — essential for UPI payments that have async confirmation.
 *
 * Signature = HMAC-SHA256(raw_body, webhook_secret)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Initiates a refund via Razorpay.
 * @param paymentId - The Razorpay payment ID (pay_xxx)
 * @param amountPaise - Amount to refund in paise. If omitted, full refund.
 */
export async function refundPayment(
  paymentId: string,
  amountPaise?: number
): Promise<{ id: string; amount: number; status: string }> {
  const refundData: { amount?: number } = {};
  if (amountPaise) {
    refundData.amount = amountPaise;
  }

  const razorpay = getRazorpay();
  const refund = await razorpay.payments.refund(paymentId, refundData);
  return refund as unknown as { id: string; amount: number; status: string };
}

/**
 * Fetches a payment by ID (for webhook verification fallback).
 */
export async function fetchPayment(paymentId: string) {
  const razorpay = getRazorpay();
  return razorpay.payments.fetch(paymentId);
}
