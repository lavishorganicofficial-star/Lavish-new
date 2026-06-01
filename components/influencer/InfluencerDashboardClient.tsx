'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Copy, Share2, Wallet, Users, ShoppingBag, IndianRupee } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { formatCurrency, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function InfluencerDashboardClient({
  profile,
  orders,
  payouts,
  chartData,
  hostUrl
}: {
  profile: any;
  orders: any[];
  payouts: any[];
  chartData: any[];
  hostUrl: string;
}) {
  const toast = useToast();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [saving, setSaving] = useState(false);

  const referralLink = `${hostUrl}?ref=${profile.profiles.referral_code}`;
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!', `${label} copied to clipboard`);
  };

  const handleShareWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSavePayout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updates = Object.fromEntries(formData.entries());

    try {
      const { error } = await supabase
        .from('influencer_profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) throw error;
      toast.success('Settings Saved', 'Your payout settings have been updated.');
    } catch (err) {
      toast.error('Save Failed', 'Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const conversionRate = profile.total_clicks > 0 
    ? ((profile.total_orders / profile.total_clicks) * 100).toFixed(1) 
    : '0.0';

  const formatCustomerName = (name: string) => {
    if (!name) return 'Customer';
    return name.substring(0, 4) + '***';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-warm border border-sage-light/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal mb-1">
            Welcome back, {profile.profiles.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-charcoal-lighter font-body text-sm mb-4">
            Commission Rate: <span className="font-semibold text-charcoal">{profile.commission_rate}%</span> | 
            Customer Discount: <span className="font-semibold text-charcoal">{profile.coupon_discount}%</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-warm-white px-3 py-2 rounded-lg border border-sage-light/30">
              <span className="text-xs text-charcoal-lighter">Link:</span>
              <span className="text-sm font-medium text-sage-dark truncate max-w-[150px] sm:max-w-xs">{referralLink}</span>
              <button onClick={() => handleCopy(referralLink, 'Link')} className="ml-auto p-1.5 hover:bg-white rounded-md text-charcoal-lighter hover:text-charcoal transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-warm-white px-3 py-2 rounded-lg border border-sage-light/30">
              <span className="text-xs text-charcoal-lighter">Code:</span>
              <span className="text-sm font-medium text-sage-dark">{profile.profiles.referral_code}</span>
              <button onClick={() => handleCopy(profile.profiles.referral_code, 'Code')} className="ml-auto p-1.5 hover:bg-white rounded-md text-charcoal-lighter hover:text-charcoal transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('overview')} className={cn("btn-outline", activeTab === 'overview' && "bg-charcoal text-white")}>Overview</button>
          <button onClick={() => setActiveTab('settings')} className={cn("btn-outline", activeTab === 'settings' && "bg-charcoal text-white")}>Settings</button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-warm border border-sage-light/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wide">Total Clicks</p>
                <Users className="w-5 h-5 text-sage-dark" />
              </div>
              <p className="font-display text-3xl font-medium text-charcoal">{profile.total_clicks}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-warm border border-sage-light/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wide">Total Orders</p>
                <ShoppingBag className="w-5 h-5 text-sage-dark" />
              </div>
              <p className="font-display text-3xl font-medium text-charcoal">{profile.total_orders}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-warm border border-sage-light/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wide">Total Earned</p>
                <IndianRupee className="w-5 h-5 text-sage-dark" />
              </div>
              <p className="font-display text-3xl font-medium text-charcoal">{formatCurrency(profile.total_commission_earned)}</p>
              <p className="text-xs text-charcoal-lighter mt-1">{formatCurrency(profile.paid_commission)} paid out</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-warm border border-sage-light/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wide">Pending</p>
                <Wallet className="w-5 h-5 text-amber-500" />
              </div>
              <p className="font-display text-3xl font-medium text-charcoal">{formatCurrency(profile.pending_commission)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Chart & Conversion */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-warm border border-sage-light/20">
                <h3 className="font-medium text-charcoal mb-6">Performance (Last 30 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4A6741" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4A6741" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#4A6741" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                      <Area type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-sage-50 rounded-2xl p-6 shadow-warm border border-sage-light/30">
                <h3 className="font-medium text-charcoal mb-2">Your Conversion Rate: {conversionRate}%</h3>
                <p className="text-sm text-charcoal-lighter mb-4">Industry Average: 2.1%</p>
                {parseFloat(conversionRate) > 2.1 ? (
                  <p className="text-sm font-medium text-sage-dark">You're performing { (parseFloat(conversionRate) / 2.1).toFixed(1) }x above average! 🌟</p>
                ) : (
                  <p className="text-sm text-charcoal-lighter">Keep sharing to boost your conversions and earn more.</p>
                )}
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-2xl p-6 shadow-warm border border-sage-light/20 overflow-hidden">
                <h3 className="font-medium text-charcoal mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-charcoal-lighter uppercase bg-warm-white">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Commission</th>
                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-6 text-charcoal-lighter">No orders yet</td></tr>
                      ) : orders.map((o: any) => (
                        <tr key={o.id} className="border-b border-sage-light/10 last:border-0">
                          <td className="px-4 py-4">{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short'})}</td>
                          <td className="px-4 py-4">{formatCustomerName(o.orders?.shipping_address?.name)}</td>
                          <td className="px-4 py-4 font-medium">{formatCurrency(o.order_total)}</td>
                          <td className="px-4 py-4 text-sage-dark font-medium">
                            {formatCurrency(o.commission_amount)} <span className="text-xs text-charcoal-lighter font-normal">({o.commission_rate}%)</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-semibold",
                              o.status === 'paid' ? "bg-sage-light/20 text-sage-dark" : "bg-amber-100 text-amber-700"
                            )}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Share Tools Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-warm border border-sage-light/20">
                <h3 className="font-medium text-charcoal mb-4">Share Tools</h3>
                
                <div className="space-y-4">
                  <div className="bg-warm-white p-4 rounded-xl border border-sage-light/20">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-charcoal-lighter uppercase">WhatsApp Template</p>
                      <button onClick={() => handleCopy(`Hey! I've been using LavishOrganic products and they're amazing 🌿\nUse my code ${profile.profiles.referral_code} for ${profile.coupon_discount}% off!\nShop here: ${referralLink}`, 'Message')} className="text-sage-dark hover:text-charcoal"><Copy className="w-4 h-4" /></button>
                    </div>
                    <p className="text-sm text-charcoal-lighter italic mb-4">
                      "Hey! I've been using LavishOrganic products and they're amazing 🌿<br/>
                      Use my code <strong className="text-charcoal">{profile.profiles.referral_code}</strong> for {profile.coupon_discount}% off!<br/>
                      Shop here: {referralLink}"
                    </p>
                    <button 
                      onClick={() => handleShareWhatsApp(`Hey! I've been using LavishOrganic products and they're amazing 🌿\nUse my code ${profile.profiles.referral_code} for ${profile.coupon_discount}% off!\nShop here: ${referralLink}`)}
                      className="w-full py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share on WhatsApp
                    </button>
                  </div>

                  <div className="bg-warm-white p-4 rounded-xl border border-sage-light/20">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-charcoal-lighter uppercase">Instagram Caption</p>
                      <button onClick={() => handleCopy(`My skincare routine just got an upgrade ✨\n@lavishorganic products are 100% organic and actually work!\nUse code ${profile.profiles.referral_code} for ${profile.coupon_discount}% off 🌸\nLink in bio 👆`, 'Caption')} className="text-sage-dark hover:text-charcoal"><Copy className="w-4 h-4" /></button>
                    </div>
                    <p className="text-sm text-charcoal-lighter italic">
                      "My skincare routine just got an upgrade ✨<br/>
                      @lavishorganic products are 100% organic and actually work!<br/>
                      Use code <strong className="text-charcoal">{profile.profiles.referral_code}</strong> for {profile.coupon_discount}% off 🌸<br/>
                      Link in bio 👆"
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings History Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-warm border border-sage-light/20">
                <h3 className="font-medium text-charcoal mb-4">Recent Payouts</h3>
                <div className="space-y-4">
                  {payouts.length === 0 ? (
                    <p className="text-sm text-charcoal-lighter">No payouts yet.</p>
                  ) : payouts.slice(0,3).map(p => (
                    <div key={p.id} className="flex justify-between items-center pb-4 border-b border-sage-light/10 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{formatCurrency(p.total_amount)}</p>
                        <p className="text-xs text-charcoal-lighter">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-sage-light/20 text-sage-dark rounded-full font-medium">Paid</span>
                        <p className="text-[10px] text-charcoal-lighter mt-1">{p.payment_method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Settings Tab */
        <div className="max-w-2xl bg-white rounded-2xl p-6 md:p-8 shadow-warm border border-sage-light/20">
          <h2 className="font-medium text-charcoal mb-6 text-xl">Payout Settings</h2>
          <form onSubmit={handleSavePayout} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Preferred Payout Method</label>
              <select name="preferred_payout" defaultValue={profile.preferred_payout} className="input-field bg-white">
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="paytm">Paytm</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">UPI ID (If UPI selected)</label>
              <input type="text" name="upi_id" defaultValue={profile.upi_id || ''} className="input-field" placeholder="yourname@upi" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage-light/20">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-charcoal">Bank Name</label>
                <input type="text" name="bank_name" defaultValue={profile.bank_name || ''} className="input-field" placeholder="HDFC Bank" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-charcoal">Account Number</label>
                <input type="text" name="account_number" defaultValue={profile.account_number || ''} className="input-field" placeholder="000123456789" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-charcoal">IFSC Code</label>
                <input type="text" name="ifsc_code" defaultValue={profile.ifsc_code || ''} className="input-field" placeholder="HDFC0001234" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-charcoal">PAN Number</label>
                <input type="text" name="pan_number" defaultValue={profile.pan_number || ''} className="input-field uppercase" placeholder="ABCDE1234F" />
                <p className="text-[10px] text-charcoal-lighter">Required if annual earnings exceed ₹10,000.</p>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
