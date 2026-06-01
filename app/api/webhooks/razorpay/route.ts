/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, fetchPayment } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { sendWhatsAppOrderConfirmed } from '@/lib/whatsapp';
import type { RazorpayWebhookPayload } from '@/types';

/**
 * POST /api/webhooks/razorpay
 *
 * Receives Razorpay server-to-server webhook events.
 * [FIX #5] — Critical for async payment methods like UPI where
 * the frontend callback may not fire reliably.
 *
 * Webhook secret is verified via HMAC-SHA256.
 * Register this URL in Razorpay Dashboard → Webhooks.
 *
 * Events handled:
 * - payment.captured → mark order as paid
 * - payment.failed   → mark order as failed
 * - refund.processed → mark order as refunded
 *
 * IMPORTANT: This route is excluded from middleware (see matcher in middleware.ts)
 * and must use raw body for signature verification.
 */

// Service-role admin client (no cookie dependency — webhook has no session)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  // Verify webhook signature
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.error('[Razorpay Webhook] Invalid signature — potential replay attack');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event } = payload;
  console.log(`[Razorpay Webhook] Received event: ${event}`);

  try {
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.notes?.order_id;
        if (!orderId) {
          console.warn('[Razorpay Webhook] payment.captured — no order_id in notes');
          break;
        }

        // Fetch our order
        const { data: order } = await adminSupabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', orderId)
          .single();

        if (!order) {
          console.error(`[Razorpay Webhook] Order not found: ${orderId}`);
          break;
        }

        // Idempotency: skip if already confirmed
        if (order.payment_status === 'paid') {
          console.log(`[Razorpay Webhook] Order ${orderId} already confirmed`);
          break;
        }

        // Update order
        await adminSupabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            razorpay_payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        // Generate GST invoice
        const { data: invoiceNum } = await adminSupabase.rpc('generate_gst_invoice_number');
        if (invoiceNum) {
          await adminSupabase
            .from('orders')
            .update({ gst_invoice_number: invoiceNum })
            .eq('id', orderId);
        }

        // Notifications (non-blocking)
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', order.user_id)
          .single();

        const { data: userAuth } = await adminSupabase.auth.admin.getUserById(order.user_id);
        const email = userAuth?.user?.email;
        const phone = profile?.phone ?? (order.shipping_address as any)?.phone;
        const name = profile?.full_name ?? (order.shipping_address as any)?.name ?? 'Customer';
        const updatedOrder = { ...order, payment_status: 'paid', status: 'confirmed' };

        if (email) {
          sendOrderConfirmationEmail(email, updatedOrder as any).catch(console.error);
        }
        if (phone) {
          sendWhatsAppOrderConfirmed({
            phone,
            customerName: name,
            orderNumber: updatedOrder.order_number,
            total: updatedOrder.total,
            itemCount: updatedOrder.items?.length || 0,
            orderId: updatedOrder.id
          }).catch(console.error);
        }

        console.log(`[Razorpay Webhook] payment.captured — order ${orderId} confirmed`);
        break;
      }

      case 'payment.failed': {
        const payment = payload.payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.notes?.order_id;
        if (!orderId) break;

        await adminSupabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        console.log(`[Razorpay Webhook] payment.failed — order ${orderId}`);
        break;
      }

      case 'refund.processed': {
        const refund = payload.payload.refund?.entity;
        if (!refund) break;

        // Find order by razorpay_payment_id
        const { data: order } = await adminSupabase
          .from('orders')
          .select('id')
          .eq('razorpay_payment_id', refund.payment_id)
          .single();

        if (order) {
          await adminSupabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
          console.log(`[Razorpay Webhook] refund.processed — order ${order.id}`);
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }
  } catch (err) {
    console.error(`[Razorpay Webhook] Handler error for event ${event}:`, err);
    // Return 200 to prevent Razorpay retrying — log the error internally
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

