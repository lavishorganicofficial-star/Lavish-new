'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteCouponButtonProps {
  id: string;
}

export default function DeleteCouponButton({ id }: DeleteCouponButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to delete coupon.');
      setDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={deleting}
      className={`btn-icon text-red-400 hover:text-red-600 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`} 
      aria-label="Delete coupon"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
