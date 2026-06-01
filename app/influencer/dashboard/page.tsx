'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, TrendingUp, CheckCircle, ArrowRight, Link as LinkIcon, DollarSign, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function InfluencerDashboardPage() {
  const toast = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Quick Link state
  const [targetUrl, setTargetUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);

      const res = await fetch('/api/influencer/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
        setRecentOrders(json.data.recentOrders || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    
    // Ensure URL has http
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    try {
      const url = new URL(finalUrl);
      if (profile?.referral_code) {
        url.searchParams.set('ref', profile.referral_code);
        setGeneratedLink(url.toString());
      } else {
        toast.error('Missing referral code', 'Please contact support.');
      }
    } catch (e) {
      toast.error('Invalid URL', 'Please enter a valid lavishorganic product URL.');
    }
  };

  const copyToClipboard = async (text: string, isCode: boolean) => {
    await navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-sage-light/20 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-sage-light/20 rounded-2xl"></div>
          <div className="h-40 bg-sage-light/20 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Partner'} 👋
          </h1>
          <p className="text-charcoal-lighter mt-1">Here is what's happening with your partner account today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-sage-50 border border-sage-light/30 px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-sage-dark tracking-wider">Your Code</span>
            <span className="font-mono font-medium text-charcoal bg-white px-2 py-1 rounded shadow-sm">
              {profile?.referral_code || 'PENDING'}
            </span>
            <button 
              onClick={() => copyToClipboard(profile?.referral_code || '', true)}
              className="text-sage-dark hover:text-charcoal transition-colors"
              title="Copy Code"
            >
              {copiedCode ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-sage-dark" />
            </div>
            <Link href="/influencer/dashboard/earnings" className="text-sm text-sage-dark font-medium hover:underline flex items-center gap-1">
              View payouts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-1">Total Earned</p>
            <p className="text-4xl font-display font-semibold text-charcoal">₹{stats?.totalEarned?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between bg-gradient-to-br from-charcoal to-charcoal-light text-white border-charcoal-light">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-1">Pending Payout</p>
            <p className="text-4xl font-display font-semibold text-white">₹{stats?.pendingPayout?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Link Generator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-sage-light/20 pb-4">
              <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-sage-dark" />
              </div>
              <h2 className="font-display text-xl font-semibold text-charcoal">Quick Link</h2>
            </div>
            <p className="text-sm text-charcoal-lighter mb-4">
              Paste any LavishOrganic product URL here to generate your trackable affiliate link.
            </p>
            <form onSubmit={handleGenerateLink} className="space-y-4">
              <input
                type="url"
                required
                placeholder="https://lavishorganic.com/shop/..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="input bg-warm-white"
              />
              <button type="submit" className="btn-primary w-full py-3">Generate Link</button>
            </form>

            {generatedLink && (
              <div className="mt-6 p-4 bg-sage-50 rounded-xl border border-sage-light/30 animate-fade-in">
                <p className="text-xs font-semibold text-sage-dark uppercase tracking-wider mb-2">Your Trackable Link</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedLink} 
                    className="flex-1 bg-white border border-sage-light/50 rounded-lg px-3 py-2 text-sm text-charcoal font-medium truncate outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedLink, false)}
                    className="btn-icon bg-white border border-sage-light/50 shadow-sm flex-shrink-0"
                  >
                    {copiedLink ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-charcoal-lighter" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="card p-6 bg-sage-50/50 border-sage-light/20">
            <h3 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-sage-dark" /> Free PR Program
            </h3>
            <p className="text-sm text-charcoal-lighter mb-4">
              Once you hit 50 cumulative sales, you become eligible for our VIP PR boxes for every new launch.
            </p>
            <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-sage-light/30">
              <div 
                className="h-full bg-sage-dark transition-all duration-1000"
                style={{ width: `${Math.min(((stats?.totalOrders || 0) / 50) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs font-bold text-sage-dark mt-2 text-right">
              {stats?.totalOrders || 0} / 50 Sales
            </p>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-sage-light/20 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-charcoal">Recent Sales</h2>
              <Link href="/influencer/dashboard/earnings" className="text-sm font-medium text-sage-dark hover:underline">
                View all &rarr;
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-cream/50 text-xs uppercase tracking-wider text-charcoal-lighter font-semibold border-b border-sage-light/20">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Order Value</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Your Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-light/10">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-sage-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal font-medium">
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-lighter">
                          ₹{order.total_amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-semibold",
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' || order.status === 'returned' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-800'
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-sage-dark text-right">
                          + ₹{order.commission_earned?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-sage-light" />
                </div>
                <h3 className="text-charcoal font-medium mb-1">No sales yet</h3>
                <p className="text-sm text-charcoal-lighter max-w-sm mx-auto">
                  Share your referral link with your audience to start earning commission on every purchase!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
