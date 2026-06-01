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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/admin`,
      },
    });
    if (error) {
      toast.error("Google sign-in failed", error.message);
      setGoogleLoading(false);
    }
  };

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

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-sage-light/50 rounded bg-warm-white hover:bg-sage-50 transition-colors font-body text-sm font-medium text-charcoal mb-6 disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-sage-light/30" />
          <span className="text-xs text-charcoal-lighter font-body">or sign in with email</span>
          <div className="flex-1 h-px bg-sage-light/30" />
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
