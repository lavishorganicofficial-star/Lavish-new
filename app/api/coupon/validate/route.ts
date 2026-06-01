/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse, CouponValidationResult } from '@/types';

/**
 * POST /api/coupon/validate
 * Validates a coupon code against a given subtotal.
 * Rate limited: 10 requests per minute per IP.
 *
 * Request body: { code: string; subtotal: number }
 * Returns: CouponValidationResult
 */
export async function POST(request: NextRequest) {
  // Rate limiting (prevent brute-force code discovery)
  const limitResult = checkRateLimit(request, RATE_LIMITS.coupon);
  if (!limitResult.success) {
    return rateLimitResponse(limitResult);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json<ApiResponse<CouponValidationResult>>(
        {
          success: true,
          data: { valid: false, discount_amount: 0, message: 'Code and subtotal are required' },
        }
      );
    }

    // Fetch coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (!coupon) {
      return NextResponse.json<ApiResponse<CouponValidationResult>>({
        success: true,
        data: { valid: false, discount_amount: 0, message: 'Invalid coupon code' },
      });
    }

    // Check validity window
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json<ApiResponse<CouponValidationResult>>({
        success: true,
        data: { valid: false, discount_amount: 0, message: 'Coupon is not yet active' },
      });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json<ApiResponse<CouponValidationResult>>({
        success: true,
        data: { valid: false, discount_amount: 0, message: 'Coupon has expired' },
      });
    }

    // Check minimum order
    if (subtotal < coupon.min_order_amount) {
      return NextResponse.json<ApiResponse<CouponValidationResult>>({
        success: true,
        data: {
          valid: false,
          discount_amount: 0,
          message: `Minimum order amount is ₹${coupon.min_order_amount} for this coupon`,
        },
      });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json<ApiResponse<CouponValidationResult>>({
        success: true,
        data: { valid: false, discount_amount: 0, message: 'Coupon usage limit reached' },
      });
    }

    // Check per-user usage
    if (user && coupon.per_user_limit > 0) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id)
        .not('status', 'in', '("cancelled","returned","refunded")');

      if ((count ?? 0) >= coupon.per_user_limit) {
        return NextResponse.json<ApiResponse<CouponValidationResult>>({
          success: true,
          data: {
            valid: false,
            discount_amount: 0,
            message: `You have already used this coupon the maximum number of times`,
          },
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let message = '';

    switch (coupon.type) {
      case 'percentage':
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
        message = `${coupon.value}% discount applied${coupon.max_discount ? ` (max ₹${coupon.max_discount})` : ''}`;
        break;

      case 'fixed':
        discountAmount = Math.min(coupon.value, subtotal);
        message = `₹${coupon.value} discount applied`;
        break;

      case 'free_shipping':
        discountAmount = 0; // Shipping amount reduction handled in cart totals
        message = 'Free shipping applied!';
        break;

      case 'buy_x_get_y':
        // Simplified: treat as flat discount for now
        discountAmount = 0;
        message = 'Buy X Get Y offer applied';
        break;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json<ApiResponse<CouponValidationResult>>({
      success: true,
      data: {
        valid: true,
        discount_amount: discountAmount,
        message,
        coupon: coupon as any,
      },
    });
  } catch (err) {
    console.error('[POST /api/coupon/validate]', err);
    return NextResponse.json<ApiResponse<CouponValidationResult>>({
      success: true,
      data: { valid: false, discount_amount: 0, message: 'Failed to validate coupon' },
    });
  }
}

