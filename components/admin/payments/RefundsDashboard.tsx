'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, CheckCircle2, RotateCcw, Loader2, Check } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import Link from 'next/link';

export function RefundsDashboard() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const toast = useToast();

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?type=refund_pending`);
      const data = await res.json();
      setRefunds(data.data || []);
    } catch (err) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleMarkDone = async (id: string) => {
    const ref = prompt('Enter Bank UTR / Reference Number:');
    if (!ref) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/refund-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Refund marked as completed!');
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update refund');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Refund Tracker</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">Manage and process pending customer refunds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border-t-4 border-t-orange-500">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Pending Refunds</p>
          <p className="font-display text-xl font-medium text-charcoal">{refunds.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-light/20">
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">TXN #</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Order</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Customer</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Amount</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Details</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter">Loading pending refunds...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter">No pending refunds found! 🎉</td></tr>
              ) : (
                refunds.map((txn) => (
                  <tr key={txn.id} className="hover:bg-sage-50/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-charcoal">{txn.transaction_number}</td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${txn.order_id}`} className="font-mono text-sage-dark hover:underline">
                        {txn.order_number}
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-charcoal">{txn.customer_name}</p>
                      <p className="text-xs text-charcoal-lighter">{txn.customer_phone}</p>
                    </td>
                    <td className="p-4 font-bold text-red-600">{formatCurrency(Math.abs(txn.amount))}</td>
                    <td className="p-4">
                      <p className="text-xs text-charcoal uppercase tracking-wider">{txn.refund_method?.replace('_', ' ')}</p>
                      {txn.refund_method === 'upi' && <p className="text-xs text-charcoal-lighter">{txn.refund_upi_id}</p>}
                      {txn.refund_method === 'bank_transfer' && <p className="text-xs text-charcoal-lighter">{txn.refund_account} ({txn.refund_ifsc})</p>}
                      <p className="text-[10px] text-orange-600 bg-orange-50 inline-block px-1.5 py-0.5 rounded mt-1">{txn.refund_reason}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleMarkDone(txn.id)}
                        disabled={updatingId === txn.id}
                        className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                      >
                        {updatingId === txn.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Mark Done
                      </button>
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
