'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Filter, Edit, Eye, Trash2, ToggleLeft, ToggleRight, ImageIcon, Copy, Check, X } from 'lucide-react';
import { MobileCard } from '@/components/admin/MobileCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/store/uiStore';

export function ProductsDashboard({ initialProducts, count, totalPages, currentPage }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const currentStatus = searchParams.get('status') || '';
  const currentQ = searchParams.get('q') || '';
  
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const status = formData.get('status') as string;
    const params = new URLSearchParams(searchParams.toString());
    
    if (q) params.set('q', q);
    else params.delete('q');
    
    if (status) params.set('status', status);
    else params.delete('status');
    
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const handlePriceSave = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(tempPrice) })
      });
      if (!res.ok) throw new Error('Failed to update price');
      toast.success('Price updated successfully');
      setEditingPrice(null);
      router.refresh();
    } catch (err) {
      toast.error('Failed to update price');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!confirm('Are you sure you want to duplicate this product?')) return;
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      toast.success('Product duplicated successfully');
      router.refresh();
    } catch (err) {
      toast.error('Failed to duplicate product');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted successfully');
      router.refresh();
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Products</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{count ?? 0} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
            <input name="q" defaultValue={currentQ} placeholder="Search products..." className="input pl-9 w-full" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select name="status" defaultValue={currentStatus} className="input flex-1 sm:w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <button type="submit" className="btn-secondary flex items-center gap-2 px-4 shrink-0">
              <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Table & Mobile Cards */}
      <div className="card overflow-hidden">
        {/* Mobile View */}
        <div className="p-4 sm:hidden bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs text-charcoal-lighter font-medium mb-2 uppercase tracking-wider">Products List</p>
          {initialProducts?.map((product: any) => {
            const primaryImg = (product.images as Array<{ url: string; is_primary: boolean }>)?.find((i) => i.is_primary)?.url
              ?? (product.images as Array<{ url: string }>)?.[0]?.url;
            return (
              <MobileCard
                key={product.id}
                title={
                  <div className="flex items-center gap-3">
                    {primaryImg ? (
                      <img src={primaryImg} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-sage-50 border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sage-50 border border-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-sage-light" />
                      </div>
                    )}
                    <span className="font-medium text-charcoal">{product.name}</span>
                  </div>
                }
                subtitle={(product.category as unknown as { name: string } | null)?.name ?? 'Uncategorized'}
                status={
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${product.is_active ? 'bg-sage-50 text-sage-dark' : 'bg-red-50 text-red-600'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                }
                action={
                  <div className="flex gap-1">
                    <button onClick={() => handleDuplicate(product.id)} disabled={isProcessing === product.id} className="btn-icon" aria-label="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <Link href={`/admin/products/${product.id}`} className="btn-icon" aria-label="Edit"><Edit className="w-3.5 h-3.5" /></Link>
                  </div>
                }
                details={[
                  { label: 'Price', value: <span className="font-semibold">₹{product.price}</span> },
                  { 
                    label: 'Stock', 
                    value: <span className={`font-medium ${product.stock_quantity === 0 ? 'text-red-500' : product.stock_quantity <= 10 ? 'text-amber-500' : 'text-sage-dark'}`}>{product.stock_quantity} units</span> 
                  }
                ]}
              />
            );
          })}
          {!initialProducts?.length && (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-sage-light mx-auto mb-2" />
              <p className="text-xs text-charcoal-lighter">No products found.</p>
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage-light/20 bg-sage-50/50">
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider w-16">Image</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Product Name</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Price</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Stock</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {initialProducts?.map((product: any) => {
                const primaryImg = (product.images as Array<{ url: string; is_primary: boolean }>)?.find((i) => i.is_primary)?.url
                  ?? (product.images as Array<{ url: string }>)?.[0]?.url;
                const isEditingPrice = editingPrice === product.id;

                return (
                  <tr key={product.id} className="hover:bg-sage-50/30 transition-colors">
                    <td className="p-4">
                      {primaryImg ? (
                        <img src={primaryImg} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-sage-50 border border-sage-light/20 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-sage-50 border border-sage-light/20 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-sage-light" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-charcoal">{product.name}</p>
                      <p className="text-xs text-charcoal-lighter">{(product.category as any)?.name ?? '—'}</p>
                    </td>
                    <td className="p-4 w-40">
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-charcoal-lighter">₹</span>
                          <input 
                            type="number" 
                            autoFocus
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceSave(product.id)}
                            className="input text-sm py-1 px-2 w-20"
                          />
                          <button onClick={() => handlePriceSave(product.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingPrice(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingPrice(product.id); setTempPrice(product.price.toString()); }}>
                          <p className="text-sm font-medium text-charcoal">₹{product.price}</p>
                          <Edit className="w-3 h-3 text-sage-light opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${product.stock_quantity === 0 ? 'text-red-500' : product.stock_quantity <= 10 ? 'text-amber-500' : 'text-sage-dark'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${product.is_active ? 'bg-sage-50 text-sage-dark' : 'bg-red-50 text-red-600'}`}>
                        {product.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/shop/${product.slug}`} target="_blank" className="btn-icon" aria-label="View on store"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => handleDuplicate(product.id)} disabled={isProcessing === product.id} className="btn-icon" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                        <Link href={`/admin/products/${product.id}`} className="btn-icon" aria-label="Edit"><Edit className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(product.id)} disabled={isProcessing === product.id} className="btn-icon text-red-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!initialProducts?.length && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Package className="w-10 h-10 text-sage-light mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-sage-light/20 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-charcoal-lighter">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              {currentPage > 1 && <Link href={`?page=${currentPage - 1}${currentStatus ? `&status=${currentStatus}` : ''}${currentQ ? `&q=${currentQ}` : ''}`} className="btn-secondary text-sm py-1.5 px-3">Previous</Link>}
              {currentPage < totalPages && <Link href={`?page=${currentPage + 1}${currentStatus ? `&status=${currentStatus}` : ''}${currentQ ? `&q=${currentQ}` : ''}`} className="btn-primary text-sm py-1.5 px-3">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
