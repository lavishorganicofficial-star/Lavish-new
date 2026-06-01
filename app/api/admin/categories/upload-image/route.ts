import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * POST /api/admin/categories/upload-image
 * Accepts multipart/form-data with a "file" field.
 * Uploads to Cloudinary banners folder, returns the secure URL.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    // Convert to base64 data URI
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await uploadToCloudinary(dataUri, 'categories', { filename: file.name });

    return NextResponse.json({ success: true, data: { url: result.secure_url, public_id: result.public_id } });
  } catch (err) {
    console.error('[category image upload]', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
