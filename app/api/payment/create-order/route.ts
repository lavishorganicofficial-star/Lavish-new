import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { rupeesToPaise } from '@/lib/utils';
import type { ApiResponse, RazorpayOrderResponse } from '@/types';

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the given amount.
 * Must be called server-side before opening Razorpay checkout modal.
 *
 * Request body: { order_id: string } (our internal order ID)
 * Returns: { razorpay_order_id, amount, currency, key_id }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      );
    }

    // Fetch order from DB to get the total
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, total, user_id, status, payment_status')
      .eq('id', order_id)
      .eq('user_id', user.id)  // Ensure order belongs to user
      .single();

    if (orderError || !order) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: rupeesToPaise(order.total),
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
      },
    });

    // Save Razorpay order ID in our DB
    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order_id);

    return NextResponse.json<ApiResponse<{
      razorpay_order_id: string;
      amount: number;
      currency: string;
      key_id: string;
      order_number: string;
    }>>({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        order_number: order.order_number,
      },
    });
  } catch (err) {
    console.error('[POST /api/payment/create-order] Error:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
