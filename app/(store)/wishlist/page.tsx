'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';

export default function AccountWishlistPage() {
  const { productIds, removeFromWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string; price: number; compare_price: number | null; images: Array<{ url: string; is_primary: boolean }> }>>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (!productIds.length) { setLoading(false); return; }
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_price, images:product_images(url, is_primary)')
        .in('id', productIds);
      setProducts(data ?? []);
      setLoading(false);
    };
    load();
  }, [productIds]);

  if (loading) return <div className="card p-12 flex items-center justify-center"><div className="w-6 h-6 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-medium text-charcoal">
        My Wishlist <span className="text-lg text-charcoal-lighter font-body">({products.length})</span>
      </h1>

      {products.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => {
            const img = product.images?.find(i => i.is_primary)?.url ?? product.images?.[0]?.url;
            return (
              <div key={product.id} className="card p-4 flex gap-4">
                <Link href={`/shop/${product.slug}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img ?? ''} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-sage-50 hover:opacity-90 transition-opacity" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${product.slug}`} className="block">
                    <p className="text-sm font-medium text-charcoal hover:text-sage-dark transition-colors line-clamp-2">{product.name}</p>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-charcoal">{formatCurrency(product.price)}</span>
                    {product.compare_price && <span className="text-xs text-charcoal-lighter line-through">{formatCurrency(product.compare_price)}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => { addItem(product as Parameters<typeof addItem>[0], null, 1); openCart(); }}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" /> Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="btn-icon text-red-400 hover:text-red-600"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Heart className="w-12 h-12 text-sage-light mx-auto mb-4" />
          <h3 className="font-medium text-charcoal mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-charcoal-lighter mb-6">Save products you love and come back to them anytime.</p>
          <Link href="/shop" className="btn-primary">Explore Products</Link>
        </div>
      )}
    </div>
  );
}
