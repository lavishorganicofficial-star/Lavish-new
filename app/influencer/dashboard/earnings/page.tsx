'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function InfluencerEarningsPage() {
  const toast = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);

  const fetchEarnings = async () => {
    try {
      const resStats = await fetch('/api/influencer/stats');
      const jsonStats = await resStats.json();
      if (jsonStats.success) {
        setStats(jsonStats.data.stats);
      }

      const resPayouts = await fetch('/api/influencer/earnings');
      const jsonPayouts = await resPayouts.json();
      if (jsonPayouts.success) {
        setPayouts(jsonPayouts.data.payouts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleRequestPayout = async () => {
    if (!stats || stats.pendingPayout < 1000) {
      toast.error('Minimum payout threshold is ₹1000');
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch('/api/influencer/earnings', { method: 'POST' });
      const json = await res.json();
      
      if (json.success) {
        toast.success(json.message);
        await fetchEarnings(); // Refresh data
      } else {
        toast.error('Payout failed', json.error);
      }
    } catch (e) {
      toast.error('Request failed', 'An unexpected error occurred');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-sage-light/20 rounded-2xl"></div>
        <div className="h-96 bg-sage-light/20 rounded-2xl"></div>
      </div>
    );
  }

  const canRequestPayout = (stats?.pendingPayout || 0) >= 1000;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Earnings & Payouts</h1>
        <p className="text-charcoal-lighter">Track your commission and request payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 flex flex-col justify-center bg-gradient-to-br from-sage-dark to-sage text-white border-sage">
          <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">Available for Payout</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p className="text-5xl font-display font-semibold">₹{stats?.pendingPayout?.toLocaleString() || 0}</p>
            
            <div className="flex flex-col items-start md:items-end gap-2">
              <button 
                onClick={handleRequestPayout}
                disabled={!canRequestPayout || requesting}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                  canRequestPayout 
                    ? "bg-white text-sage-dark hover:shadow-lg hover:-translate-y-0.5" 
                    : "bg-white/20 text-white/50 cursor-not-allowed"
                )}
              >
                {requesting ? 'Processing...' : 'Request Payout'}
              </button>
              {!canRequestPayout && (
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Min. ₹1,000 required
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center bg-warm-white border-sage-light/30">
          <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center mb-4 border border-sage-light/20">
            <DollarSign className="w-5 h-5 text-sage-dark" />
          </div>
          <p className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-1">Lifetime Earnings</p>
          <p className="text-3xl font-display font-semibold text-charcoal">₹{stats?.totalEarned?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Payouts History Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-sage-light/20">
          <h2 className="font-display text-xl font-semibold text-charcoal">Payout History</h2>
        </div>
        
        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cream/50 text-xs uppercase tracking-wider text-charcoal-lighter font-semibold border-b border-sage-light/20">
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Processed On</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/10">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal font-medium">
                      {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal">
                      ₹{payout.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                        payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payout.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      )}>
                        {payout.status === 'paid' && <CheckCircle className="w-3.5 h-3.5" />}
                        {payout.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {payout.status === 'rejected' && <AlertCircle className="w-3.5 h-3.5" />}
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-lighter">
                      {payout.paid_at ? format(new Date(payout.paid_at), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal-lighter max-w-[200px] truncate" title={payout.notes || ''}>
                      {payout.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-light/30">
              <DollarSign className="w-8 h-8 text-sage-light" />
            </div>
            <h3 className="text-charcoal font-medium mb-1">No payouts yet</h3>
            <p className="text-sm text-charcoal-lighter max-w-sm mx-auto">
              Your payout history will appear here once you request a withdrawal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
