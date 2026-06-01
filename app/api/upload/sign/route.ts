import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateImageFile, generateSignedUploadParams } from '@/lib/cloudinary';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse } from '@/types';
import type { CloudinaryFolder } from '@/lib/cloudinary';

/**
 * POST /api/upload/sign
 * Returns a Cloudinary signed upload URL for client-side direct upload.
 * Admin-only. Rate limited to 20/min.
 *
 * Request: { folder: 'products' | 'banners' | 'avatars' | 'reviews' }
 * Response: { signature, timestamp, cloudName, apiKey, folder }
 *
 * Client then uses these params to POST directly to Cloudinary API.
 * This avoids proxying large image files through Next.js servers.
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const limitResult = checkRateLimit(request, RATE_LIMITS.upload);
  if (!limitResult.success) return rateLimitResponse(limitResult);

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
    const folder = body.folder as CloudinaryFolder | undefined;

    const VALID_FOLDERS: CloudinaryFolder[] = ['products', 'banners', 'avatars', 'reviews'];
    if (!folder || !VALID_FOLDERS.includes(folder)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: `Invalid folder. Must be one of: ${VALID_FOLDERS.join(', ')}` },
        { status: 400 }
      );
    }

    // Only admins can upload to products/banners; users can upload to avatars/reviews
    const userRole = (user.app_metadata as { user_role?: string })?.user_role;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !['avatars', 'reviews'].includes(folder)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const params = generateSignedUploadParams(folder);

    return NextResponse.json<ApiResponse<typeof params>>({
      success: true,
      data: params,
    });
  } catch (err) {
    console.error('[POST /api/upload/sign]', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
