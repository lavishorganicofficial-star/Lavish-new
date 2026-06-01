'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle, PackageSearch, PackageX, TrendingDown, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { formatCurrency } from '@/lib/utils';
import { StockDetailSlideOver } from './StockDetailSlideOver';
import { MobileCard } from '@/components/admin/MobileCard';

export function InventoryDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState<'all' | 'alerts'>('all');
  const [q, setQ] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Summary
      const sumRes = await fetch('/api/admin/inventory/summary');
      setSummary(await sumRes.json());

      // Fetch Products via existing products API (assuming we have one or just use supabase directly from client for simplicity, but let's use the admin client via a direct fetch if possible, wait, we don't have a direct GET products API for admin in this session. Let's just create a quick direct Supabase call for the dashboard or build a fast route)
      // Actually, since I am a Client Component, I need an API route. Wait, I'll create `/api/admin/inventory/products` next!
      const prodRes = await fetch(`/api/admin/inventory/products?q=${q}`);
      const prodData = await prodRes.json();
      setProducts(prodData.data || []);
    } catch (err: any) {
      toast.error('Could not load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [q]);

  // Filter for alerts tab
  const displayProducts = tab === 'alerts' 
    ? products.filter(p => p.stock_quantity <= 10) 
    : products;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Stock & Inventory</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">Manage quantities, velocity, and alerts</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 border-t-4 border-t-sage-dark">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Total Value</p>
          <p className="font-display text-xl font-medium text-charcoal">{formatCurrency(summary?.totalValue || 0)}</p>
        </div>
        <div className="card p-4 border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Total Products</p>
          <p className="font-display text-xl font-medium text-charcoal">{summary?.totalProducts || 0}</p>
        </div>
        <div className="card p-4 border-t-4 border-t-orange-500">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Low Stock (≤10)</p>
          <p className="font-display text-xl font-medium text-charcoal">{summary?.lowStockCount || 0}</p>
        </div>
        <div className="card p-4 border-t-4 border-t-red-600">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Out of Stock</p>
          <p className="font-display text-xl font-medium text-charcoal">{summary?.outOfStockCount || 0}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-sage-light/20">
        <div className="flex gap-1 w-full sm:w-auto">
          <button 
            onClick={() => setTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-sage-dark text-white' : 'text-charcoal-lighter hover:bg-sage-50'}`}
          >
            All Stock
          </button>
          <button 
            onClick={() => setTab('alerts')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'alerts' ? 'bg-red-50 text-red-600' : 'text-charcoal-lighter hover:bg-sage-50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Alerts
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9 w-full bg-warm-white border-transparent focus:bg-white" 
          />
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="card overflow-hidden">
        {/* Mobile View */}
        <div className="p-4 sm:hidden bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs text-charcoal-lighter font-medium mb-2 uppercase tracking-wider">Inventory List</p>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-sage-dark" /></div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-8 text-charcoal-lighter">No products found.</div>
          ) : (
            displayProducts.map((product) => (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                <MobileCard
                  title={
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-sage-100 overflow-hidden flex-shrink-0 border border-sage-light/20">
                        {product.images && product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-charcoal">{product.name}</span>
                    </div>
                  }
                  subtitle={product.category_name}
                  status={
                    product.stock_quantity === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        <PackageX className="w-3 h-3" /> Out of Stock
                      </span>
                    ) : product.stock_quantity <= 10 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                        <Check className="w-3 h-3" /> In Stock
                      </span>
                    )
                  }
                  details={[
                    { label: 'Price', value: formatCurrency(product.price) },
                    { 
                      label: 'Stock', 
                      value: <span className={`font-bold ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-sage-dark'}`}>{product.stock_quantity} units</span> 
                    }
                  ]}
                />
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-light/20">
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs w-16">Image</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Product</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Price</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Stock</th>
                <th className="text-center p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-sage-dark" /></td></tr>
              ) : displayProducts.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-charcoal-lighter">No products found.</td></tr>
              ) : (
                displayProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => setSelectedProduct(product)}
                    className="hover:bg-sage-50/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="w-10 h-10 rounded bg-sage-100 overflow-hidden flex-shrink-0 border border-sage-light/20">
                        {product.images && product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-charcoal">{product.name}</p>
                      <p className="text-xs text-charcoal-lighter">{product.category_name}</p>
                    </td>
                    <td className="p-4 text-right text-charcoal">{formatCurrency(product.price)}</td>
                    <td className={`p-4 text-right font-bold ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-sage-dark'}`}>
                      {product.stock_quantity}
                    </td>
                    <td className="p-4 text-center">
                      {product.stock_quantity === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          <PackageX className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : product.stock_quantity <= 10 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <StockDetailSlideOver 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
}
