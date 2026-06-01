import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/**
 * POST /api/admin/products
 * Creates a new product. Uses service-role client to bypass RLS.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();

  const {
    name, slug, short_description, description,
    price, compare_price, cost_price,
    stock_quantity, low_stock_threshold,
    sku, category_id, gst_rate,
    is_active, is_featured,
  } = body;

  if (!name || !slug || price === undefined) {
    return NextResponse.json({ success: false, error: 'name, slug, and price are required' }, { status: 400 });
  }

  const { data, error } = await adminDb
    .from('products')
    .insert({
      name, slug,
      short_description: short_description ?? null,
      description: description ?? null,
      price,
      compare_price: compare_price ?? null,
      cost_price: cost_price ?? null,
      stock_quantity: stock_quantity ?? 0,
      low_stock_threshold: low_stock_threshold ?? 10,
      sku: sku ?? null,
      category_id: category_id ?? null,
      gst_rate: gst_rate ?? 18,
      is_active: is_active ?? true,
      is_featured: is_featured ?? false,
    })
    .select('id, slug')
    .single();

  if (error) {
    console.error('[POST product]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  revalidatePath('/shop');
  revalidatePath('/');

  return NextResponse.json({ success: true, data });
}
