import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/** PATCH /api/admin/categories/[id] — update name, description, image_url, hero_image_url, is_active, meta fields */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();
  console.log(`[PATCH CATEGORY RAW BODY] id=${id}`, JSON.stringify(body));
  const { name, slug, description, image_url, hero_image_url, is_active, meta_title, meta_description, sort_order } = body;

  const payload = {
    ...(name !== undefined && { name }),
    ...(slug !== undefined && { slug }),
    ...(description !== undefined && { description }),
    ...(image_url !== undefined && { image_url }),
    ...(hero_image_url !== undefined && { hero_image_url }),
    ...(is_active !== undefined && { is_active }),
    ...(meta_title !== undefined && { meta_title }),
    ...(meta_description !== undefined && { meta_description }),
    ...(sort_order !== undefined && { sort_order }),
    updated_at: new Date().toISOString(),
  };
  console.log(`[PATCH CATEGORY PAYLOAD]`, JSON.stringify(payload));

  const { error } = await adminDb.from('categories').update(payload).eq('id', id);

  if (error) {
    console.error('[PATCH CATEGORY ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Fetch slug for revalidation if not provided
  let currentSlug = slug;
  if (!currentSlug) {
    const { data } = await adminDb.from('categories').select('slug').eq('id', id).single();
    if (data) currentSlug = data.slug;
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  if (currentSlug) revalidatePath(`/category/${currentSlug}`);
  revalidatePath('/category/[slug]', 'page');

  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/categories/[id] */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const { error } = await adminDb.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  revalidatePath('/');
  revalidatePath('/category/[slug]', 'page');
  return NextResponse.json({ success: true });
}
