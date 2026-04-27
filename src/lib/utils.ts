// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

// ─────────────────────────────────────────
// CLASSNAME UTILITY
// ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────
// DATE FORMATTING
// ─────────────────────────────────────────
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, "h:mm a")}`;
  }
  return format(d, "MMM d, yyyy");
}

export function formatFullDate(date: string | Date): string {
  return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
}

// ─────────────────────────────────────────
// STRING UTILITIES
// ─────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateUsername(displayName: string): string {
  const base = slugify(displayName).replace(/-/g, "_");
  const suffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `${base}_${suffix}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────
// NUMBER FORMATTING
// ─────────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─────────────────────────────────────────
// URL UTILITIES
// ─────────────────────────────────────────
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  displayName: string
): string {
  if (avatarUrl) return avatarUrl;
  // Fallback to a deterministic avatar via UI Avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=128`;
}

// ─────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────
export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

// ─────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/\d/.test(password)) errors.push("At least one number");
  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────
// FILE UTILITIES
// ─────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}
