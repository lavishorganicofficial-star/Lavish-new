import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';
import { 
  sendWhatsAppOrderPacked, 
  sendWhatsAppOrderShipped, 
  sendWhatsAppOrderDelivered, 
  sendWhatsAppOrderCancelled 
} from '@/lib/whatsapp';
import { createOrderNotification } from '@/lib/notifications';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail
} from '@/lib/email';

const VALID_STATUSES = [
  'pending', 'awaiting_cod_confirmation', 'confirmed', 'processing',
  'packed', 'shipped', 'out_for_delivery', 'delivered',
  'cancelled', 'returned', 'refunded',
];

/**
 * PATCH /api/admin/orders/[id]
 * Updates order status. Admin-only via service-role client.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const { id } = await params;
  const body = await request.json() as {
    status?: string;
    tracking_number?: string;
    courier_name?: string;
    notes?: string;
    payment_status?: string;
    payment_reference?: string;
  };

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }
    payload.status = body.status;

    // Log timestamps
    const now = new Date().toISOString();
    if (body.status === 'confirmed') payload.confirmed_at = now;
    if (body.status === 'packed') payload.packed_at = now;
    if (body.status === 'shipped') payload.shipped_at = now;
    if (body.status === 'delivered') payload.delivered_at = now;
  }

  if (body.tracking_number !== undefined) payload.tracking_number = body.tracking_number;
  if (body.courier_name !== undefined) payload.courier_name = body.courier_name;
  if (body.notes !== undefined) payload.notes = body.notes;

  // Payment recording by admin
  const VALID_PAYMENT_STATUSES = ['pending', 'cod_pending', 'paid', 'failed', 'refunded'];
  if (body.payment_status !== undefined) {
    if (!VALID_PAYMENT_STATUSES.includes(body.payment_status)) {
      return NextResponse.json({ success: false, error: 'Invalid payment_status' }, { status: 400 });
    }
    payload.payment_status = body.payment_status;
  }
  if (body.payment_reference !== undefined) payload.payment_reference = body.payment_reference;

  const { data, error } = await adminDb
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select('*, items:order_items(*, product:products(name), variant:product_variants(value))')
    .single();

  if (error) {
    console.error('[PATCH admin/orders]', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Handle Notifications (WhatsApp, In-App, Email)
  if (body.status !== undefined) {
    // 1. In-App Notification (only for registered users)
    if (!data.is_guest && data.user_id) {
      await createOrderNotification(adminDb, data as any, body.status);
    }

    // 2. Email Notification
    const emailTo = data.is_guest ? data.guest_email : (await adminDb.auth.admin.getUserById(data.user_id)).data.user?.email;
    if (emailTo) {
      try {
        if (body.status === 'confirmed') await sendOrderConfirmationEmail(emailTo, data as any);
        if (body.status === 'shipped') await sendOrderShippedEmail(emailTo, data as any);
        if (body.status === 'delivered') await sendOrderDeliveredEmail(emailTo, data as any);
      } catch (err) {
        console.error('[Email Dispatch Failed]', err);
      }
    }

    // 3. WhatsApp Notification
    if (data.shipping_address) {
      const phone = data.shipping_address.phone;
      const orderParams = {
        phone,
        orderNumber: data.order_number,
        orderId: data.id
      };

      if (body.status === 'packed') {
        sendWhatsAppOrderPacked(orderParams).catch(console.error);
      } else if (body.status === 'shipped') {
        sendWhatsAppOrderShipped({
          ...orderParams,
          courierName: data.courier_name || 'Our Delivery Partner',
          trackingNumber: data.tracking_number || 'N/A',
          trackingUrl: data.tracking_url || '#',
          expectedDate: '3-5 business days'
        }).catch(console.error);
      } else if (body.status === 'delivered') {
        sendWhatsAppOrderDelivered(orderParams).catch(console.error);
      } else if (body.status === 'cancelled') {
        sendWhatsAppOrderCancelled({
          ...orderParams,
          reason: body.notes || 'Order was cancelled.',
          supportPhone: '9558770307'
        }).catch(console.error);
      }
    }
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);

  return NextResponse.json({ success: true, data });
}
