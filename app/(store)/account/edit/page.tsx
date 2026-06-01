'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, phone, email').eq('id', user.id).single();
      setProfile({ full_name: data?.full_name ?? '', phone: data?.phone ?? '', email: data?.email ?? user.email ?? '' });
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq('id', user.id);
    setSaving(false);
    setMessage(error ? 'Failed to save. Please try again.' : 'Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return (
    <div className="card p-8 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-sage-dark" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-medium text-charcoal">My Profile</h1>

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              <User className="w-4 h-4 inline mr-1.5 text-sage-dark" />Full Name
            </label>
            <input
              className="input w-full"
              value={profile.full_name}
              onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              <Mail className="w-4 h-4 inline mr-1.5 text-sage-dark" />Email Address
            </label>
            <input className="input w-full bg-sage-50/50" value={profile.email} disabled readOnly />
            <p className="text-xs text-charcoal-lighter mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              <Phone className="w-4 h-4 inline mr-1.5 text-sage-dark" />Phone Number
            </label>
            <input
              className="input w-full"
              value={profile.phone}
              onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.includes('success') ? 'text-sage-dark' : 'text-red-500'}`}>{message}</p>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-4">Security</h2>
        <a href="/auth/reset-password" className="btn-secondary inline-flex items-center gap-2 text-sm">
          Change Password
        </a>
      </div>
    </div>
  );
}
