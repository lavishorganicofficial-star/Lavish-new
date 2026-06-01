import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

/** GET /api/admin/hero-slides — list all slides ordered by sort_order */
export async function GET(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const { data, error } = await adminDb
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

/** POST /api/admin/hero-slides — upload image + create slide */
export async function POST(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || null;
    const subtitle = (formData.get('subtitle') as string) || null;
    const link_url = (formData.get('link_url') as string) || null;

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;
    const result = await uploadToCloudinary(dataUri, 'banners', { filename: file.name });

    // Get the current max sort_order
    const { data: existing } = await adminDb
      .from('hero_slides')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await adminDb
      .from('hero_slides')
      .insert({
        image_url: result.secure_url,
        cloudinary_id: result.public_id,
        title,
        subtitle,
        link_url,
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    revalidatePath('/');
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[POST hero-slides]', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

/** PATCH /api/admin/hero-slides — reorder slides (body: [{ id, sort_order }]) */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();
  const { slides } = body as { slides: { id: string; sort_order: number }[] };

  if (!Array.isArray(slides)) {
    return NextResponse.json({ success: false, error: 'slides array required' }, { status: 400 });
  }

  // Update sort_order for each slide
  const updates = slides.map(({ id, sort_order }) =>
    adminDb.from('hero_slides').update({ sort_order, updated_at: new Date().toISOString() }).eq('id', id)
  );
  await Promise.all(updates);

  revalidatePath('/');
  return NextResponse.json({ success: true });
}
