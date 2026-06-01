import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/** PATCH /api/admin/hero-slides/[id] — toggle active or update fields */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();
  const { is_active, title, subtitle, link_url } = body;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    ...(is_active !== undefined && { is_active }),
    ...(title !== undefined && { title }),
    ...(subtitle !== undefined && { subtitle }),
    ...(link_url !== undefined && { link_url }),
  };

  const { error } = await adminDb.from('hero_slides').update(payload).eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/hero-slides/[id] — remove a slide */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const { error } = await adminDb.from('hero_slides').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}
