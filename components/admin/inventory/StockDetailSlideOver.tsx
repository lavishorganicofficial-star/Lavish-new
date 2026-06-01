'use client';

import { useState, useEffect } from 'react';
import { X, TrendingDown, ArrowUpRight, ArrowDownRight, Package, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/store/uiStore';

interface SlideOverProps {
  product: any;
  onClose: () => void;
  onRefresh: () => void;
}

export function StockDetailSlideOver({ product, onClose, onRefresh }: SlideOverProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Adjustment State
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Manual audit');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const toast = useToast();

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/movements?productId=${product.id}&limit=10`);
      const data = await res.json();
      setMovements(data.data || []);
    } catch (err) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [product.id]);

  const handleAdjustStock = async () => {
    if (adjustAmount === 0) return;
    setIsAdjusting(true);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          adjustmentAmount: adjustAmount,
          reason: adjustReason,
          type: 'adjustment'
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Stock adjusted successfully!');
      
      // Reset form and refresh data
      setAdjustAmount(0);
      setAdjustReason('Manual audit');
      fetchMovements();
      onRefresh(); // Updates the parent table
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Basic Velocity Calc: How many sold in recent movements?
  const recentSales = movements.filter(m => m.movement_type === 'sale').reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);
  const velocityScore = recentSales > 5 ? 'High' : recentSales > 0 ? 'Medium' : 'Low';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col overflow-y-auto transform transition-transform duration-300">
        
        <div className="p-5 border-b border-sage-light/20 flex items-center justify-between bg-warm-white sticky top-0 z-10">
          <div>
            <h2 className="font-display text-lg font-medium text-charcoal pr-4 truncate">{product.name}</h2>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wide mt-1">Stock Intelligence</p>
          </div>
          <button onClick={onClose} className="btn-icon p-2 bg-white rounded-full flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${product.stock_quantity <= 10 ? 'bg-red-50 border-red-200' : 'bg-sage-50/50 border-sage-light/30'}`}>
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Current Stock</p>
              <p className={`text-2xl font-bold ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-charcoal'}`}>
                {product.stock_quantity}
              </p>
              {product.stock_quantity === 0 && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">Out of Stock</p>}
              {product.stock_quantity > 0 && product.stock_quantity <= 10 && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">Low Stock Alert</p>}
            </div>
            
            <div className="p-4 rounded-lg border border-sage-light/30 bg-sage-50/50">
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Sales Velocity</p>
              <p className="text-2xl font-bold text-charcoal">{velocityScore}</p>
              <p className="text-[10px] text-charcoal-lighter mt-1 uppercase">{recentSales} recent sales</p>
            </div>
          </div>

          {/* Quick Adjustment Tool */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Quick Adjust</h3>
            <div className="card-flat p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-charcoal-lighter block mb-1">Change By (+ / -)</label>
                  <input 
                    type="number" 
                    value={adjustAmount || ''} 
                    onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)} 
                    placeholder="e.g. 5 or -2" 
                    className="input w-full" 
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-charcoal-lighter block mb-1">Reason</label>
                  <input 
                    type="text" 
                    value={adjustReason} 
                    onChange={e => setAdjustReason(e.target.value)} 
                    placeholder="Reason for adjustment" 
                    className="input w-full" 
                  />
                </div>
              </div>
              <button 
                onClick={handleAdjustStock}
                disabled={isAdjusting || adjustAmount === 0}
                className="w-full btn-primary flex justify-center items-center gap-2"
              >
                {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                Apply Adjustment
              </button>
            </div>
          </div>

          {/* Recent Movements Log */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Recent Log</h3>
            <div className="card-flat overflow-hidden">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-sage-dark" /></div>
              ) : movements.length === 0 ? (
                <div className="p-6 text-center text-sm text-charcoal-lighter">No movements recorded yet.</div>
              ) : (
                <div className="divide-y divide-sage-light/20">
                  {movements.map((m) => (
                    <div key={m.id} className="p-3 text-sm flex items-center justify-between hover:bg-sage-50/30">
                      <div>
                        <p className="font-medium text-charcoal capitalize flex items-center gap-1.5">
                          {m.quantity_change > 0 ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                          {m.movement_type}
                        </p>
                        <p className="text-[10px] text-charcoal-lighter mt-0.5">{formatDate(m.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                        </p>
                        <p className="text-[10px] text-charcoal-lighter">Bal: {m.quantity_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
