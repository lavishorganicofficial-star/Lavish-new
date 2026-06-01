'use client';

import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, CheckCircle, Copy, AlertCircle, ExternalLink, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InfluencerLinksPage() {
  const toast = useToast();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('referral_code, referral_link').eq('id', user.id).single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, [supabase]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchProducts();
      } else if (searchQuery.trim().length === 0) {
        setProducts([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getTrackableUrl = (slug: string) => {
    if (!profile?.referral_code) return '';
    return `${window.location.origin}/shop/${slug}?ref=${profile.referral_code}`;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">My Links & Tools</h1>
        <p className="text-charcoal-lighter">Generate trackable affiliate links for any product.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Link Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-charcoal mb-4">Search Products</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter w-5 h-5" />
              <input
                type="text"
                placeholder="Search for a product (e.g., Face Wash, Serum)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input bg-warm-white pl-10 py-3"
              />
            </div>

            {searching && (
              <div className="py-8 text-center text-charcoal-lighter">
                <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Searching...
              </div>
            )}

            {!searching && products.length > 0 && (
              <div className="space-y-4">
                {products.map((product) => {
                  const url = getTrackableUrl(product.slug);
                  const isCopied = copiedLink === product.id;
                  
                  return (
                    <div key={product.id} className="p-4 border border-sage-light/30 rounded-xl bg-cream/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        {product.images && product.images[0] ? (
                          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-sage-light/20 relative">
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0 border border-sage-light/20">
                            <Leaf className="w-5 h-5 text-sage-light" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-charcoal text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-charcoal-lighter font-medium">₹{product.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          readOnly 
                          value={url} 
                          className="flex-1 sm:w-48 bg-white border border-sage-light/50 rounded-lg px-3 py-2 text-xs text-charcoal font-medium truncate outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(url, product.id)}
                          className={cn(
                            "btn-icon border flex-shrink-0",
                            isCopied ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-sage-light/50 hover:bg-sage-50"
                          )}
                          title="Copy Link"
                        >
                          {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && products.length === 0 && (
              <div className="py-8 text-center text-charcoal-lighter">
                <AlertCircle className="w-8 h-8 text-sage-light mx-auto mb-2" />
                <p>No products found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Global Link */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-sage-50/50">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-4 border border-sage-light/30 shadow-sm">
              <LinkIcon className="w-5 h-5 text-sage-dark" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">Default Store Link</h3>
            <p className="text-sm text-charcoal-lighter mb-4">
              Use this link in your Instagram bio. It directs users to the homepage with your tracking code attached.
            </p>
            <div className="p-3 bg-white border border-sage-light/40 rounded-lg mb-4">
              <p className="text-sm font-medium text-charcoal truncate">{profile?.referral_link || 'Loading...'}</p>
            </div>
            <button 
              onClick={() => profile?.referral_link && copyToClipboard(profile.referral_link, 'default')}
              className="btn-primary w-full py-2.5 justify-center text-sm"
            >
              {copiedLink === 'default' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="card p-6 border-sage">
            <h3 className="font-semibold text-charcoal mb-2">How Tracking Works</h3>
            <ul className="text-sm text-charcoal-lighter space-y-3">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                <span>When someone clicks your link, a 30-day tracking cookie is set on their browser.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                <span>If they use your coupon code at checkout, the sale is tracked immediately (even without a link click).</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                <span>You earn 15% commission on the final order value (after discounts).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
