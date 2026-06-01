'use client';

import { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/store/uiStore';

export function ResetSystemButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleReset = async () => {
    if (confirmText !== 'RESET') return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmText }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('System Wiped', 'Factory reset completed successfully. Your admin account was preserved.');
        setIsOpen(false);
        setConfirmText('');
      } else {
        toast.error('Reset Failed', data.error || 'An error occurred during reset.');
      }
    } catch (err) {
      toast.error('Reset Error', 'A network error occurred.');
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="shrink-0 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Factory Reset
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
            
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            
            <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">Are you absolutely sure?</h2>
            <p className="text-sm text-charcoal-lighter mb-6 leading-relaxed">
              This action <strong>cannot</strong> be undone. This will permanently delete all operational data including <strong>orders, products, customers, and influencers</strong>. 
              Only your Admin account and Store Settings will be kept.
            </p>
            
            <div className="mb-6 space-y-2">
              <label className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Type "RESET" to confirm
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full border-2 border-red-100 bg-red-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 font-mono transition-colors text-charcoal placeholder:text-red-300"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setIsOpen(false); setConfirmText(''); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-charcoal rounded-xl py-3 text-sm font-semibold transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleReset}
                disabled={confirmText !== 'RESET' || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Wipe System'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
