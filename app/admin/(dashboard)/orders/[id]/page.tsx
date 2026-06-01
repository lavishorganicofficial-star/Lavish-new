import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import OrderDetailClient from './OrderDetailClient';

export const metadata: Metadata = { title: 'Order Detail | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ✅ Use admin client to bypass RLS — regular createClient() would hide the order
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(id, product_name, image_url, quantity, unit_price, total_price),
      user:profiles!user_id(full_name, phone)
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    console.error('[Admin Order Detail] Not found:', id, error?.message);
    notFound();
  }

  // Get user email via auth admin (profiles table doesn't store email)
  let customerEmail: string | null = null;
  if (!order.is_guest && order.user_id) {
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(order.user_id);
      customerEmail = authUser?.email ?? null;
    } catch {
      // non-critical
    }
  } else if (order.is_guest) {
    customerEmail = order.guest_email;
  }

  const userProfile = order.user as { full_name: string; phone: string } | null;
  const addr = order.shipping_address as Record<string, string>;

  return (
    <OrderDetailClient
      order={{
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount ?? 0,
        shipping_amount: order.shipping_amount ?? 0,
        tax_amount: order.tax_amount ?? 0,
        total: order.total,
        coupon_code: order.coupon_code ?? null,
        razorpay_payment_id: order.razorpay_payment_id ?? null,
        gst_invoice_number: order.gst_invoice_number ?? null,
        tracking_number: order.tracking_number ?? null,
        courier_name: order.courier_name ?? null,
        created_at: order.created_at,
        shipping_address: addr,
        items: (order.items ?? []) as Array<{
          id: string;
          product_name: string;
          image_url: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>,
        customer_name: order.is_guest ? order.guest_name : (userProfile?.full_name ?? addr?.name ?? null),
        customer_email: customerEmail,
        customer_phone: order.is_guest ? order.guest_phone : (userProfile?.phone ?? addr?.phone ?? null),
        is_guest: order.is_guest,
        user_id: order.user_id,
      }}
    />
  );
}
