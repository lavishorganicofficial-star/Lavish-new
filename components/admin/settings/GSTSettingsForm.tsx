'use client';

import { useState } from 'react';
import { ToggleLeft, ToggleRight, Loader2, CreditCard } from 'lucide-react';

interface Props {
  initialSettings: {
    gst_enabled: boolean;
    gst_rate: number;
    business_name: string;
    registered_state: string;
  };
}

export function GSTSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const save = async (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast('Tax Settings saved!');
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : 'Failed to save'}`);
      setSettings(settings); // revert
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-light/20 relative">
      <div className="flex items-center justify-between mb-6 border-b border-sage-light/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-charcoal">GST & Tax System</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {settings.gst_enabled 
                ? 'GST is enabled. Tax calculations and Tax Invoices will be generated.' 
                : 'GST is disabled. The system will operate in non-tax mode.'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => save({ gst_enabled: !settings.gst_enabled })}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm ${
            settings.gst_enabled ? 'bg-sage-dark text-white ring-2 ring-sage-light/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {settings.gst_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {settings.gst_enabled ? 'GST Enabled' : 'GST Disabled'}
        </button>
      </div>
      
      {settings.gst_enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">GSTIN</label>
            <input className="w-full border border-sage-light/40 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono text-gray-500 cursor-not-allowed" placeholder="Set via ENV variables" defaultValue={process.env.NEXT_PUBLIC_BUSINESS_GSTIN ?? ''} readOnly />
            <p className="text-[10px] text-gray-400">Change via environment variables.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Registered State</label>
            <input 
              className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" 
              value={settings.registered_state} 
              onChange={(e) => setSettings(s => ({ ...s, registered_state: e.target.value }))}
              onBlur={() => save({ registered_state: settings.registered_state })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Business Name (Legal)</label>
            <input 
              className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors" 
              value={settings.business_name} 
              onChange={(e) => setSettings(s => ({ ...s, business_name: e.target.value }))}
              onBlur={() => save({ business_name: settings.business_name })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sage-dark uppercase tracking-wider">Default GST Rate</label>
            <select 
              className="w-full border border-sage-light/40 bg-warm-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-dark transition-colors appearance-none"
              value={settings.gst_rate}
              onChange={(e) => setSettings(s => ({ ...s, gst_rate: Number(e.target.value) }))}
              onBlur={() => save({ gst_rate: settings.gst_rate })}
            >
              <option value="28">28%</option>
              <option value="18">18% (Standard)</option>
              <option value="12">12%</option>
              <option value="5">5%</option>
              <option value="0">0% (Exempt)</option>
            </select>
          </div>
        </div>
      )}

      {saving && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-charcoal text-white text-xs font-medium rounded-full shadow-lg">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </div>
      )}

      {toast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-sage-dark text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}
    </div>
  );
}
