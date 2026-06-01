import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { BarChart3, TrendingUp, IndianRupee, ShoppingBag, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'Reports | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const supabase = await createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [
    { data: mtdRevenue },
    { data: lastMonthRevenue },
    { count: totalOrders },
    { count: deliveredOrders },
    { data: topProducts },
    { data: categoryRevenue },
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', startOfMonth),
    supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').gte('created_at', startOfMonth),
    supabase.from('order_items').select('product_id, quantity, unit_price, product:products(name, slug)').order('quantity', { ascending: false }).limit(5),
    supabase.from('categories').select('id, name'),
  ]);

  const mtd = mtdRevenue?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
  const lastMtd = lastMonthRevenue?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
  const growth = lastMtd > 0 ? (((mtd - lastMtd) / lastMtd) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Reports</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">
            {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} summary
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" id="export-excel-btn">
            <FileText className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-sage-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4.5 h-4.5 text-sage-dark" />
            </div>
            <span className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider">MTD Revenue</span>
          </div>
          <p className="text-2xl font-display font-semibold text-charcoal">{formatCurrency(mtd)}</p>
          {growth !== null && (
            <p className={`text-xs mt-1 ${Number(growth) >= 0 ? 'text-sage-dark' : 'text-red-500'}`}>
              {Number(growth) >= 0 ? '↑' : '↓'} {Math.abs(Number(growth))}% vs last month
            </p>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider">Orders</span>
          </div>
          <p className="text-2xl font-display font-semibold text-charcoal">{totalOrders ?? 0}</p>
          <p className="text-xs mt-1 text-charcoal-lighter">This month</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider">Avg Order</span>
          </div>
          <p className="text-2xl font-display font-semibold text-charcoal">
            {totalOrders ? formatCurrency(mtd / totalOrders) : '₹0'}
          </p>
          <p className="text-xs mt-1 text-charcoal-lighter">Average order value</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider">Delivered</span>
          </div>
          <p className="text-2xl font-display font-semibold text-charcoal">{deliveredOrders ?? 0}</p>
          <p className="text-xs mt-1 text-charcoal-lighter">Completed deliveries</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="card p-5">
        <h2 className="font-medium text-charcoal mb-4">Top Selling Products</h2>
        <div className="space-y-3">
          {topProducts?.map((item, idx) => {
            const prod = item.product as unknown as { name: string; slug: string } | null;
            const revenue = (item.quantity ?? 0) * (item.unit_price ?? 0);
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-bold text-charcoal-lighter w-5">#{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{prod?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-charcoal-lighter">{item.quantity} units</p>
                </div>
                <span className="text-sm font-semibold text-charcoal">{formatCurrency(revenue)}</span>
              </div>
            );
          })}
          {!topProducts?.length && (
            <p className="text-sm text-charcoal-lighter text-center py-4">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
