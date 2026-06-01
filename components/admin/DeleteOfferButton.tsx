'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteOfferButtonProps {
  id: string;
}

export default function DeleteOfferButton({ id }: DeleteOfferButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to delete offer.');
      setDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={deleting}
      className={`btn-icon text-red-400 hover:text-red-600 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`} 
      aria-label="Delete offer"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
