import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';

/**
 * PATCH /api/admin/products/[id]
 * Updates product fields. Uses service-role client to bypass RLS.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const body = await request.json();

  // Pick only allowed fields
  const {
    name, slug, short_description, description,
    price, compare_price, cost_price,
    stock_quantity, low_stock_threshold,
    sku, category_id, gst_rate,
    is_active, is_featured,
  } = body;

  const payload: Record<string, unknown> = {
    ...(name !== undefined && { name }),
    ...(slug !== undefined && { slug }),
    ...(short_description !== undefined && { short_description }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(compare_price !== undefined && { compare_price }),
    ...(cost_price !== undefined && { cost_price }),
    ...(stock_quantity !== undefined && { stock_quantity }),
    ...(low_stock_threshold !== undefined && { low_stock_threshold }),
    ...(sku !== undefined && { sku }),
    ...(category_id !== undefined && { category_id }),
    ...(gst_rate !== undefined && { gst_rate }),
    ...(is_active !== undefined && { is_active }),
    ...(is_featured !== undefined && { is_featured }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminDb
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('id, slug')
    .single();

  if (error) {
    console.error('[PATCH product] code:', error.code, '| message:', error.message, '| details:', error.details, '| hint:', error.hint);
    return NextResponse.json({ success: false, error: error.message ?? JSON.stringify(error) }, { status: 500 });
  }

  // Bust the product page cache immediately
  revalidatePath(`/shop/${data.slug}`);
  revalidatePath('/shop');
  revalidatePath('/');

  return NextResponse.json({ success: true, data });
}

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
