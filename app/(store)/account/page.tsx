'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AccountRootPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // On desktop, auto-redirect to the edit profile page so the main area isn't empty
    if (window.innerWidth >= 1024) {
      router.replace('/account/edit');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="hidden lg:flex flex-col items-center justify-center p-12 text-center h-full">
      <Loader2 className="w-8 h-8 text-sage-dark animate-spin mb-4" />
      <p className="text-charcoal-lighter">Loading your profile...</p>
    </div>
  );
}
