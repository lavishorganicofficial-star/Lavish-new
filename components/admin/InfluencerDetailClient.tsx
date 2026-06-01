'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Wallet, TrendingUp, DollarSign, Edit, User, CheckCircle, CreditCard, Landmark } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';

export function InfluencerDetailClient({
  profile,
  commissions,
  payouts
}: {
  profile: any;
  commissions: any[];
  payouts: any[];
}) {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'transactions' | 'payouts'>('settings');

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(profile.pending_commission);
  const [payoutMethod, setPayoutMethod] = useState(profile.preferred_payout || 'upi');
  const [payoutRef, setPayoutRef] = useState('');

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updates = Object.fromEntries(formData.entries());

    try {
      const payload = {
        commission_rate: parseFloat(updates.commission_rate as string),
        coupon_discount: parseFloat(updates.coupon_discount as string),
        commission_on_non_coupon_orders: updates.commission_on_non_coupon_orders === 'on',
        non_coupon_commission_rate: parseFloat(updates.non_coupon_commission_rate as string),
        coupon_per_user_limit: parseInt(updates.coupon_per_user_limit as string, 10),
        notes: updates.notes,
        referral_code: updates.referral_code,
      };

      const res = await fetch(`/api/admin/influencers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save');

      toast.success('Settings Saved', 'Influencer settings updated.');
      router.refresh();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/admin/influencers/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencerId: profile.id,
          amount: parseFloat(payoutAmount),
          paymentMethod: payoutMethod,
          paymentReference: payoutRef
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Payout Recorded', 'Commission marked as paid.');
        setShowPayoutModal(false);
        router.refresh();
      } else {
        toast.error('Payout Failed', data.error);
      }
    } catch {
      toast.error('Payout Failed', 'Internal error.');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Helper for initials
  const getInitials = (name: string) => {
    if (!name) return 'IN';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/influencers" className="p-2 hover:bg-sage-light/20 rounded-full transition-colors text-charcoal bg-white shadow-sm border border-sage-light/20">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-sm font-medium text-charcoal-lighter">Back to Influencers</span>
      </div>

      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-sage-light/20 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-sage-dark to-charcoal relative">
          {/* Decorative shapes */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-sm relative z-10">
              <div className="w-full h-full bg-sage-light/30 rounded-xl flex items-center justify-center text-3xl font-display text-sage-dark">
                {getInitials(profile.profiles?.full_name)}
              </div>
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-3xl font-semibold text-charcoal">{profile.profiles?.full_name}</h1>
                {profile.status === 'approved' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Active
                  </span>
                )}
                {profile.status === 'pending' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-charcoal-lighter font-medium flex items-center gap-2">
                <span className="text-sage-dark">@{profile.instagram_handle}</span>
                <span className="w-1 h-1 rounded-full bg-sage-light"></span>
                <span>{profile.follower_count} Followers</span>
                <span className="w-1 h-1 rounded-full bg-sage-light"></span>
                <span className="capitalize">{profile.niche}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards (Glassmorphism & Fixed Variables) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-charcoal-lighter mb-1">Total Sales</p>
            <p className="text-2xl font-display font-medium text-charcoal">{formatCurrency(profile.total_sales || 0)}</p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sage-50 flex items-center justify-center text-sage-dark flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-charcoal-lighter mb-1">Total Earned</p>
            <p className="text-2xl font-display font-medium text-sage-dark">{formatCurrency(profile.total_commission || 0)}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-charcoal/5 flex items-center justify-center text-charcoal flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-charcoal-lighter mb-1">Paid Out</p>
            <p className="text-2xl font-display font-medium text-charcoal">{formatCurrency(profile.paid_commission || 0)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-100 shadow-warm-sm flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-amber-700/70 mb-1">Unpaid Balance</p>
              <p className="text-2xl font-display font-medium text-amber-700">{formatCurrency(profile.pending_commission || 0)}</p>
            </div>
          </div>
          {profile.pending_commission > 0 && (
            <button onClick={() => setShowPayoutModal(true)} className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-amber-700 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100">
              Pay Now
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-sage-light/20 overflow-hidden">
        {/* Modern Pill Tabs */}
        <div className="p-2 border-b border-sage-light/10 bg-warm-white/50">
          <div className="flex gap-1 p-1 bg-sage-light/10 rounded-xl w-fit">
            <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-2.5 text-sm font-semibold rounded-lg transition-all", activeTab === 'settings' ? "bg-white text-charcoal shadow-sm" : "text-charcoal-lighter hover:text-charcoal")}>
              Settings & Details
            </button>
            <button onClick={() => setActiveTab('transactions')} className={cn("px-6 py-2.5 text-sm font-semibold rounded-lg transition-all", activeTab === 'transactions' ? "bg-white text-charcoal shadow-sm" : "text-charcoal-lighter hover:text-charcoal")}>
              Transactions ({commissions.length})
            </button>
            <button onClick={() => setActiveTab('payouts')} className={cn("px-6 py-2.5 text-sm font-semibold rounded-lg transition-all", activeTab === 'payouts' ? "bg-white text-charcoal shadow-sm" : "text-charcoal-lighter hover:text-charcoal")}>
              Payouts ({payouts.length})
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-2 space-y-8">
                {/* Commission Structure Card */}
                <div className="bg-warm-white/30 border border-sage-light/20 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sage-dark" />
                    Commission Structure
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Referral Code</label>
                      <input type="text" name="referral_code" defaultValue={profile.profiles?.referral_code || ''} className="input-field bg-white shadow-sm" placeholder="e.g. LAVISH10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Coupon Discount (%)</label>
                      <input type="number" step="0.1" name="coupon_discount" defaultValue={profile.coupon_discount} className="input-field bg-white shadow-sm" />
                      <p className="text-[11px] text-charcoal-lighter">Customer discount when using this code.</p>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Standard Commission (%)</label>
                        <input type="number" step="0.1" name="commission_rate" defaultValue={profile.commission_rate} className="input-field bg-white shadow-sm" />
                        <p className="text-[11px] text-charcoal-lighter">Earned when customer uses coupon.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Link-Only Commission (%)</label>
                        <input type="number" step="0.1" name="non_coupon_commission_rate" defaultValue={profile.non_coupon_commission_rate} className="input-field bg-white shadow-sm" />
                        <p className="text-[11px] text-charcoal-lighter">Earned on standard link clicks.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Customer Usage Limit (Per User)</label>
                        <input type="number" step="1" name="coupon_per_user_limit" defaultValue={profile.coupon_per_user_limit || 1} className="input-field bg-white shadow-sm" />
                        <p className="text-[11px] text-charcoal-lighter">How many times a single customer can use this code.</p>
                      </div>
                    </div>

                  <div className="mt-6 pt-6 border-t border-sage-light/20 flex items-center gap-3">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input type="checkbox" id="commission_on_non_coupon_orders" name="commission_on_non_coupon_orders" defaultChecked={profile.commission_on_non_coupon_orders} className="h-5 w-5 rounded border-sage-light/30 text-sage-dark focus:ring-sage-light" />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <label htmlFor="commission_on_non_coupon_orders" className="font-medium text-charcoal">Enable Link-Only Tracking</label>
                        <p className="text-charcoal-lighter text-xs">Allow influencer to earn commission even if the customer forgets to apply the coupon code at checkout.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="bg-warm-white/30 border border-sage-light/20 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-sage-dark" />
                    Internal Notes
                  </h3>
                  <textarea name="notes" rows={4} defaultValue={profile.notes || ''} className="input-field bg-white shadow-sm resize-none" placeholder="Keep private notes about this influencer's performance or agreements here..."></textarea>
                </div>

                <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-base shadow-md w-full md:w-auto">
                  {saving ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>

              {/* Right Column: Read-Only Data */}
              <div className="space-y-6">
                {/* Bank Details */}
                <div className="bg-charcoal text-white rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Landmark className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
                    <CreditCard className="w-4 h-4" />
                    Payout Details
                  </h3>
                  
                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Preferred Method</p>
                      <p className="font-medium text-white bg-white/10 w-fit px-3 py-1 rounded-md uppercase">{profile.preferred_payout || 'Not Set'}</p>
                    </div>
                    
                    {profile.preferred_payout === 'upi' && (
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">UPI ID</p>
                        <p className="font-medium font-mono text-sage-100">{profile.upi_id || 'Not Provided'}</p>
                      </div>
                    )}

                    {profile.preferred_payout === 'bank' && (
                      <>
                        <div>
                          <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Bank Name</p>
                          <p className="font-medium">{profile.bank_name || 'Not Provided'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Account Number</p>
                          <p className="font-medium font-mono tracking-widest text-sage-100">{profile.account_number || 'Not Provided'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">IFSC Code</p>
                          <p className="font-medium font-mono text-sage-100">{profile.ifsc_code || 'Not Provided'}</p>
                        </div>
                      </>
                    )}

                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">PAN Number</p>
                      <p className="font-medium font-mono text-sage-100">{profile.pan_number || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Application Context */}
                <div className="bg-sage-50 border border-sage-light/20 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Application Note
                  </h3>
                  <p className="text-sm text-sage-800 leading-relaxed italic border-l-2 border-sage-light pl-4">
                    "{profile.why_join || 'No application note provided.'}"
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Enhanced Tables */}
          {activeTab === 'transactions' && (
            <div className="border border-sage-light/20 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-charcoal-lighter uppercase tracking-wider bg-warm-white border-b border-sage-light/20">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Sale Total</th>
                    <th className="px-6 py-4">Commission</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-light/10 bg-white">
                  {commissions.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-charcoal-lighter">No transactions yet.</td></tr> : commissions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-charcoal-lighter">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-semibold text-sage-dark hover:underline cursor-pointer"><Link href={`/admin/orders/${tx.order_id}`}>#{tx.order_number}</Link></td>
                      <td className="px-6 py-4 font-medium text-charcoal">{formatCurrency(tx.order_total)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-display font-medium text-sage-dark">{formatCurrency(tx.commission_amount)}</span>
                          <span className="text-[10px] text-charcoal-lighter">{tx.commission_rate}% {tx.via_coupon ? 'Coupon' : 'Link'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider", tx.status === 'paid' ? "bg-green-100 text-green-700 border border-green-200" : "bg-amber-100 text-amber-700 border border-amber-200")}>{tx.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="border border-sage-light/20 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-charcoal-lighter uppercase tracking-wider bg-warm-white border-b border-sage-light/20">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Payout ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-light/10 bg-white">
                  {payouts.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-charcoal-lighter">No payouts yet.</td></tr> : payouts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-charcoal-lighter">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs text-charcoal">#{p.payout_number}</td>
                      <td className="px-6 py-4 font-display font-semibold text-sage-dark">{formatCurrency(p.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-charcoal/5 text-charcoal rounded-md text-[10px] font-bold uppercase tracking-wider">{p.payment_method}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-charcoal-lighter">{p.payment_reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setShowPayoutModal(false)} className="absolute top-6 right-6 text-charcoal-lighter hover:text-charcoal bg-warm-white p-2 rounded-full transition-colors">&times;</button>
            
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6" />
            </div>
            
            <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">Record Payout</h2>
            <p className="text-sm text-charcoal-lighter mb-8">Mark outstanding commissions as paid and send funds via the preferred method.</p>
            
            <form onSubmit={handlePayout} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-charcoal-lighter uppercase tracking-wider">Amount to Pay</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-lighter font-medium">₹</span>
                  <input type="number" step="0.01" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} className="input-field pl-9 font-display font-medium text-xl h-14 bg-warm-white" max={profile.pending_commission} required />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[11px] text-charcoal-lighter">Available: <span className="font-medium text-charcoal">{formatCurrency(profile.pending_commission)}</span></p>
                  <button type="button" onClick={() => setPayoutAmount(profile.pending_commission)} className="text-[11px] font-semibold text-sage-dark hover:underline">Pay Full Amount</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-charcoal-lighter uppercase tracking-wider">Payment Method</label>
                <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} className="input-field bg-warm-white h-12">
                  <option value="upi">UPI ({profile.upi_id || 'Not provided'})</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paytm">Paytm</option>
                  <option value="cash">Cash / Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-charcoal-lighter uppercase tracking-wider">Reference / UTR Number</label>
                <input type="text" value={payoutRef} onChange={e => setPayoutRef(e.target.value)} className="input-field bg-warm-white h-12" placeholder="e.g. UTR123456789 (Optional)" />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowPayoutModal(false)} className="flex-1 btn-outline py-3.5 font-medium">Cancel</button>
                <button type="submit" disabled={payoutLoading} className="flex-1 btn-primary py-3.5 font-medium shadow-md">
                  {payoutLoading ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
