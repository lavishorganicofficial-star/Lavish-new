'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CouponFormProps {
  initialData?: any;
}

export default function CouponForm({ initialData }: CouponFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;
  const isInfluencerCoupon = isEdit && !!initialData.influencer_id;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    // Formatting specific fields
    const data: any = {
      is_active: formData.get('is_active') === 'on',
      valid_from: payload.valid_from ? new Date(payload.valid_from as string).toISOString() : null,
      valid_until: payload.valid_until ? new Date(payload.valid_until as string).toISOString() : null,
      min_order_amount: payload.min_order_amount ? parseFloat(payload.min_order_amount as string) : 0,
      max_discount: payload.max_discount ? parseFloat(payload.max_discount as string) : null,
      usage_limit: payload.usage_limit ? parseInt(payload.usage_limit as string, 10) : null,
    };

    // Include protected fields only if not an influencer coupon
    if (!isInfluencerCoupon) {
      data.code = payload.code;
      data.type = payload.type;
      data.value = payload.value ? parseFloat(payload.value as string) : 0;
      data.per_user_limit = payload.per_user_limit ? parseInt(payload.per_user_limit as string, 10) : 1;
    }

    try {
      const url = isEdit ? `/api/admin/coupons/${initialData.id}` : '/api/admin/coupons';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Failed to save coupon');

      router.push('/admin/coupons');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/coupons" className="btn-icon bg-white shadow-sm border border-sage-light/20 text-charcoal hover:bg-sage-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-medium text-charcoal">
            {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Coupon'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      {isInfluencerCoupon && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-600" />
          <div>
            <strong>Influencer Coupon Protected</strong>
            <p className="mt-1">
              This coupon is tied to an Influencer profile. The Code, Type, Value, and Per User Limit fields are locked here to prevent breaking commission tracking. Please edit those settings in the <strong>Influencers</strong> tab instead.
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Coupon Code *</label>
            <input 
              type="text" 
              name="code" 
              required={!isInfluencerCoupon}
              disabled={isInfluencerCoupon}
              defaultValue={initialData?.code} 
              className="input-field bg-warm-white/50 uppercase" 
              placeholder="e.g. SUMMER20" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Discount Type *</label>
            <select 
              name="type" 
              disabled={isInfluencerCoupon}
              defaultValue={initialData?.type || 'percentage'} 
              className="input-field bg-warm-white/50" 
              required={!isInfluencerCoupon}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Discount Value *</label>
            <input 
              type="number" 
              step="0.01" 
              name="value" 
              required={!isInfluencerCoupon}
              disabled={isInfluencerCoupon}
              defaultValue={initialData?.value} 
              className="input-field bg-warm-white/50" 
              placeholder="e.g. 20" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Minimum Order Amount (₹)</label>
            <input 
              type="number" 
              step="1" 
              name="min_order_amount" 
              defaultValue={initialData?.min_order_amount || 0} 
              className="input-field bg-warm-white/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Maximum Discount (₹)</label>
            <input 
              type="number" 
              step="1" 
              name="max_discount" 
              defaultValue={initialData?.max_discount} 
              className="input-field bg-warm-white/50" 
              placeholder="Optional limit" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Total Usage Limit</label>
            <input 
              type="number" 
              name="usage_limit" 
              defaultValue={initialData?.usage_limit} 
              className="input-field bg-warm-white/50" 
              placeholder="Total times this can be used (Leave blank for unlimited)" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Per User Limit</label>
            <input 
              type="number" 
              name="per_user_limit" 
              disabled={isInfluencerCoupon}
              defaultValue={initialData?.per_user_limit || 1} 
              className="input-field bg-warm-white/50" 
              placeholder="Times a single customer can use it" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Valid From</label>
            <input 
              type="datetime-local" 
              name="valid_from" 
              defaultValue={formatForInput(initialData?.valid_from)} 
              className="input-field bg-warm-white/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Valid Until</label>
            <input 
              type="datetime-local" 
              name="valid_until" 
              defaultValue={formatForInput(initialData?.valid_until)} 
              className="input-field bg-warm-white/50" 
            />
          </div>

          <div className="flex items-center h-full pt-6 md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="is_active" 
                defaultChecked={initialData ? initialData.is_active : true} 
                className="w-5 h-5 rounded border-sage-light/30 text-sage-dark focus:ring-sage-dark cursor-pointer" 
              />
              <span className="text-sm font-semibold text-charcoal">Active Coupon</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
