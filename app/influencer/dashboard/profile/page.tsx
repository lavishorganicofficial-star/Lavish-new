'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Building, Smartphone, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ProfileContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'payout' ? 'payout' : 'profile';
  
  const [activeTab, setActiveTab] = useState<'profile' | 'payout'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({});

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/influencer/profile');
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/influencer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Save failed', json.error);
      }
    } catch (e) {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-sage-light/20 rounded-xl max-w-sm"></div>
        <div className="h-96 bg-sage-light/20 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Profile & Settings</h1>
        <p className="text-charcoal-lighter">Manage your partner account and payout preferences.</p>
      </div>

      <div className="flex border-b border-sage-light/30">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'profile' 
              ? "border-sage-dark text-sage-dark" 
              : "border-transparent text-charcoal-lighter hover:text-charcoal hover:bg-warm-white rounded-t-lg"
          )}
        >
          <UserIcon className="w-4 h-4" /> Personal Details
        </button>
        <button
          onClick={() => setActiveTab('payout')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'payout' 
              ? "border-sage-dark text-sage-dark" 
              : "border-transparent text-charcoal-lighter hover:text-charcoal hover:bg-warm-white rounded-t-lg"
          )}
        >
          <Building className="w-4 h-4" /> Payout Settings
        </button>
      </div>

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Full Name</label>
                  <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Email (Read Only)</label>
                  <input type="email" value={profile.email || ''} readOnly className="input bg-cream text-charcoal-lighter cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">WhatsApp Number</label>
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Instagram Handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter">@</span>
                    <input type="text" name="instagram_handle" value={profile.instagram_handle || ''} onChange={handleChange} className="input pl-8" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Content Niche</label>
                  <select name="content_niche" value={profile.content_niche || ''} onChange={handleChange} className="select">
                    <option value="">Select your main niche...</option>
                    <option value="skincare">Skincare & Beauty</option>
                    <option value="lifestyle">Lifestyle & Fashion</option>
                    <option value="wellness">Health & Wellness</option>
                    <option value="mom">Mom / Parenting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">YouTube Channel</label>
                  <input type="text" name="youtube_channel" value={profile.youtube_channel || ''} onChange={handleChange} className="input" placeholder="Optional" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payout' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-sage-50 border border-sage-light/30 rounded-xl p-4 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-charcoal">How payouts work</p>
                  <p className="text-xs text-charcoal-lighter">
                    You can receive payments via UPI or direct Bank Transfer. We process payouts on the 1st and 15th of every month for all requested balances above ₹1000.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold text-charcoal border-b border-sage-light/20 pb-2">UPI Details</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">UPI ID</label>
                  <input type="text" name="upi_id" value={profile.upi_id || ''} onChange={handleChange} className="input" placeholder="e.g. name@okaxis" />
                  <p className="text-[10px] text-charcoal-lighter">Preferred method for faster payouts.</p>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-sage-light/20">
                <h3 className="font-display text-xl font-semibold text-charcoal border-b border-sage-light/20 pb-2">Bank Transfer Details</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Account Holder Name</label>
                  <input type="text" name="bank_account_name" value={profile.bank_account_name || ''} onChange={handleChange} className="input" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">Account Number</label>
                    <input type="password" name="bank_account_number" value={profile.bank_account_number || ''} onChange={handleChange} className="input" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">IFSC Code</label>
                    <input type="text" name="bank_ifsc" value={profile.bank_ifsc || ''} onChange={handleChange} className="input uppercase" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-sage-light/20 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary py-3 px-8">
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InfluencerProfilePage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-sage-light/20 rounded-2xl"></div>}>
      <ProfileContent />
    </Suspense>
  );
}
