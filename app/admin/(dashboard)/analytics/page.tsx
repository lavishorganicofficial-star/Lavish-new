'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Package, Users, Search, TrendingUp, ArrowRight, ExternalLink, Activity, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'traffic' | 'products' | 'referrals' | 'searches' | 'ga'>('traffic');
  const [range, setRange] = useState('30d');
  
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, prodRes] = await Promise.all([
          fetch(`/api/analytics/summary?range=${range}`),
          fetch(`/api/analytics/products?range=${range}`)
        ]);
        const sumData = await sumRes.json();
        const prodData = await prodRes.json();

        if (sumData.success) setSummary(sumData.data);
        if (prodData.success) setProducts(prodData.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const tabs = [
    { id: 'traffic', label: 'Traffic & Conversion', icon: BarChart3 },
    { id: 'products', label: 'Product Performance', icon: Package },
    { id: 'referrals', label: 'Referrals (UTM)', icon: Users },
    { id: 'searches', label: 'Search Queries', icon: Search },
    { id: 'ga', label: 'Google Analytics', icon: ExternalLink },
  ] as const;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-sage-light border-t-sage-dark rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Analytics</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">Track store performance and visitor behavior</p>
        </div>
        <select 
          className="input w-full sm:w-auto bg-white"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider mb-1">Visitors</p>
            <p className="text-2xl font-display font-semibold text-charcoal">{summary.visitors.toLocaleString()}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider mb-1">Sessions</p>
            <p className="text-2xl font-display font-semibold text-charcoal">{summary.sessions.toLocaleString()}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider mb-1">Page Views</p>
            <p className="text-2xl font-display font-semibold text-charcoal">{summary.pageViews.toLocaleString()}</p>
          </div>
          <div className="card p-5 bg-sage-50/50 border-sage-light/30">
            <p className="text-xs font-medium text-sage-dark uppercase tracking-wider mb-1">Conversion Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-display font-semibold text-charcoal">
                {summary.conversionRate.toFixed(2)}%
              </p>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-sage-dark text-sage-dark bg-sage-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="card p-0 overflow-hidden">
        
        {/* TRAFFIC */}
        {activeTab === 'traffic' && summary && (
          <div className="p-6">
            <h3 className="font-medium text-charcoal mb-6">Daily Visitors & Page Views</h3>
            <div className="h-64 flex items-end gap-2 text-xs text-charcoal-lighter">
              {/* Very basic CSS bar chart representation */}
              {summary.chartData.map((d: any, i: number) => {
                const max = Math.max(...summary.chartData.map((x: any) => x.views), 1);
                const heightPct = (d.views / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div 
                      className="w-full bg-sage-dark/20 group-hover:bg-sage-dark/40 rounded-t transition-colors relative"
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10 pointer-events-none">
                        {d.views} views<br/>{d.visitors} visitors
                      </div>
                    </div>
                    {/* Only show dates for first, middle, last to avoid clutter */}
                    {(i === 0 || i === Math.floor(summary.chartData.length / 2) || i === summary.chartData.length - 1) && (
                      <span className="text-[10px] whitespace-nowrap">{new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-charcoal-lighter text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Add to Carts</th>
                  <th className="px-6 py-4 text-right">Checkouts</th>
                  <th className="px-6 py-4 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-charcoal-lighter">No product data for this range</td>
                  </tr>
                ) : (
                  products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <Link href={`/shop/${p.slug}`} className="font-medium text-charcoal hover:text-sage-dark flex items-center gap-2" target="_blank">
                          {p.name}
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right">{p.views}</td>
                      <td className="px-6 py-4 text-right">{p.addToCarts}</td>
                      <td className="px-6 py-4 text-right">{p.checkouts}</td>
                      <td className="px-6 py-4 text-right font-medium text-sage-dark">{p.conversionRate.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-sage-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-charcoal mb-2">Referral Tracking Active</h3>
            <p className="text-charcoal-lighter">UTM Source/Medium tracking is being captured in the database. Add detailed referral queries in the next update.</p>
          </div>
        )}

        {/* SEARCHES */}
        {activeTab === 'searches' && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-sage-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-charcoal mb-2">Search Analytics Active</h3>
            <p className="text-charcoal-lighter">Search queries are being logged to the search_analytics table. Add detailed search analytics views in the next update.</p>
          </div>
        )}

        {/* GOOGLE ANALYTICS */}
        {activeTab === 'ga' && (
          <div className="p-8">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <div className="w-16 h-16 bg-[#F8FAFC] border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <PieChart className="w-8 h-8 text-[#E37400]" />
              </div>
              <h3 className="font-display text-2xl font-medium text-charcoal mb-2">Google Analytics Integration</h3>
              <p className="text-charcoal-lighter text-sm">
                Your store is successfully connected to Google Analytics (Tag: G-RV435264ZX). Access your real-time reporting dashboards directly through the quick links below.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {/* Main Dashboard */}
              <a 
                href="https://analytics.google.com/analytics/web/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="card p-6 border-gray-100 hover:border-sage-dark/30 hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-sage-50 text-sage-dark flex items-center justify-center flex-shrink-0 group-hover:bg-sage-dark group-hover:text-white transition-colors">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal mb-1 flex items-center gap-2">
                    Full GA4 Dashboard
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-sage-dark" />
                  </h4>
                  <p className="text-xs text-charcoal-lighter leading-relaxed">
                    View your complete Google Analytics workspace including user acquisition, engagement, and monetization reports.
                  </p>
                </div>
              </a>

              {/* Realtime */}
              <a 
                href="https://analytics.google.com/analytics/web/#/p452932338/realtime/overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="card p-6 border-gray-100 hover:border-sage-dark/30 hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-sage-50 text-sage-dark flex items-center justify-center flex-shrink-0 group-hover:bg-sage-dark group-hover:text-white transition-colors">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal mb-1 flex items-center gap-2">
                    Realtime Overview
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-sage-dark" />
                  </h4>
                  <p className="text-xs text-charcoal-lighter leading-relaxed">
                    Monitor activity as it happens. See where your current active users are coming from and what pages they are viewing.
                  </p>
                </div>
              </a>
            </div>

            <div className="mt-8 text-center bg-gray-50 rounded-lg p-4 max-w-3xl mx-auto border border-gray-100">
               <p className="text-xs text-charcoal-lighter">
                 <strong>Note:</strong> Advanced native charts can be embedded here in the future using the <span className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">@google-analytics/data</span> API by providing a GCP Service Account key.
               </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
