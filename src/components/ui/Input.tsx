// src/components/ui/Input.tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden>*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-slate-400 flex items-center pointer-events-none">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              "w-full h-10 px-3.5 rounded-xl text-sm",
              "bg-white border border-slate-200",
              "text-slate-900 placeholder:text-slate-400",
              // Focus
              "outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
              // Transition
              "transition-all duration-150",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
              // Error
              error && "border-red-400 focus:ring-red-500/40 focus:border-red-500",
              // With addons
              leftAddon && "pl-9",
              rightAddon && "pr-9",
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 text-slate-400 flex items-center">
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea variant
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, containerClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl text-sm resize-none",
            "bg-white border border-slate-200",
            "text-slate-900 placeholder:text-slate-400",
            "outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
            "transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
            error && "border-red-400 focus:ring-red-500/40 focus:border-red-500",
            className
          )}
          {...props}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
