'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowUpRight, TrendingDown, PackagePlus, ArrowLeftRight, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/store/uiStore';
import Link from 'next/link';

export function StockMovementsDashboard() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const toast = useToast();

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (type !== 'all') qs.set('type', type);
      // We aren't implementing full text search on the backend for movements right now,
      // but we could filter it client-side if needed.
      
      const res = await fetch(`/api/admin/inventory/movements?${qs.toString()}`);
      const data = await res.json();
      setMovements(data.data || []);
    } catch (err: any) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [type]);

  // Client-side search filtering
  const displayMovements = q 
    ? movements.filter(m => m.product_name.toLowerCase().includes(q.toLowerCase()))
    : movements;

  const getIcon = (movementType: string, change: number) => {
    switch (movementType) {
      case 'sale': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'restock': return <PackagePlus className="w-4 h-4 text-blue-600" />;
      case 'adjustment': return change > 0 ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-orange-600" />;
      case 'return': return <ArrowLeftRight className="w-4 h-4 text-green-600" />;
      case 'damage': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <ArrowUpRight className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadge = (movementType: string) => {
    switch (movementType) {
      case 'sale': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'restock': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'adjustment': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'return': return 'bg-green-100 text-green-800 border-green-200';
      case 'damage': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Stock Movement History</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">A complete audit log of all inventory changes</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9 w-full" 
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:w-48">
          <option value="all">All Movements</option>
          <option value="sale">Sales</option>
          <option value="restock">Restock (PO)</option>
          <option value="adjustment">Adjustments</option>
          <option value="return">Returns</option>
          <option value="damage">Damages</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-light/20">
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Date</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Product</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Type</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Before</th>
                <th className="text-center p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Change</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">After</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Reference & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-sage-dark" /></td></tr>
              ) : displayMovements.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-charcoal-lighter">No stock movements found.</td></tr>
              ) : (
                displayMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-sage-50/30 transition-colors">
                    <td className="p-4 text-charcoal-lighter">{formatDate(m.created_at)}</td>
                    <td className="p-4 font-medium text-charcoal">{m.product_name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getBadge(m.movement_type)}`}>
                        {getIcon(m.movement_type, m.quantity_change)}
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="p-4 text-right text-charcoal-lighter">{m.quantity_before}</td>
                    <td className={`p-4 text-center font-bold ${m.quantity_change > 0 ? 'text-green-600 bg-green-50/50' : 'text-red-600 bg-red-50/50'}`}>
                      {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                    </td>
                    <td className="p-4 text-right font-bold text-sage-dark">{m.quantity_after}</td>
                    <td className="p-4">
                      <p className="text-xs text-charcoal">{m.reason || '—'}</p>
                      {m.reference_type === 'order' && m.reference_id && (
                        <Link href={`/admin/orders/${m.reference_id}`} className="text-[10px] text-sage-dark hover:underline uppercase">Order Ref</Link>
                      )}
                      {m.reference_type === 'purchase_order' && m.reference_id && (
                        <span className="text-[10px] text-blue-600 uppercase">PO Ref</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
