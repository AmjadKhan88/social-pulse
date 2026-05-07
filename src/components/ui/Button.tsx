// src/components/ui/Button.tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow-md",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
  outline:
    "bg-transparent text-brand-600 border border-brand-600 hover:bg-brand-50 active:bg-brand-100",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "h-7 px-2.5 text-xs gap-1 rounded-lg",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150 ease-out",
          "select-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Variants & sizes
          variantStyles[variant],
          sizeStyles[size],
          // Width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {children && <span className="truncate">{children}</span>}

        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
