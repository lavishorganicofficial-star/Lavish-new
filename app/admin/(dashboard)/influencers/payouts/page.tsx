'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';

export default function AdminBulkPayoutsPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchUnpaid = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('influencer_profiles')
      .select('*, profiles(full_name)')
      .eq('status', 'approved')
      .gt('pending_commission', 0)
      .order('pending_commission', { ascending: false });

    if (!error && data) {
      setInfluencers(data);
      // Select all by default
      setSelectedIds(data.map(i => i.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnpaid();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === influencers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(influencers.map(i => i.id));
    }
  };

  const handleBulkPay = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);

    const payload = selectedIds.map(id => {
      const inf = influencers.find(i => i.id === id);
      return {
        influencerId: id,
        amount: inf.pending_commission,
        paymentMethod: inf.preferred_payout || 'upi'
      };
    });

    try {
      const res = await fetch('/api/admin/influencers/bulk-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payouts: payload }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Payouts Processed', `Successfully processed ${data.results.filter((r:any) => r.status === 'success').length} payouts.`);
        fetchUnpaid();
      } else {
        toast.error('Error', data.error);
      }
    } catch {
      toast.error('Error', 'Failed to process bulk payouts.');
    } finally {
      setProcessing(false);
    }
  };

  const totalSelectedAmount = influencers
    .filter(i => selectedIds.includes(i.id))
    .reduce((sum, i) => sum + Number(i.pending_commission), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/influencers" className="p-2 hover:bg-sage-light/20 rounded-full transition-colors text-charcoal">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Bulk Payouts</h1>
          <p className="text-sm text-charcoal-lighter">Settle outstanding commissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sage-light/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-charcoal-lighter">Loading unpaid commissions...</div>
        ) : influencers.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-sage-light mx-auto mb-4" />
            <h3 className="font-medium text-charcoal mb-1">All Caught Up!</h3>
            <p className="text-sm text-charcoal-lighter">There are no pending commissions to pay.</p>
          </div>
        ) : (
          <>
            <div className="p-6 bg-sage-50 border-b border-sage-light/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-charcoal-lighter">Selected Amount</p>
                <p className="text-2xl font-display font-medium text-sage-dark">{formatCurrency(totalSelectedAmount)}</p>
              </div>
              <button 
                onClick={handleBulkPay} 
                disabled={selectedIds.length === 0 || processing}
                className="btn-primary flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                {processing ? 'Processing...' : `Pay ${selectedIds.length} Partners`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-charcoal-lighter uppercase bg-warm-white">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === influencers.length && influencers.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 text-sage-dark rounded border-sage-light/30 focus:ring-sage-light"
                      />
                    </th>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Unpaid Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((inf) => (
                    <tr key={inf.id} className="border-b border-sage-light/10 hover:bg-sage-50/50">
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(inf.id)}
                          onChange={() => toggleSelect(inf.id)}
                          className="w-4 h-4 text-sage-dark rounded border-sage-light/30 focus:ring-sage-light"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{inf.profiles?.full_name}</p>
                        <p className="text-xs text-charcoal-lighter">@{inf.instagram_handle}</p>
                      </td>
                      <td className="px-4 py-3 text-amber-600 font-medium">
                        {formatCurrency(inf.pending_commission)}
                      </td>
                      <td className="px-4 py-3 uppercase text-xs font-semibold">
                        {inf.preferred_payout}
                      </td>
                      <td className="px-4 py-3 text-xs text-charcoal-lighter space-y-1">
                        {inf.preferred_payout === 'upi' && <p>UPI: {inf.upi_id}</p>}
                        {inf.preferred_payout === 'bank' && <p>A/C: {inf.account_number} <br/>IFSC: {inf.ifsc_code}</p>}
                        {inf.preferred_payout === 'paytm' && <p>No: {inf.profiles?.phone}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
