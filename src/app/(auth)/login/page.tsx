// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Zap } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/feed";
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginInput) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Login failed");
        return;
      }

      setAuth(json.data.user, json.data.accessToken);
      toast.success("Welcome back!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">SocialSphere</span>
          </div>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            <Input
              label="Email or Username"
              type="text"
              autoComplete="username"
              placeholder="john@example.com or johndoe"
              error={errors.emailOrUsername?.message}
              {...register("emailOrUsername")}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register("password")}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                  {...register("rememberMe")}
                />
                <span className="text-slate-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              size="lg"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-600 hover:text-brand-700 font-semibold"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
