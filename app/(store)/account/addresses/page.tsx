'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: 'Maharashtra', pincode: '', is_default: false });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    setAddresses(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('addresses').insert({ ...form, user_id: user.id });
    setSaving(false);
    setShowForm(false);
    setForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: 'Maharashtra', pincode: '', is_default: false });
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    load();
  };

  const INDIAN_STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-charcoal">Saved Addresses</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {/* Add Address Form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-medium text-charcoal mb-4">New Address</h2>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">Full Name *</label>
              <input required className="input w-full" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">Phone *</label>
              <input required className="input w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">Address Line 1 *</label>
              <input required className="input w-full" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} placeholder="House/Flat no, Street name" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">Address Line 2</label>
              <input className="input w-full" value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} placeholder="Landmark, Area (optional)" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">City *</label>
              <input required className="input w-full" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">State *</label>
              <select required className="input w-full" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter mb-1">Pincode *</label>
              <input required className="input w-full" value={form.pincode} maxLength={6} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="is_default" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="accent-sage-dark" />
              <label htmlFor="is_default" className="text-sm text-charcoal">Set as default address</label>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Address'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards */}
      {loading ? (
        <div className="card p-8 text-center"><div className="w-6 h-6 border-2 border-sage-dark border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : addresses.length ? (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`card p-5 ${addr.is_default ? 'ring-2 ring-sage-dark/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-sage-dark mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-charcoal">{addr.full_name}</p>
                      {addr.is_default && (
                        <span className="text-xs bg-sage-50 text-sage-dark px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal-lighter">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                    <p className="text-sm text-charcoal-lighter">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-xs text-charcoal-lighter mt-1">{addr.phone}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(addr.id)} className="btn-icon text-red-400 hover:text-red-600" aria-label="Delete address">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-sage-light mx-auto mb-4" />
          <h3 className="font-medium text-charcoal mb-2">No addresses saved</h3>
          <p className="text-sm text-charcoal-lighter mb-6">Add your delivery addresses for faster checkout.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      )}
    </div>
  );
}
