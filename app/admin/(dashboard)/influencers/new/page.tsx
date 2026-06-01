'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/store/uiStore';

export default function AdminNewInfluencerPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/influencer/apply', { // Reusing apply API but we can add admin flag later if needed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Influencer Added', 'They have been added to the pending list.');
        router.push('/admin/influencers');
      } else {
        toast.error('Failed', json.error);
      }
    } catch {
      toast.error('Error', 'Failed to add influencer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/influencers" className="p-2 hover:bg-sage-light/20 rounded-full transition-colors text-charcoal">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Add Influencer</h1>
          <p className="text-sm text-charcoal-lighter">Manually invite a new partner.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-warm border border-sage-light/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Full Name *</label>
              <input required type="text" name="name" className="input-field bg-warm-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Phone Number *</label>
              <input required type="tel" name="phone" className="input-field bg-warm-white" pattern="[0-9]{10}" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-charcoal">Email Address *</label>
            <input required type="email" name="email" className="input-field bg-warm-white" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Instagram Handle *</label>
              <input required type="text" name="instagram_handle" className="input-field bg-warm-white" placeholder="@" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Follower Count *</label>
              <select required name="follower_count" className="input-field bg-warm-white">
                <option value="5000">1K - 10K</option>
                <option value="25000">10K - 50K</option>
                <option value="75000">50K - 100K</option>
                <option value="200000">100K+</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-charcoal">Content Niche *</label>
            <input required type="text" name="content_niche" className="input-field bg-warm-white" placeholder="Skincare, Beauty..." />
          </div>

          <div className="space-y-1.5 hidden">
            {/* Auto fill notes for admin addition */}
            <input type="hidden" name="notes" value="Manually added by Admin." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4">
            <Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Influencer'}
          </button>
        </form>
      </div>
    </div>
  );
}
