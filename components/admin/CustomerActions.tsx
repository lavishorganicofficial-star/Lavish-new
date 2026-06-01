'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { ToggleRight, ToggleLeft, Loader2, ShieldAlert, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerActionsProps {
  customerId: string;
  initialCodBanned: boolean;
  initialIsVip: boolean;
}

export function CustomerActions({ customerId, initialCodBanned, initialIsVip }: CustomerActionsProps) {
  const [isCodBanned, setIsCodBanned] = useState(initialCodBanned);
  const [isVip, setIsVip] = useState(initialIsVip);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const handleToggleCod = async () => {
    setIsUpdating(true);
    const newValue = !isCodBanned;
    
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cod_banned: newValue }),
      });
      
      if (!res.ok) throw new Error('Failed to update COD status');
      
      setIsCodBanned(newValue);
      toast.success(newValue ? 'COD has been disabled for this customer' : 'COD has been enabled for this customer');
      router.refresh();
    } catch (err) {
      toast.error('Failed to update COD status');
    }
    setIsUpdating(false);
  };

  const handleToggleVip = async () => {
    setIsUpdating(true);
    const newValue = !isVip;
    
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_vip: newValue }),
      });
      
      if (!res.ok) throw new Error('Failed to update VIP status');
      
      setIsVip(newValue);
      toast.success(newValue ? 'Customer marked as VIP' : 'Customer removed from VIP');
      router.refresh();
    } catch (err) {
      toast.error('Failed to update VIP status');
    }
    setIsUpdating(false);
  };

  return (
    <div className="card p-6 space-y-6">
      <h2 className="font-display text-lg font-medium text-charcoal">Customer Segmentation & Controls</h2>
      
      <div className="space-y-4">
        {/* VIP Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-sage-light/30 rounded-xl bg-warm-white">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg mt-0.5", isVip ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500")}>
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-charcoal text-sm">VIP Customer</p>
              <p className="text-xs text-charcoal-lighter">Mark this customer as VIP for analytics and special treatment.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleVip} 
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              isVip ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : isVip ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {isVip ? 'VIP Active' : 'Mark as VIP'}
          </button>
        </div>

        {/* COD Ban Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-xl bg-red-50/30">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg mt-0.5", isCodBanned ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500")}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-charcoal text-sm">Ban Cash on Delivery</p>
              <p className="text-xs text-charcoal-lighter">Prevent this customer from placing COD orders at checkout.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleCod} 
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              isCodBanned ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : isCodBanned ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {isCodBanned ? 'COD Banned' : 'Allow COD'}
          </button>
        </div>
      </div>
    </div>
  );
}
