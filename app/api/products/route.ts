import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, PaginatedResponse, ProductListItem } from '@/types';

/**
 * GET /api/products
 * Fetches products with filtering, sorting, and pagination.
 * Supports: ?category, ?search, ?min_price, ?max_price, ?in_stock, ?featured, ?sort, ?page, ?limit
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    // Parse query params
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const inStock = searchParams.get('in_stock') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') ?? 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '24'));
    const offset = (page - 1) * limit;

    // Base query
    let query = supabase
      .from('products')
      .select(
        `
        *,
        category:categories(id, name, slug),
        images:product_images(*)
        `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Category filter (by slug)
    if (category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      if (cat) query = query.eq('category_id', cat.id);
    }

    // Full-text search
    if (search && search.length >= 2) {
      query = query.textSearch('search_vector', search.trim(), {
        type: 'websearch',
        config: 'english',
      });
    }

    // Price range
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    // Stock filter
    if (inStock) query = query.gt('stock_quantity', 0);

    // Featured filter
    if (featured) query = query.eq('is_featured', true);

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'bestselling':
        // No direct bestselling field — sort by review count for now
        query = query.order('created_at', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('[GET /api/products] Supabase error:', error);
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const total_pages = Math.ceil(total / limit);

    const response: ApiResponse<PaginatedResponse<ProductListItem>> = {
      success: true,
      data: {
        data: (products ?? []) as unknown as ProductListItem[],
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes on CDN
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('[GET /api/products] Unexpected error:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (user.app_metadata as { user_role?: string })?.user_role;
    if (userRole !== 'admin') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Forbidden — admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { data: product, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<typeof product>>(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/products] Error:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
