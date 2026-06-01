import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to review.' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, rating, title, body: reviewBody, images } = body;

    if (!product_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review data. Product ID and 1-5 rating are required.' }, { status: 400 });
    }

    // Check if user actually purchased this product
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, status)')
      .eq('product_id', product_id)
      .eq('orders.user_id', user.id)
      .in('orders.status', ['delivered'])
      .limit(1);

    const isVerified = orderItems && orderItems.length > 0;

    // Check if user already reviewed
    const { data: existing } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from('product_reviews')
      .insert({
        product_id,
        user_id: user.id,
        rating,
        title: title || null,
        body: reviewBody || null,
        images: images || []
      });

    if (insertError) {
      console.error('Failed to insert review:', insertError);
      return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Review submission error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
