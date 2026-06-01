import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { DashboardKPICards } from '@/components/admin/DashboardKPICards';
import { SalesChart } from '@/components/admin/SalesChart';
import { RecentOrders, LowStockAlert } from '@/components/admin/RecentOrders';
import { LiveOrderFeed } from '@/components/admin/LiveOrderFeed';
import Link from 'next/link';
import { CreditCard, Truck, PackageCheck, PackageOpen, Send } from 'lucide-react';


export const metadata: Metadata = { title: 'Dashboard | LavishOrganic Admin' };

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYesterday = new Date(now.setDate(now.getDate() - 1)).toISOString();
  now.setDate(now.getDate() + 1); // reset

  // Revenue this month
  const { data: revenueMTD } = await supabase
    .from('orders')
    .select('total')
    .in('payment_status', ['paid'])
    .gte('created_at', startOfMonth);

  // Orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: ordersToday } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .gte('created_at', today.toISOString());

  // Pending orders
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .in('status', ['pending', 'awaiting_cod_confirmation', 'confirmed']);

  // Low stock products
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, name, stock_quantity, low_stock_threshold, images:product_images(url, is_primary)')
    .eq('is_active', true)
    .filter('stock_quantity', 'lte', 'low_stock_threshold')
    .gt('stock_quantity', 0)
    .limit(5);

  const { count: lowStockCount } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
    .filter('stock_quantity', 'lte', 'low_stock_threshold')
    .gt('stock_quantity', 0);

  // Pipeline metrics
  const { count: processingOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .in('status', ['processing', 'packed']);

  const { count: shippedOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .in('status', ['shipped', 'out_for_delivery']);

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, payment_method, created_at, shipping_address')
    .order('created_at', { ascending: false })
    .limit(10);

  // Sales chart data (last 30 days)
  const { data: salesData } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('payment_status', 'paid')
    // eslint-disable-next-line react-hooks/purity
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at');

  const stats = {
    revenue_mtd: revenueMTD?.reduce((sum, o) => sum + o.total, 0) ?? 0,
    orders_today: ordersToday ?? 0,
    pending_orders: pendingOrders ?? 0,
    low_stock_count: lowStockCount ?? 0,
  };

  // Fetch Payment & Inventory specific high-level metrics for widgets
  const { count: pendingRefunds } = await supabase
    .from('payment_transactions')
    .select('id', { count: 'exact' })
    .eq('type', 'refund')
    .eq('status', 'pending');

  const { count: pendingPOs } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact' })
    .in('status', ['sent', 'partial']);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">{greeting}, Admin! 👋</h1>
          <p className="text-sm text-charcoal-lighter font-body mt-0.5">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKPICards stats={stats} />

      {/* Pipeline */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 bg-sage-50/50 border-b border-sage-light/20">
          <h3 className="font-medium text-charcoal">Order Pipeline</h3>
        </div>
        <div className="grid grid-cols-3 divide-x divide-sage-light/20">
          <div className="p-3 sm:p-6 text-center hover:bg-gray-50 transition-colors">
            <PackageOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-xl sm:text-2xl font-display font-medium text-charcoal">{stats.pending_orders}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mt-1">To Process</p>
          </div>
          <div className="p-3 sm:p-6 text-center hover:bg-gray-50 transition-colors">
            <PackageCheck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-xl sm:text-2xl font-display font-medium text-charcoal">{processingOrders ?? 0}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mt-1">Processing</p>
          </div>
          <div className="p-3 sm:p-6 text-center hover:bg-gray-50 transition-colors">
            <Send className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-sage-dark mb-2" />
            <p className="text-xl sm:text-2xl font-display font-medium text-charcoal">{shippedOrders ?? 0}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mt-1">Shipped</p>
          </div>
        </div>
      </div>

      {/* Charts + Live Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart salesData={salesData ?? []} />
          {/* Module Widgets */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/payments/refunds" className="block p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span className="text-xl font-bold text-orange-700">{pendingRefunds || 0}</span>
              </div>
              <p className="text-xs font-semibold text-orange-800 uppercase">Pending Refunds</p>
            </Link>
            
            <Link href="/admin/inventory/purchase-orders" className="block p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">{pendingPOs || 0}</span>
              </div>
              <p className="text-xs font-semibold text-blue-800 uppercase">Active POs</p>
            </Link>
          </div>
        </div>
        <div className="space-y-6 h-full flex flex-col">
          <LiveOrderFeed initialOrders={recentOrders ?? []} />
          <LowStockAlert products={lowStockProducts ?? []} />
        </div>
      </div>
    </div>
  );
}
