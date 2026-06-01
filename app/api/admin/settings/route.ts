import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/** GET /api/admin/settings — return all store settings */
export async function GET(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const { data, error } = await adminDb.from('store_settings').select('key, value');
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const settings: Record<string, unknown> = {};
  (data ?? []).forEach(({ key, value }) => { settings[key] = value; });
  return NextResponse.json({ success: true, data: settings });
}

/** PATCH /api/admin/settings — upsert a setting key */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json() as Record<string, unknown>;

  const upserts = Object.entries(body).map(([key, value]) => ({
    key,
    value: value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await adminDb
    .from('store_settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
