import { NextRequest, NextResponse } from 'next/server';
import { checkServiceability } from '@/lib/shiprocket';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { isValidPincode } from '@/lib/utils';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logistics/serviceability?pincode=380001&weight=500
 * Checks if a delivery pincode is serviceable by Shiprocket.
 * No auth required — shown on product page before add to cart.
 */
export async function GET(request: NextRequest) {
  const limitResult = checkRateLimit(request, RATE_LIMITS.api);
  if (!limitResult.success) return rateLimitResponse(limitResult);

  const { searchParams } = request.nextUrl;
  const pincode = searchParams.get('pincode') ?? '';
  const weight = parseInt(searchParams.get('weight') ?? '500');

  if (!isValidPincode(pincode)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Invalid pincode — must be 6 digits' },
      { status: 400 }
    );
  }

  try {
    const result = await checkServiceability(pincode, weight);
    const couriers = result.data?.available_courier_companies ?? [];

    if (!couriers.length) {
      return NextResponse.json<ApiResponse<{ serviceable: false; pincode: string }>>({
        success: true,
        data: { serviceable: false, pincode },
      });
    }

    // Pick the cheapest available courier
    const cheapest = couriers.sort((a, b) => a.rate - b.rate)[0];

    return NextResponse.json<ApiResponse<{
      serviceable: true;
      pincode: string;
      estimated_days: number;
      courier_name: string;
      rate: number;
    }>>({
      success: true,
      data: {
        serviceable: true,
        pincode,
        estimated_days: cheapest.estimated_delivery_days,
        courier_name: cheapest.courier_name,
        rate: cheapest.rate,
      },
    }, {
      headers: {
        // Cache serviceability check for 1 hour
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[GET /api/logistics/serviceability]', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to check serviceability' },
      { status: 500 }
    );
  }
}
