/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
} from '@/lib/email';
import {
  sendWhatsAppOrderConfirmed,
} from '@/lib/whatsapp';
import type { ApiResponse } from '@/types';

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature after frontend checkout completes.
 * Updates order payment_status and sends confirmation notifications.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Verify the HMAC signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Log suspicious activity
      console.error(`[Payment Verify] Invalid signature for order ${order_id} by user ${user.id}`);
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // Fetch order (verify it belongs to this user)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.payment_status === 'paid') {
      // Already confirmed — idempotent response
      return NextResponse.json<ApiResponse<{ order_number: string }>>({
        success: true,
        data: { order_number: order.order_number },
        message: 'Order already confirmed',
      });
    }

    // Update order to confirmed + paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('[Payment Verify] Update error:', updateError);
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Generate GST invoice number
    const { data: invoiceData } = await supabase.rpc('generate_gst_invoice_number');
    if (invoiceData) {
      await supabase
        .from('orders')
        .update({ gst_invoice_number: invoiceData })
        .eq('id', order_id);
    }

    // Send notifications (non-blocking — don't fail the payment if these fail)
    const customerEmail = user.email;
    const customerPhone = (order.shipping_address as { phone?: string })?.phone;
    const customerName = (order.shipping_address as { name?: string })?.name ?? 'Customer';
    const updatedOrder = { ...order, payment_status: 'paid', status: 'confirmed' };

    if (customerEmail) {
      sendOrderConfirmationEmail(customerEmail, updatedOrder as any).catch((err) =>
        console.error('[Payment Verify] Email send failed:', err)
      );
    }

    if (customerPhone) {
      sendWhatsAppOrderConfirmed({
        phone: customerPhone,
        customerName,
        orderNumber: order.order_number,
        total: order.total,
        itemCount: order.items?.length || 0,
        orderId: order.id
      }).catch((err) =>
        console.error('[Payment Verify] WhatsApp send failed:', err)
      );
    }

    return NextResponse.json<ApiResponse<{ order_number: string; gst_invoice_number: string | null }>>({
      success: true,
      data: {
        order_number: order.order_number,
        gst_invoice_number: invoiceData ?? null,
      },
      message: 'Payment verified successfully',
    });
  } catch (err) {
    console.error('[POST /api/payment/verify] Unexpected error:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

