'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, CheckCircle2, Truck, X, Loader2 } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { POSlideOver } from './POSlideOver';

export function PurchaseOrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const toast = useToast();

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/purchase-orders?status=${status}`);
      const data = await res.json();
      setOrders(data.data || []);
    } catch (err) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Purchase Orders</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">Restock inventory from suppliers</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'sent', 'partial', 'received'].map(s => (
          <button 
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-colors ${status === s ? 'bg-sage-dark text-white' : 'bg-sage-50 text-charcoal hover:bg-sage-100'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-light/20">
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">PO Number</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Date</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Supplier</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Items/Qty</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Total</th>
                <th className="text-center p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter"><Loader2 className="w-5 h-5 animate-spin mx-auto text-sage-dark" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter">No purchase orders found.</td></tr>
              ) : (
                orders.map((po) => (
                  <tr 
                    key={po.id} 
                    onClick={() => setSelectedPO(po)}
                    className="hover:bg-sage-50/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono font-medium text-charcoal">{po.po_number}</td>
                    <td className="p-4 text-charcoal-lighter">{formatDate(po.created_at)}</td>
                    <td className="p-4">
                      <p className="font-medium text-charcoal">{po.supplier_name}</p>
                      <p className="text-xs text-charcoal-lighter">{po.supplier_email || po.supplier_phone}</p>
                    </td>
                    <td className="p-4 text-right text-charcoal-lighter">
                      {po.total_items} items / {po.total_quantity} qty
                    </td>
                    <td className="p-4 text-right font-bold text-sage-dark">{formatCurrency(po.total_cost)}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        po.status === 'received' ? 'bg-green-100 text-green-800' :
                        po.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} onRefresh={fetchPOs} />}
      {selectedPO && <POSlideOver poId={selectedPO.id} onClose={() => setSelectedPO(null)} onRefresh={fetchPOs} />}
    </div>
  );
}

function CreatePOModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [items, setItems] = useState<{product_id: string, product_name: string, quantity: number, cost: number}[]>([]);
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/inventory/products?q=${search}`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addItem = (product: any) => {
    if (items.find(i => i.product_id === product.id)) return toast.error('Product already added');
    setItems([...items, { product_id: product.id, product_name: product.name, quantity: 1, cost: product.price * 0.5 }]);
    setSearch('');
    setSearchResults([]);
  };

  const updateItem = (id: string, field: string, val: number) => {
    setItems(items.map(i => i.product_id === id ? { ...i, [field]: val } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.product_id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Add at least one item');
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_name: supplierName, supplier_email: supplierEmail, items })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Purchase Order created!');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-sage-light/20 flex justify-between items-center bg-warm-white flex-shrink-0">
          <h3 className="font-display font-medium text-xl text-charcoal">Create Purchase Order</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-charcoal-lighter" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Supplier Name *</label>
              <input type="text" required value={supplierName} onChange={e => setSupplierName(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Supplier Email</label>
              <input type="email" value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} className="input w-full" />
            </div>
          </div>

          <div className="border-t border-sage-light/20 pt-6">
            <h4 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">Add Items</h4>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
              <input 
                type="text" 
                placeholder="Search products to add..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 w-full" 
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white shadow-lg border border-sage-light/20 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <button key={p.id} type="button" onClick={() => addItem(p)} className="w-full text-left p-3 hover:bg-sage-50 border-b border-sage-light/10 text-sm">
                      <span className="font-medium text-charcoal">{p.name}</span>
                      <span className="text-charcoal-lighter text-xs ml-2">({p.stock_quantity} in stock)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sage-50/50">
                    <th className="p-2 text-left text-xs font-semibold uppercase text-charcoal-lighter">Product</th>
                    <th className="p-2 text-left text-xs font-semibold uppercase text-charcoal-lighter w-24">Qty</th>
                    <th className="p-2 text-left text-xs font-semibold uppercase text-charcoal-lighter w-32">Unit Cost</th>
                    <th className="p-2 text-right text-xs font-semibold uppercase text-charcoal-lighter w-24">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.product_id} className="border-b border-sage-light/10">
                      <td className="p-2 text-charcoal">{item.product_name}</td>
                      <td className="p-2">
                        <input type="number" min="1" required value={item.quantity || ''} onChange={e => updateItem(item.product_id, 'quantity', parseInt(e.target.value) || 0)} className="input w-full p-1" />
                      </td>
                      <td className="p-2">
                        <input type="number" min="0" step="0.01" required value={item.cost || ''} onChange={e => updateItem(item.product_id, 'cost', parseFloat(e.target.value) || 0)} className="input w-full p-1" />
                      </td>
                      <td className="p-2 text-right font-medium text-charcoal">{formatCurrency(item.quantity * item.cost)}</td>
                      <td className="p-2 text-right">
                        <button type="button" onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {items.length === 0 && <p className="text-sm text-charcoal-lighter text-center p-4 border border-dashed border-sage-light/40 rounded-lg">No items added to PO yet.</p>}
          </div>
        </form>

        <div className="p-5 border-t border-sage-light/20 bg-warm-white flex-shrink-0 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-charcoal-lighter">Total Cost:</span>
            <span className="ml-2 font-bold text-lg text-sage-dark">{formatCurrency(items.reduce((s, i) => s + (i.quantity * i.cost), 0))}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || items.length===0} className="btn-primary flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
