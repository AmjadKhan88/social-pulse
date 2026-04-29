// src/components/ui/Avatar.tsx
"use client";

import Image from "next/image";
import { cn, getInitials, getAvatarUrl } from "../../lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs:  { container: "w-6 h-6",  image: 24,  text: "text-[9px]" },
  sm:  { container: "w-8 h-8",  image: 32,  text: "text-xs" },
  md:  { container: "w-10 h-10", image: 40, text: "text-sm" },
  lg:  { container: "w-12 h-12", image: 48, text: "text-base" },
  xl:  { container: "w-16 h-16", image: 64, text: "text-xl" },
  "2xl": { container: "w-24 h-24", image: 96, text: "text-2xl" },
};

const statusDotSize = {
  xs:  "w-1.5 h-1.5 border",
  sm:  "w-2 h-2 border",
  md:  "w-2.5 h-2.5 border-2",
  lg:  "w-3 h-3 border-2",
  xl:  "w-3.5 h-3.5 border-2",
  "2xl": "w-4 h-4 border-2",
};

export function Avatar({
  src,
  alt,
  size = "md",
  isOnline,
  showStatus = false,
  className,
  ring = false,
}: AvatarProps) {
  const { container, image, text } = sizeMap[size];
  const initials = getInitials(alt);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          container,
          "rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600",
          "flex items-center justify-center",
          ring && "ring-2 ring-white ring-offset-1 ring-offset-transparent"
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={image}
            height={image}
            className="object-cover w-full h-full"
            unoptimized={src.includes("ui-avatars.com")}
          />
        ) : (
          <span className={cn("font-semibold text-white select-none", text)}>
            {initials}
          </span>
        )}
      </div>

      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white",
            statusDotSize[size],
            isOnline ? "bg-emerald-500" : "bg-slate-400"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

// Avatar group (stacked)
export interface AvatarGroupProps {
  users: Array<{ src?: string | null; alt: string }>;
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}

export function AvatarGroup({ users, max = 4, size = "sm", className }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((user, i) => (
        <Avatar
          key={i}
          src={user.src}
          alt={user.alt}
          size={size}
          ring
          className="border-2 border-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizeMap[size].container,
            "rounded-full bg-slate-200 border-2 border-white",
            "flex items-center justify-center",
            sizeMap[size].text,
            "font-medium text-slate-600"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
