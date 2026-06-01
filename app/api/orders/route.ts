/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { calculateShipping, rupeesToPaise } from '@/lib/utils';
import { sendWhatsAppOrderConfirmed } from '@/lib/whatsapp';
import type { ApiResponse, CreateOrderInput, Order } from '@/types';

/**
 * GET /api/orders
 * Returns all orders for the authenticated user (or all orders for admin).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10'));
    const offset = (page - 1) * limit;

    const userRole = (user.app_metadata as { user_role?: string })?.user_role;
    const isAdmin = userRole === 'admin';

    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Admin sees all orders, customers see only their own
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Admin filters
    if (isAdmin) {
      const status = searchParams.get('status');
      const payment = searchParams.get('payment_status');
      if (status) query = query.eq('status', status);
      if (payment) query = query.eq('payment_status', payment);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ orders: Order[]; total: number; page: number }>>({
      success: true,
      data: {
        orders: (orders ?? []) as unknown as Order[],
        total: count ?? 0,
        page,
      },
    });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates a new order. Validates stock, applies coupon, calculates totals.
 *
 * For COD orders: status = 'awaiting_cod_confirmation'
 * For Razorpay orders: status = 'pending' until payment.captured webhook fires
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: use cookie client to get user identity
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();

    const body = await request.json();
    const { items, shipping_address, billing_address, coupon_code, payment_method, notes, referralCode, visitorId, isGuest, guestName, guestEmail, guestPhone } = body;

    if (!user && !isGuest) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // DB writes: use admin client to bypass RLS
    const supabase = await createAdminClient();

    if (!items?.length || !shipping_address || !payment_method) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'items, shipping_address, and payment_method are required' },
        { status: 400 }
      );
    }

    // ---- 0. Validate COD Ban ----
    if (user && payment_method === 'cod') {
      const { data: profile } = await supabase.from('profiles').select('cod_banned').eq('id', user.id).single();
      if (profile?.cod_banned) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Cash on Delivery is not available for your account. Please use online payment.' },
          { status: 400 }
        );
      }
    }

    // ---- 1. Validate & fetch all products ----
    const productIds = items.map((i: any) => i.product_id);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, compare_price, stock_quantity, sku, gst_rate, hsn_code, track_inventory, images:product_images(url, is_primary)')
      .in('id', productIds)
      .eq('is_active', true);

    if (prodError || !products?.length) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'One or more products not found or inactive' },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check stock for all items
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: `Product not found: ${item.product_id}` },
          { status: 400 }
        );
      }
      if (product.track_inventory && product.stock_quantity < item.quantity) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: `Insufficient stock for: ${product.name}` },
          { status: 400 }
        );
      }
    }

    // ---- 2. Calculate order totals ----
    let subtotal = 0;
    const orderItems: Array<{
      product_id: string;
      variant_id: string | null;
      product_name: string;
      image_url: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
      gst_rate: number;
      hsn_code: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      const primaryImage = (product.images as Array<{ url: string; is_primary: boolean }>)
        ?.find((img) => img.is_primary)?.url ?? null;

      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        product_name: product.name,
        image_url: primaryImage,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        gst_rate: product.gst_rate ?? 18,
        hsn_code: product.hsn_code,
      });
    }

    // ---- 3. Validate coupon & Influencer Attribution ----
    let discountAmount = 0;
    let couponId: string | null = null;
    let influencerId: string | null = null;
    let influencerCode: string | null = null;
    let viaCoupon = false;
    let commissionAmount = 0;
    let commissionRate = 0;

    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        let userUsageCount = 0;
        if (user?.id) {
          const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true })
            .eq('coupon_id', coupon.id)
            .eq('user_id', user.id)
            .neq('status', 'cancelled');
          userUsageCount = count || 0;
        } else if (isGuest && guestPhone) {
          const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true })
            .eq('coupon_id', coupon.id)
            .eq('guest_phone', guestPhone)
            .neq('status', 'cancelled');
          userUsageCount = count || 0;
        }

        const isValid =
          (!validFrom || validFrom <= now) &&
          (!validUntil || validUntil > now) &&
          subtotal >= coupon.min_order_amount &&
          (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) &&
          userUsageCount < (coupon.per_user_limit || 1);

        if (isValid) {
          couponId = coupon.id;
          if (coupon.type === 'percentage' && coupon.value) {
            discountAmount = (subtotal * coupon.value) / 100;
            if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
          } else if (coupon.type === 'fixed' && coupon.value) {
            discountAmount = Math.min(coupon.value, subtotal);
          } else if (coupon.type === 'free_shipping') {
            discountAmount = 0; // handled below
          }

          // Influencer logic via coupon
          if (coupon.influencer_id) {
            const { data: inf } = await supabase
              .from('influencer_profiles')
              .select('*')
              .eq('id', coupon.influencer_id)
              .single();
            if (inf) {
              influencerId = inf.id;
              influencerCode = coupon.code;
              viaCoupon = true;
              commissionRate = inf.commission_rate;
              commissionAmount = (subtotal * inf.commission_rate) / 100;
            }
          }
        }
      }
    }

    // Check referral link if no coupon influencer was found
    if (!influencerId && referralCode) {
      const { data: profileRef } = await supabase
        .from('profiles')
        .select('id, referral_code')
        .ilike('referral_code', referralCode)
        .single();

      if (profileRef) {
        const { data: inf } = await supabase
          .from('influencer_profiles')
          .select('*')
          .eq('id', profileRef.id)
          .single();
        
        if (inf && inf.commission_on_non_coupon_orders) {
          influencerId = inf.id;
          influencerCode = profileRef.referral_code;
          viaCoupon = false;
          commissionRate = inf.non_coupon_commission_rate;
          commissionAmount = (subtotal * inf.non_coupon_commission_rate) / 100;
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Check if coupon is free_shipping type
    const isFreeShippingCoupon =
      coupon_code
        ? await (async () => {
            const { data: c } = await supabase
              .from('coupons')
              .select('type')
              .eq('code', coupon_code.toUpperCase())
              .single();
            return c?.type === 'free_shipping';
          })()
        : false;

    const shippingAmount = isFreeShippingCoupon ? 0 : calculateShipping(discountedSubtotal);

    // ---- 4. Calculate Totals (Respecting GST toggle) ----
    // Get GST setting
    const { data: gstSetting } = await supabase.from('store_settings').select('value').eq('key', 'gst_enabled').single();
    const isGstEnabled = gstSetting?.value?.toString() === 'true';

    // Calculate tax amount based on setting
    let taxAmount = 0;
    if (isGstEnabled) {
      const gstRate = 0.18; // Default flat fallback
      taxAmount = Math.round(discountedSubtotal * (gstRate / (1 + gstRate)) * 100) / 100;
    }

    // COD fee: ₹30 added to total
    const isCOD = payment_method === 'cod';
    const codFee = isCOD ? 30 : 0;
    const total = Math.round((discountedSubtotal + shippingAmount + codFee) * 100) / 100;

    // ---- 4. Determine initial order status ----
    const initialStatus = isCOD ? 'awaiting_cod_confirmation' : 'pending';
    const initialPaymentStatus = isCOD ? 'cod_pending' : 'pending';

    // ---- 5. Auto-generate GST invoice number (Only if GST is enabled) ----
    let gstInvoiceNumber = null;
    if (isGstEnabled) {
      const now = new Date();
      const fy = now.getMonth() >= 3
        ? `${String(now.getFullYear()).slice(2)}${String(now.getFullYear() + 1).slice(2)}`
        : `${String(now.getFullYear() - 1).slice(2)}${String(now.getFullYear()).slice(2)}`;

      const fyStart = now.getMonth() >= 3
        ? new Date(now.getFullYear(), 3, 1)
        : new Date(now.getFullYear() - 1, 3, 1);
      const { count: fyCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', fyStart.toISOString());
      const serial = String((fyCount ?? 0) + 1).padStart(5, '0');
      gstInvoiceNumber = `LVO/${fy}/${serial}`;
    }

    // ---- 6. Insert order ----
    const { data: order, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        is_guest: isGuest ?? false,
        guest_name: isGuest ? guestName : null,
        guest_email: isGuest ? guestEmail : null,
        guest_phone: isGuest ? guestPhone : null,
        status: initialStatus,
        subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        total,
        coupon_code: coupon_code ?? null,
        coupon_id: couponId,
        payment_status: initialPaymentStatus,
        payment_method,
        shipping_address,
        billing_address: billing_address ?? shipping_address,
        notes: notes ?? null,
        gst_invoice_number: gstInvoiceNumber,
        influencer_id: influencerId,
        influencer_code: influencerCode,
        via_coupon: viaCoupon,
        commission_amount: commissionAmount,
      })
      .select()
      .single();

    if (orderInsertError || !order) {
      console.error('[POST /api/orders] Order insert error:', orderInsertError?.message, orderInsertError?.code);
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // ---- 7. Insert order items ----
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItems.map((item) => ({ ...item, order_id: order.id }))
    );

    if (itemsError) {
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('[POST /api/orders] Items insert error:', itemsError);
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // ---- 8. Increment coupon usage (atomic) ----
    if (couponId) {
      await supabase.rpc('increment_coupon_usage', { coupon_uuid: couponId });
    }

    // ---- 8.5 Influencer Transactions & Clicks ----
    if (influencerId) {
      await supabase.from('commission_transactions').insert({
        influencer_id: influencerId,
        order_id: order.id,
        order_number: order.order_number,
        order_total: order.total, // Ensure it's based on the full order total or subtotal depending on rules. Storing total here.
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        via_coupon: viaCoupon,
        status: 'pending'
      });

      if (visitorId) {
        await supabase
          .from('influencer_clicks')
          .update({ converted: true, order_id: order.id })
          .eq('visitor_id', visitorId)
          .eq('influencer_id', influencerId)
          .is('converted', false);
      }
    }

    // ---- 9. Send WhatsApp notification ----
    const phone = shipping_address.phone;
    const name = shipping_address.name;
    // Send confirmation right away for all orders (or just COD if preferred, but usually confirmed is fine)
    sendWhatsAppOrderConfirmed({
      phone,
      customerName: name,
      orderNumber: order.order_number,
      total: order.total,
      itemCount: orderItems.length,
      orderId: order.id
    }).catch(console.error);

    return NextResponse.json<ApiResponse<{ order_id: string; order_number: string; total: number; payment_method: string }>>(
      {
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          total: order.total,
          payment_method,
        },
        message: isCOD ? 'COD order placed successfully' : 'Order created — proceed to payment',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/orders] Unexpected error:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


