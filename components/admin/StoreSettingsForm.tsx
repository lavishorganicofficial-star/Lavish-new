'use client';

import { useState } from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface Props {
  initialSettings: {
    gst_enabled: boolean;
    gst_rate: number;
    cod_enabled: boolean;
    cod_fee: number;
    free_shipping_threshold: number;
    flat_shipping_rate: number;
  };
}

export function StoreSettingsForm({ initialSettings }: Props) {
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
      showToast('Settings saved!');
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : 'Failed to save'}`);
      setSettings(settings); // revert
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
        value ? 'bg-sage-dark/10 text-sage-dark' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {value ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
      {value ? 'Enabled' : 'Disabled'}
    </button>
  );

  return (
    <div className="space-y-4">

      {/* Shipping Settings */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-charcoal">Cash on Delivery (COD)</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {settings.cod_enabled ? `COD available with ₹${settings.cod_fee} handling fee` : 'COD is disabled'}
            </p>
          </div>
          <Toggle value={settings.cod_enabled} onChange={(v) => save({ cod_enabled: v })} />
        </div>
        {settings.cod_enabled && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-sage-light/20">
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">COD Fee (₹)</label>
              <input
                type="number"
                className="input w-full"
                value={settings.cod_fee}
                onChange={(e) => setSettings(s => ({ ...s, cod_fee: Number(e.target.value) }))}
                onBlur={() => save({ cod_fee: settings.cod_fee })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shipping Threshold */}
      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-4">Shipping</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1">Free Shipping Above (₹)</label>
            <input
              type="number"
              className="input w-full"
              value={settings.free_shipping_threshold}
              onChange={(e) => setSettings(s => ({ ...s, free_shipping_threshold: Number(e.target.value) }))}
              onBlur={() => save({ free_shipping_threshold: settings.free_shipping_threshold })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1">Flat Shipping Rate (₹)</label>
            <input
              type="number"
              className="input w-full"
              value={settings.flat_shipping_rate}
              onChange={(e) => setSettings(s => ({ ...s, flat_shipping_rate: Number(e.target.value) }))}
              onBlur={() => save({ flat_shipping_rate: settings.flat_shipping_rate })}
            />
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-charcoal-lighter">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-sage-dark text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
