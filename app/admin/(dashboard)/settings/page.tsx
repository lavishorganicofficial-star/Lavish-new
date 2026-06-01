import type { Metadata } from 'next';
import { Bell, Globe, CreditCard, Truck, AlertTriangle, MessageSquare, Share2, Settings, ShieldAlert, Download, Trash2, RotateCcw } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { HeroSlidesManager } from '@/components/admin/HeroSlidesManager';
import { StoreSettingsForm } from '@/components/admin/StoreSettingsForm';
import { WhatsAppLogsTable } from '@/components/admin/settings/WhatsAppLogsTable';
import { ResetSystemButton } from '@/components/admin/settings/ResetSystemButton';
import { ResetOrdersButton } from '@/components/admin/settings/ResetOrdersButton';
import { GSTSettingsForm } from '@/components/admin/settings/GSTSettingsForm';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Settings | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const adminDb = await createAdminClient();
  const [{ data: heroSlides }, { data: rawSettings }, { data: waLogs }] = await Promise.all([
    adminDb.from('hero_slides').select('*').order('sort_order', { ascending: true }),
    adminDb.from('store_settings').select('key, value'),
    adminDb.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || 'store';

  const settingsMap: Record<string, unknown> = {};
  (rawSettings ?? []).forEach(({ key, value }) => { settingsMap[key] = value; });

  const parseBool = (val: unknown, fallback: boolean) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return typeof val === 'boolean' ? val : fallback;
  };

  const storeSettings = {
    gst_enabled: parseBool(settingsMap.gst_enabled, true),
    gst_rate: Number(settingsMap.gst_rate ?? 18),
    business_name: String(settingsMap.business_name ?? 'LavishOrganic Private Limited'),
    registered_state: String(settingsMap.registered_state ?? 'Gujarat'),
    cod_enabled: parseBool(settingsMap.cod_enabled, true),
    cod_fee: Number(settingsMap.cod_fee ?? 30),
    free_shipping_threshold: Number(settingsMap.free_shipping_threshold ?? 499),
    flat_shipping_rate: Number(settingsMap.flat_shipping_rate ?? 49),
  };

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Globe },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Alerts & WhatsApp', icon: Bell },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      
      {/* Premium Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sage-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 z-0"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-50 border border-sage-100 rounded-full text-sage-dark text-xs font-bold uppercase tracking-wider mb-4">
            <Settings className="w-3.5 h-3.5" /> Configuration
          </div>
          <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Store Settings</h1>
          <p className="text-charcoal-lighter">Manage your store's core configuration, shipping rules, and API integrations.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Modern Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-sage-light/20 sticky top-6">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={`/admin/settings?tab=${tab.id}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive 
                        ? tab.id === 'danger' 
                          ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100'
                          : 'bg-sage-dark text-white shadow-md shadow-sage-dark/20'
                        : tab.id === 'danger'
                          ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-charcoal-lighter hover:text-charcoal hover:bg-sage-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive && tab.id !== 'danger' ? 'text-white' : ''}`} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* TAB 1: Store Info */}
          {currentTab === 'store' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HeroSlidesManager initialSlides={heroSlides ?? []} />
              
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20">
                <div className="flex items-center gap-3 mb-6 border-b border-sage-light/20 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-sage-dark" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-charcoal">Store Information</h2>
                    <p className="text-xs text-charcoal-lighter mt-0.5">Basic details displayed to your customers.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Store Name</label>
                    <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="LavishOrganic" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Store URL</label>
                    <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="https://lavishorganic.in" />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Support Email</label>
                    <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="hello@lavishorganic.in" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Support Phone</label>
                    <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="+91 98765 43210" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Business WhatsApp</label>
                    <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="+91 98765 43210" />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button className="btn-primary px-8 py-3 rounded-xl shadow-md">Save Changes</button>
                </div>
              </div>
              
              {/* GST Settings */}
              <GSTSettingsForm initialSettings={storeSettings} />
            </div>
          )}

          {/* TAB 2: Shipping */}
          {currentTab === 'shipping' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StoreSettingsForm initialSettings={storeSettings} />
            </div>
          )}

          {/* TAB 3: Notifications */}
          {currentTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WhatsApp Config */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20">
                  <div className="flex items-center gap-3 mb-6 border-b border-sage-light/20 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-sage-dark" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-charcoal">WhatsApp Provider</h2>
                      <p className="text-xs text-charcoal-lighter mt-0.5">API connection for transactional messages.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Provider</label>
                      <select className="w-full border border-sage-light/40 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed appearance-none" disabled defaultValue="interakt">
                        <option value="interakt">Interakt (Active)</option>
                        <option value="twilio">Twilio</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">API Key</label>
                      <input className="w-full border border-sage-light/40 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono text-gray-500 cursor-not-allowed" disabled defaultValue="••••••••••••••••" />
                    </div>
                    <button className="w-full bg-cream hover:bg-sage-50 text-sage-dark border border-sage-light/30 rounded-xl py-3 text-sm font-semibold transition-colors">
                      Test Connection
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20">
                  <div className="flex items-center gap-3 mb-6 border-b border-sage-light/20 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-sage-dark" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-charcoal">Active Templates</h2>
                      <p className="text-xs text-charcoal-lighter mt-0.5">Automated messages sent to customers.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {['Order Confirmed', 'Order Packed', 'Order Shipped', 'Order Delivered', 'Refund Initiated', 'Order Cancelled'].map((t) => (
                      <div key={t} className="flex items-center gap-3 p-3 rounded-xl border border-sage-light/20 bg-warm-white hover:bg-sage-50/50 transition-colors">
                        <input type="checkbox" defaultChecked disabled className="w-4 h-4 accent-sage-dark rounded border-sage-light/50 cursor-not-allowed" />
                        <span className="text-sm font-medium text-charcoal">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp Logs */}
              <div className="bg-white rounded-3xl shadow-sm border border-sage-light/20 overflow-hidden">
                <div className="p-8 border-b border-sage-light/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-charcoal">Recent WhatsApp Logs</h2>
                    <p className="text-sm text-charcoal-lighter mt-1">History of the last 50 automated messages sent.</p>
                  </div>
                </div>
                <div className="p-0">
                  <WhatsAppLogsTable logs={waLogs ?? []} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Social Media */}
          {currentTab === 'social' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-sage-light/20 pb-4">
                <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-sage-dark" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-charcoal">Social Profiles</h2>
                  <p className="text-xs text-charcoal-lighter mt-0.5">Links to your official social media pages.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Instagram URL</label>
                  <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="https://instagram.com/lavishorganic" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Facebook URL</label>
                  <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="https://facebook.com/lavishorganic" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">YouTube URL</label>
                  <input className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" defaultValue="" placeholder="https://youtube.com/..." />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button className="btn-primary px-8 py-3 rounded-xl shadow-md">Save Links</button>
              </div>
            </div>
          )}

          {/* TAB 5: Danger Zone */}
          {currentTab === 'danger' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-red-200 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              
              <div className="flex items-center gap-3 mb-6 border-b border-red-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-red-700">Danger Zone</h2>
                  <p className="text-xs text-red-500 mt-0.5">Destructive actions that cannot be undone.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/30 border border-red-100 rounded-2xl gap-4 hover:bg-red-50/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Export All Data</h3>
                    <p className="text-sm text-charcoal-lighter">Download a full database export as a JSON file.</p>
                  </div>
                  <button className="shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm">
                    <Download className="w-4 h-4" /> Export JSON
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/30 border border-red-100 rounded-2xl gap-4 hover:bg-red-50/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Clear Analytics Data</h3>
                    <p className="text-sm text-charcoal-lighter">Permanently delete all historic tracking and event data.</p>
                  </div>
                  <button className="shrink-0 px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm">
                    <Trash2 className="w-4 h-4" /> Clear Data
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/30 border border-red-100 rounded-2xl gap-4 hover:bg-red-50/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Reset Demo Orders</h3>
                    <p className="text-sm text-charcoal-lighter">Permanently delete all orders, revenue data, and reset stock quantities.</p>
                  </div>
                  <ResetOrdersButton />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/30 border border-red-100 rounded-2xl gap-4 hover:bg-red-50/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Reset Settings</h3>
                    <p className="text-sm text-charcoal-lighter">Revert all store configurations to factory default values.</p>
                  </div>
                  <ResetSystemButton />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
