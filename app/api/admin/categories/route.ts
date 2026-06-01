import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/** POST /api/admin/categories — create a new category */
export async function POST(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();
  const { name, slug, description, image_url, hero_image_url, is_active, meta_title, meta_description, parent_id, sort_order } = body;

  if (!name || !slug) return NextResponse.json({ success: false, error: 'name and slug are required' }, { status: 400 });

  const { data, error } = await adminDb.from('categories').insert({
    name,
    slug,
    description: description ?? '',
    image_url: image_url ?? null,
    hero_image_url: hero_image_url ?? null,
    is_active: is_active ?? true,
    meta_title: meta_title ?? '',
    meta_description: meta_description ?? '',
    sort_order: sort_order ?? 99,
    parent_id: parent_id ?? null,
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  revalidatePath('/');
  return NextResponse.json({ success: true, data });
}
