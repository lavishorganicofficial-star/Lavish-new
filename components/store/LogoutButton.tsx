"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      useWishlistStore.getState().clearWishlist();
      useCartStore.getState().clearCart();
      toast.success("Successfully logged out");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error("Logout failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-sage-light/20 last:border-0 disabled:opacity-50"
      id="user-logout-btn"
    >
      <div className="flex items-center gap-3">
        <LogOut className="w-4 h-4" />
        Log Out
      </div>
    </button>
  );
}
