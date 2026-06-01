'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, TrendingUp, Wallet, ArrowRight, UserCheck, UserX, AtSign, Phone, Mail, Award, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/store/uiStore';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminInfluencersPage() {
  const supabase = createClient();
  const toast = useToast();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const fetchInfluencers = async () => {
    setLoading(true);
    let query = supabase
      .from('influencer_profiles')
      .select(`
        *,
        profiles!influencer_profiles_id_fkey ( full_name, phone )
      `)
      .order('created_at', { ascending: false });

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Error', 'Failed to load influencers');
    } else {
      setInfluencers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInfluencers();
  }, [activeTab]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/influencers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Success', `Partner ${action} successfully.`);
        fetchInfluencers();
      } else {
        toast.error('Error', data.error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to perform action');
    }
  };

  const filtered = influencers.filter(inf => 
    (inf.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (inf.instagram_handle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Premium Header */}
      <div className="relative bg-charcoal rounded-3xl p-8 overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-sage-dark/80 z-10"></div>
        
        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-light/20 border border-sage-light/30 rounded-full text-sage-light text-xs font-semibold uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5" /> Partner Program
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-white mb-2">Creator Network</h1>
            <p className="text-white/70 max-w-lg">Manage influencer applications, track performance, and process monthly commission payouts securely.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/api/admin/influencers/report" target="_blank" rel="noopener noreferrer" className="btn-outline border-white/30 text-white hover:bg-white/10 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Export Report
            </a>
            <Link href="/admin/influencers/payouts" className="btn-outline border-white/30 text-white hover:bg-white/10 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Bulk Payouts
            </Link>
            <Link href="/admin/influencers/new" className="bg-white text-charcoal hover:bg-cream transition-colors rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-black/10">
              <Plus className="w-4 h-4" /> Add Partner
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-sage-light/30 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex gap-1 w-full md:w-auto bg-warm-white p-1 rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize",
                activeTab === tab 
                  ? "bg-white text-sage-dark shadow-sm ring-1 ring-black/5"
                  : "text-charcoal-lighter hover:text-charcoal hover:bg-white/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72 px-2 md:px-0">
          <Search className="w-4 h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
          <input
            type="text"
            placeholder="Search by name or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-charcoal-lighter/70"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-sage-light/30 border-t-sage-dark rounded-full animate-spin mb-4"></div>
          <p className="text-charcoal-lighter font-medium animate-pulse">Loading partners...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-sage-light/20 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-sage-light" />
          </div>
          <h3 className="text-xl font-display font-semibold text-charcoal mb-2">No partners found</h3>
          <p className="text-charcoal-lighter max-w-sm">We couldn't find any influencers matching your current filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(inf => (
            <div key={inf.id} className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-warm transition-all duration-300 border border-sage-light/20 flex flex-col relative overflow-hidden">
              
              {/* Status Ribbon */}
              <div className={cn(
                "absolute top-0 right-0 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl",
                inf.status === 'approved' ? "bg-sage-100 text-sage-dark" :
                inf.status === 'pending' ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>
                {inf.status}
              </div>

              {/* Header Info */}
              <div className="flex items-start gap-4 mb-6 mt-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage-light to-sage-dark flex items-center justify-center text-white font-display text-xl shadow-md shrink-0">
                  {inf.profiles?.full_name?.charAt(0) || '@'}
                </div>
                <div className="min-w-0 pr-12">
                  <h3 className="font-semibold text-charcoal truncate text-lg">{inf.profiles?.full_name || 'Unknown User'}</h3>
                  <div className="flex items-center gap-1.5 text-sage-dark mt-0.5">
                    <AtSign className="w-3.5 h-3.5" />
                    <a href={`https://instagram.com/${inf.instagram_handle?.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate">
                      {inf.instagram_handle || 'No Handle'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-cream rounded-2xl p-4 border border-sage-light/10">
                  <p className="text-[10px] uppercase font-bold text-charcoal-lighter tracking-wider mb-1">Followers</p>
                  <p className="font-semibold text-charcoal text-lg">{(inf.follower_count / 1000).toFixed(1)}k</p>
                </div>
                <div className="bg-cream rounded-2xl p-4 border border-sage-light/10">
                  <p className="text-[10px] uppercase font-bold text-charcoal-lighter tracking-wider mb-1">Niche</p>
                  <p className="font-semibold text-charcoal text-base truncate capitalize">{inf.niche || 'General'}</p>
                </div>
                
                {inf.status === 'approved' && (
                  <>
                    <div className="bg-sage-50/50 rounded-2xl p-4 border border-sage-light/10">
                      <p className="text-[10px] uppercase font-bold text-charcoal-lighter tracking-wider mb-1">Total Sales</p>
                      <p className="font-semibold text-sage-dark text-lg">{formatCurrency(inf.total_sales_value || 0)}</p>
                    </div>
                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/50">
                      <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider mb-1">Pending Payout</p>
                      <p className="font-semibold text-amber-600 text-lg">{formatCurrency(inf.pending_commission || 0)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6 text-sm text-charcoal-lighter">
                {inf.profiles?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {inf.profiles.phone}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto pt-4 border-t border-sage-light/20">
                {inf.status === 'pending' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleAction(inf.id, 'rejected')} className="btn-outline border-red-200 text-red-600 hover:bg-red-50 py-2.5 text-sm flex items-center justify-center gap-2">
                      <UserX className="w-4 h-4" /> Reject
                    </button>
                    <button onClick={() => handleAction(inf.id, 'approved')} className="bg-sage-dark text-white rounded-xl hover:bg-sage-light transition-colors py-2.5 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
                      <UserCheck className="w-4 h-4" /> Approve
                    </button>
                  </div>
                ) : (
                  <Link href={`/admin/influencers/${inf.id}`} className="w-full bg-cream hover:bg-sage-50 text-sage-dark border border-sage-light/30 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    View Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
