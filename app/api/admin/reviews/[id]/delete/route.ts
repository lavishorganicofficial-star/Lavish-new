import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.redirect(new URL('/admin/reviews', request.url));
  } catch (err: any) {
    console.error('Delete review error:', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
