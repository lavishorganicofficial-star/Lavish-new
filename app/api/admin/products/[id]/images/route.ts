import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminDb, forbiddenResponse } from '@/lib/admin-auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * POST /api/admin/products/[id]/images
 * Accepts multipart/form-data with "file" field (can be sent multiple times).
 * Uploads to Cloudinary, inserts into product_images, revalidates product page cache.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  try {
    // Verify product exists and get its slug for cache revalidation
    const { data: product, error: productError } = await adminDb
      .from('products')
      .select('id, slug')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    // Check how many images this product already has (to set sort_order and is_primary correctly)
    const { count: existingCount } = await adminDb
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    const startIndex = existingCount ?? 0;
    const uploadedImages = [];
    const primaryIndex = formData.get('primary_index') ? parseInt(formData.get('primary_index') as string, 10) : -1;

    // If we are explicitly setting a new primary image, clear the old one first
    if (primaryIndex >= 0 && primaryIndex < files.length) {
      await adminDb
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await uploadToCloudinary(dataUri, 'products', { filename: file.name });
      
      const isPrimary = primaryIndex >= 0 
        ? i === primaryIndex 
        : (startIndex === 0 && i === 0);

      uploadedImages.push({
        product_id: productId,
        url: result.secure_url,
        cloudinary_id: result.public_id,
        is_primary: isPrimary,
        sort_order: startIndex + i,
      });
    }

    const { data: inserted, error: insertError } = await adminDb
      .from('product_images')
      .insert(uploadedImages)
      .select();

    if (insertError) {
      console.error('[product images insert]', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    // Revalidate the product page and shop listing so images appear immediately
    revalidatePath(`/shop/${product.slug}`);
    revalidatePath('/shop');
    revalidatePath('/');

    return NextResponse.json({ success: true, data: inserted });
  } catch (err) {
    console.error('[POST /api/admin/products/[id]/images]', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/[id]/images?imageId=xxx
 * Removes a product image by its ID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const imageId = request.nextUrl.searchParams.get('imageId');
  if (!imageId) {
    return NextResponse.json({ success: false, error: 'imageId required' }, { status: 400 });
  }

  const { error } = await adminDb
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { data: product } = await adminDb
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single();

  if (product?.slug) {
    revalidatePath(`/shop/${product.slug}`);
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/admin/products/[id]/images?imageId=xxx&action=set-primary
 * Sets one image as primary and clears others.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const auth = await requireAdminDb(request);
  if (!auth) return forbiddenResponse();
  const { adminDb } = auth;

  const imageId = request.nextUrl.searchParams.get('imageId');
  if (!imageId) {
    return NextResponse.json({ success: false, error: 'imageId required' }, { status: 400 });
  }

  // Clear all primary flags for this product
  await adminDb
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Set the chosen image as primary
  const { error } = await adminDb
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { data: product } = await adminDb
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single();

  if (product?.slug) {
    revalidatePath(`/shop/${product.slug}`);
  }

  return NextResponse.json({ success: true });
}

