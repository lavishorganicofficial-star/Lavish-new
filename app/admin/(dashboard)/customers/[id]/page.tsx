import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { ArrowLeft, Package, ShoppingBag, IndianRupee, Phone, Mail, Calendar, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CustomerActions } from '@/components/admin/CustomerActions';

export const metadata: Metadata = { title: 'Customer Details | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending:                   'bg-amber-50 text-amber-700',
  awaiting_cod_confirmation: 'bg-orange-50 text-orange-700',
  confirmed:                 'bg-blue-50 text-blue-700',
  processing:                'bg-purple-50 text-purple-700',
  packed:                    'bg-indigo-50 text-indigo-700',
  shipped:                   'bg-cyan-50 text-cyan-700',
  out_for_delivery:          'bg-teal-50 text-teal-700',
  delivered:                 'bg-sage-50 text-sage-dark',
  cancelled:                 'bg-red-50 text-red-600',
  returned:                  'bg-rose-50 text-rose-600',
  refunded:                  'bg-gray-50 text-gray-600',
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  // Fetch auth email
  let email = 'No Email';
  try {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(id);
    email = authUser?.email ?? 'No Email';
  } catch { /* non-critical */ }

  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, payment_method, created_at, items:order_items(id)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const totalOrders = orders?.length ?? 0;
  const totalSpent = orders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;
  const deliveredCount = orders?.filter(o => o.status === 'delivered').length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-sage-dark font-bold text-lg">
          {(profile.full_name ?? email ?? 'U')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal flex items-center gap-2">
            {profile.full_name ?? '—'}
            {profile.is_vip && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
          </h1>
          <p className="text-sm text-charcoal-lighter">Customer since {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{totalOrders}</p>
            <p className="text-xs text-charcoal-lighter">Total Orders</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-charcoal-lighter">Total Spent</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{deliveredCount}</p>
            <p className="text-xs text-charcoal-lighter">Delivered</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-sage-light/20">
              <h2 className="font-medium text-charcoal">Order History</h2>
            </div>
            {orders?.length ? (
              <div className="divide-y divide-sage-light/10">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-sage-50/30">
                    <div>
                      <p className="font-mono text-sm font-bold text-charcoal">{order.order_number}</p>
                      <p className="text-xs text-charcoal-lighter mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{(order.items as Array<unknown>)?.length ?? 0} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-charcoal">{formatCurrency(order.total)}</p>
                        <p className={`text-xs font-medium ${order.payment_status === 'paid' ? 'text-sage-dark' : 'text-amber-600'}`}>
                          {order.payment_method?.toUpperCase()} · {order.payment_status}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <Link href={`/admin/orders/${order.id}`} className="btn-secondary text-xs py-1 px-2.5">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ShoppingBag className="w-10 h-10 text-sage-light mx-auto mb-3" />
                <p className="text-charcoal-lighter text-sm">No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-medium text-charcoal mb-4">Contact Info</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-sage-dark flex-shrink-0" />
                <span className="text-charcoal-lighter break-all">{email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-sage-dark flex-shrink-0" />
                <span className="text-charcoal-lighter">{profile.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-sage-dark flex-shrink-0" />
                <span className="text-charcoal-lighter">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <CustomerActions 
            customerId={profile.id} 
            initialCodBanned={profile.cod_banned ?? false} 
            initialIsVip={profile.is_vip ?? false} 
          />
        </div>
      </div>
    </div>
  );
}
