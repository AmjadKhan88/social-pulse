// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Zap, Check, X } from "lucide-react";
import { registerSchema, type RegisterInput } from "../../../lib/validations";
import { useAuthStore } from "../../../store/auth.store";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error ?? "Registration failed";
        toast.error(msg);
        return;
      }

      setAuth(json.data.user, json.data.accessToken);
      toast.success("Account created! Welcome to SocialSphere 🎉");
      router.push("/feed");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">SocialSphere</span>
          </div>
          <p className="text-slate-500 text-sm">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Display Name"
                placeholder="John Doe"
                error={errors.displayName?.message}
                autoComplete="name"
                required
                {...register("displayName")}
              />
              <Input
                label="Username"
                placeholder="johndoe"
                error={errors.username?.message}
                autoComplete="username"
                required
                {...register("username")}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              autoComplete="email"
              required
              {...register("email")}
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="new-password"
                required
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password", {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />

              {/* Password strength indicator */}
              {passwordValue.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {passwordRules.map((rule) => {
                    const passes = rule.test(passwordValue);
                    return (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          passes ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {passes ? (
                          <Check size={12} className="shrink-0" />
                        ) : (
                          <X size={12} className="shrink-0" />
                        )}
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              required
              {...register("confirmPassword")}
            />

            <p className="text-xs text-slate-500">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-brand-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-brand-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Create account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
