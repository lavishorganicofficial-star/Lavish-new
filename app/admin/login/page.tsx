"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/store/uiStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Authentication failed", error.message);
      setLoading(false);
      return;
    }

    // Verify admin role via profiles
    if (data.user) {
      // First check JWT claims
      const jwtRole = (data.user.app_metadata as { user_role?: string })?.user_role;
      if (jwtRole === "admin") {
        toast.success("Welcome back, Admin!");
        router.push("/admin");
        router.refresh();
        return;
      }

      // Fallback to profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "admin") {
        toast.success("Welcome back, Admin!");
        router.push("/admin");
        router.refresh();
      } else {
        // Not an admin, sign out immediately
        await supabase.auth.signOut();
        toast.error("Access Denied", "You do not have administrative privileges.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-warm-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sage to-sage-dark" />

        <div className="flex flex-col items-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
              alt="LavishOrganic Admin"
              width={160}
              height={48}
              className="object-contain h-10 w-auto"
              priority
            />
          </div>
          <h1 className="font-display text-3xl font-medium text-charcoal text-center">
            Admin Portal
          </h1>
          <p className="text-charcoal-lighter text-sm mt-1 text-center">
            Secure login for LavishOrganic staff
          </p>
        </div>



        <form onSubmit={handleAdminLogin} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full bg-white"
              placeholder="admin@lavishorganic.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full bg-white pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-lighter hover:text-charcoal"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full justify-center py-4 mt-2 bg-charcoal hover:bg-charcoal/90 text-white"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Secure Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-charcoal/10 text-center">
          <p className="text-xs text-charcoal-lighter font-body">
            &copy; {new Date().getFullYear()} LavishOrganic. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
