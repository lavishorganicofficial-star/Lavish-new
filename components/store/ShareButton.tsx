'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { trackShare } from '@/lib/analytics';
import { cn } from '@/lib/utils';

// Simple SVG for WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

// Simple SVG for Instagram
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

interface ShareButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productUrl?: string; // Can be passed if not window.location.href
  className?: string;
}

export function ShareButton({ productId, productName, productPrice, productUrl, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const getUrl = () => {
    if (typeof window !== 'undefined') {
      return productUrl || window.location.href;
    }
    return productUrl || '';
  };

  const handleShare = async (platform: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const url = getUrl();
    const text = `Check out this product on LavishOrganic 🌿\n${productName} — Only ₹${productPrice}\n${url}`;

    trackShare(productId, platform);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing via link on web,
        // So we copy the link and prompt them to open Instagram
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!', 'Ready to paste in Instagram');
        window.open('https://instagram.com', '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success('Copied!', 'Product link copied to clipboard');
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: productName,
              text: `Check out ${productName} on LavishOrganic!`,
              url: url,
            });
          } catch (err) {
            // Ignore abort errors
          }
        } else {
          await navigator.clipboard.writeText(url);
          toast.success('Copied!', 'Product link copied to clipboard');
        }
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // If mobile and has native share, use that first
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && /mobile|android|iphone/i.test(navigator.userAgent)) {
            handleShare('native');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn("h-12 rounded border border-sage-light/50 text-charcoal hover:border-sage-dark hover:text-sage-dark flex items-center justify-center transition-all bg-white", className || "w-12")}
        aria-label="Share product"
      >
        <Share2 className="w-4 h-4 mr-2" />
        {className && <span className="text-sm font-medium">Share</span>}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl border border-sage-light/20 py-2 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={(e) => handleShare('whatsapp', e)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-sage-50 text-sm text-charcoal transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-green-500" />
              WhatsApp
            </button>
            <button
              onClick={(e) => handleShare('instagram', e)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-sage-50 text-sm text-charcoal transition-colors"
            >
              <InstagramIcon className="w-4 h-4 text-pink-600" />
              Instagram
            </button>
            <button
              onClick={(e) => handleShare('copy', e)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-sage-50 text-sm text-charcoal transition-colors"
            >
              <LinkIcon className="w-4 h-4 text-blue-500" />
              Copy Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
