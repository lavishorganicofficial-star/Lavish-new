'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Eye, Printer, Truck, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { MobileCard } from '@/components/admin/MobileCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/store/uiStore';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_cod_confirmation: 'bg-orange-50 text-orange-700 border-orange-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-sage-50 text-sage-dark border-sage-300',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  returned: 'bg-rose-50 text-rose-600 border-rose-200',
  refunded: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_OPTIONS = [
  'pending', 'awaiting_cod_confirmation', 'confirmed', 
  'processing', 'packed', 'shipped', 'out_for_delivery', 
  'delivered', 'cancelled', 'returned', 'refunded'
];

export function OrdersDashboard({ initialOrders, count, totalPages, currentPage }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const currentTab = searchParams.get('status') || 'all';
  const currentQ = searchParams.get('q') || '';
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const handleTabClick = (statusId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusId === 'all') params.delete('status');
    else params.set('status', statusId);
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === initialOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialOrders.map((o: any) => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated successfully');
      router.refresh();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus || selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to mark ${selectedIds.size} orders as ${newStatus.replace(/_/g, ' ')}?`)) {
      e.target.value = '';
      return;
    }

    setBulkUpdating(true);
    try {
      // In a real app we'd want a bulk API endpoint, but we can do parallel updates here
      await Promise.all(
        Array.from(selectedIds).map(id => 
          fetch(`/api/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      toast.success(`${selectedIds.size} orders updated successfully`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      toast.error('Failed to update some orders');
    } finally {
      setBulkUpdating(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Orders</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{count ?? 0} total orders</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-sage-dark text-sage-dark bg-sage-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action Bar (Search + Bulk Actions) */}
      <div className="card p-4 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
          <input name="q" defaultValue={currentQ} placeholder="Search order number..." className="input pl-9 w-full bg-white" />
        </form>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 animate-fade-in bg-white px-3 py-1.5 rounded-lg border border-sage-light/30 shadow-sm">
            <span className="text-sm font-medium text-sage-dark">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-gray-200"></div>
            <select 
              className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer text-charcoal"
              onChange={handleBulkStatusChange}
              disabled={bulkUpdating}
            >
              <option value="">Bulk Status Change...</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table & Mobile Cards */}
      <div className="card overflow-hidden">
        {/* Mobile View */}
        <div className="p-4 sm:hidden bg-gray-50/50 border-b border-gray-100">
          {initialOrders?.map((order: any) => {
            const addr = order.shipping_address as Record<string, string> | null;
            return (
              <MobileCard
                key={order.id}
                title={
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSelect(order.id)} className="text-gray-400">
                      {selectedIds.has(order.id) ? <CheckSquare className="w-4 h-4 text-sage-dark" /> : <Square className="w-4 h-4" />}
                    </button>
                    <Link href={`/admin/orders/${order.id}`} className="text-sage-dark font-mono hover:underline">
                      {order.order_number}
                    </Link>
                  </div>
                }
                subtitle={
                  order.is_guest 
                    ? <span className="text-gray-500 italic">{order.guest_name || 'Guest'} ({order.guest_phone || 'No phone'})</span>
                    : `${addr?.name ?? addr?.full_name ?? '—'} • ${addr?.phone ?? ''}`
                }
                status={
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border appearance-none pr-6 bg-no-repeat bg-[right_0.25rem_center] bg-[length:10px] ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                }
                details={[
                  { label: 'Date', value: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
                  { label: 'Total', value: <span className="font-semibold">{formatCurrency(order.total)}</span> },
                  { label: 'Payment', value: <span className="text-xs capitalize">{order.payment_method} · {order.payment_status}</span> }
                ]}
              />
            );
          })}
        </div>

        {/* Desktop View */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage-light/20 bg-sage-50/50">
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-sage-dark transition-colors">
                    {initialOrders?.length > 0 && selectedIds.size === initialOrders.length 
                      ? <CheckSquare className="w-5 h-5 text-sage-dark" /> 
                      : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Order</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Total</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Payment</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Date</th>
                <th className="text-right p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {initialOrders?.map((order: any) => {
                const addr = order.shipping_address as Record<string, string> | null;
                const isSelected = selectedIds.has(order.id);
                return (
                  <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-sage-50/50' : 'hover:bg-sage-50/30'}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelect(order.id)} className="text-gray-400 hover:text-sage-dark transition-colors">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-sage-dark" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-sage-dark hover:underline font-mono">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="p-4">
                      {order.is_guest ? (
                        <>
                          <p className="text-sm text-gray-500 italic">{order.guest_name || 'Guest'} (Guest)</p>
                          <p className="text-xs text-gray-400">{order.guest_phone || ''}</p>
                        </>
                      ) : (
                        <>
                          {order.user_id ? (
                            <Link href={`/admin/customers/${order.user_id}`} className="text-sm text-sage-dark font-medium hover:underline block">
                              {addr?.name ?? addr?.full_name ?? '—'}
                            </Link>
                          ) : (
                            <p className="text-sm text-charcoal">{addr?.name ?? addr?.full_name ?? '—'}</p>
                          )}
                          <p className="text-xs text-charcoal-lighter">{addr?.phone ?? ''}</p>
                        </>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-charcoal">{formatCurrency(order.total)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.payment_status === 'paid' ? 'bg-sage-50 text-sage-dark' : order.payment_status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                        {order.payment_method?.toUpperCase()} · {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="relative inline-block">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border appearance-none pr-7 bg-no-repeat bg-[right_0.35rem_center] bg-[length:12px] cursor-pointer focus:ring-2 focus:ring-sage-dark/50 ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-charcoal-lighter whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/orders/${order.id}`} className="btn-icon" aria-label="View order"><Eye className="w-4 h-4" /></Link>
                        <Link href={`/api/invoice/${order.id}`} target="_blank" className="btn-icon" aria-label="Print invoice"><Printer className="w-4 h-4" /></Link>
                        <Link href={`/api/admin/shipping-label/${order.id}`} target="_blank" className="btn-icon" aria-label="Print shipping label"><Truck className="w-4 h-4" /></Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!initialOrders?.length && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-charcoal-lighter">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-sage-light/20 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-charcoal-lighter">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              {currentPage > 1 && <Link href={`?page=${currentPage - 1}${currentTab !== 'all' ? `&status=${currentTab}` : ''}`} className="btn-secondary text-sm py-1.5 px-3">Previous</Link>}
              {currentPage < totalPages && <Link href={`?page=${currentPage + 1}${currentTab !== 'all' ? `&status=${currentTab}` : ''}`} className="btn-primary text-sm py-1.5 px-3">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
