'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OfferFormProps {
  initialData?: any;
}

export default function OfferForm({ initialData }: OfferFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    // Formatting specific fields
    const data = {
      ...payload,
      discount_percentage: payload.discount_percentage ? parseFloat(payload.discount_percentage as string) : null,
      sort_order: payload.sort_order ? parseInt(payload.sort_order as string, 10) : 0,
      is_active: formData.get('is_active') === 'on',
      starts_at: payload.starts_at ? new Date(payload.starts_at as string).toISOString() : null,
      ends_at: payload.ends_at ? new Date(payload.ends_at as string).toISOString() : null,
    };

    try {
      const url = isEdit ? `/api/admin/offers/${initialData.id}` : '/api/admin/offers';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Failed to save offer');

      router.push('/admin/offers');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Convert ISO dates to datetime-local format (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Adjust for timezone offset to show local time in the input
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/offers" className="btn-icon bg-white shadow-sm border border-sage-light/20 text-charcoal hover:bg-sage-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-medium text-charcoal">
            {isEdit ? 'Edit Offer' : 'Create New Offer'}
          </h1>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Offer'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Title *</label>
            <input 
              type="text" 
              name="title" 
              required
              defaultValue={initialData?.title} 
              className="input-field bg-warm-white/50" 
              placeholder="e.g. Summer Glow Sale — Up to 40% Off" 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Description</label>
            <textarea 
              name="description" 
              rows={3} 
              defaultValue={initialData?.description} 
              className="input-field bg-warm-white/50 resize-none" 
              placeholder="e.g. Treat your skin this summer! Get up to 40% off on our bestselling face care range."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Offer Type *</label>
            <select name="type" defaultValue={initialData?.type || 'flash_sale'} className="input-field bg-warm-white/50" required>
              <option value="flash_sale">Flash Sale</option>
              <option value="banner">Banner</option>
              <option value="popup">Popup</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Discount Percentage (%)</label>
            <input 
              type="number" 
              step="0.01" 
              name="discount_percentage" 
              defaultValue={initialData?.discount_percentage} 
              className="input-field bg-warm-white/50" 
              placeholder="e.g. 40" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Starts At *</label>
            <input 
              type="datetime-local" 
              name="starts_at" 
              required
              defaultValue={formatForInput(initialData?.starts_at)} 
              className="input-field bg-warm-white/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Ends At *</label>
            <input 
              type="datetime-local" 
              name="ends_at" 
              required
              defaultValue={formatForInput(initialData?.ends_at)} 
              className="input-field bg-warm-white/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Sort Order</label>
            <input 
              type="number" 
              name="sort_order" 
              defaultValue={initialData?.sort_order || 0} 
              className="input-field bg-warm-white/50" 
              placeholder="e.g. 0" 
            />
          </div>

          <div className="flex items-center h-full pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="is_active" 
                defaultChecked={initialData ? initialData.is_active : true} 
                className="w-5 h-5 rounded border-sage-light/30 text-sage-dark focus:ring-sage-dark cursor-pointer" 
              />
              <span className="text-sm font-semibold text-charcoal">Active Offer</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
