/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/email';
import { sendWhatsAppOrderShipped, sendWhatsAppOrderDelivered } from '@/lib/whatsapp';
import type { ApiResponse, Order, OrderStatus } from '@/types';

/**
 * GET /api/orders/[id]
 * Fetch a single order by ID.
 * Users can only fetch their own orders; admins can fetch any.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)
      .single();


    if (error || !order) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const userRole = (user.app_metadata as { user_role?: string })?.user_role;
    if (userRole !== 'admin' && order.user_id !== user.id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order as unknown as Order,
    });
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Updates order status. Admin only for most transitions.
 * Triggers logistics notifications on status change.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (user.app_metadata as { user_role?: string })?.user_role;
    const isAdmin = userRole === 'admin';

    const body = await request.json();
    const { status, tracking_number, tracking_url, estimated_delivery, shiprocket_order_id } = body;

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)

      .single();

    if (fetchError || !order) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only admin can update status (except customer cancellation of pending COD)
    if (!isAdmin) {
      const canCancel =
        body.status === 'cancelled' &&
        ['awaiting_cod_confirmation', 'pending'].includes(order.status) &&
        order.user_id === user.id;

      if (!canCancel) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const updateData: Partial<Order> & Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status as OrderStatus;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (tracking_url) updateData.tracking_url = tracking_url;
    if (estimated_delivery) updateData.estimated_delivery = estimated_delivery;
    if (shiprocket_order_id) updateData.shiprocket_order_id = shiprocket_order_id;

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

      .select()
      .single();

    if (updateError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // ---- Send status-change notifications ----
    if (status && status !== order.status) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', order.user_id)
        .single();

      const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
      const email = authUser?.user?.email;
      const phone = profile?.phone ?? (order.shipping_address as any)?.phone;
      const name = profile?.full_name ?? (order.shipping_address as any)?.name ?? 'Customer';
      const updatedOrder = { ...order, ...updateData } as any;

      if (status === 'shipped') {
        if (email) sendOrderShippedEmail(email, updatedOrder).catch(console.error);
        await sendWhatsAppOrderShipped({
          phone: phone || '',
          orderNumber: updatedOrder.order_number,
          courierName: updatedOrder.shipping_provider || 'Courier',
          trackingNumber: updatedOrder.tracking_number || 'N/A',
          trackingUrl: updatedOrder.tracking_url || 'N/A',
          expectedDate: updatedOrder.expected_delivery_date || 'Soon',
          orderId: updatedOrder.id
        }).catch(console.error);
      } else if (status === 'delivered') {
        if (email) sendOrderDeliveredEmail(email, updatedOrder).catch(console.error);
        await sendWhatsAppOrderDelivered({
          phone: phone || '',
          orderNumber: updatedOrder.order_number,
          orderId: updatedOrder.id
        }).catch(console.error);
      }
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: updated as unknown as Order,
      message: 'Order updated successfully',
    });
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
