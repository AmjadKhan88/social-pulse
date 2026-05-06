// src/components/friends/FriendSuggestions.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { UserProfile } from "@/types";

export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sent,        setSent]        = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/friends?type=suggestions&limit=5")
      .then((r) => r.json())
      .then((j) => { if (j.success) setSuggestions(j.data.items); })
      .finally(() => setLoading(false));
  }, []);

  async function sendRequest(userId: string) {
    try {
      const res  = await fetch(`/api/friends/request/${userId}`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setSent((prev) => new Set([...prev, userId]));
        toast.success("Friend request sent!");
      } else {
        toast.error(json.error ?? "Failed");
      }
    } catch {
      toast.error("Failed to send request");
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-36 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="h-2.5 bg-slate-200 rounded w-16" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">People You May Know</h3>
        <Link href="/friends?tab=suggestions" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
          See all
        </Link>
      </div>

      <div className="space-y-3">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            </Link>
            <Link href={`/profile/${user.id}`} className="flex-1 min-w-0 group">
              <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">@{user.username}</p>
            </Link>
            {sent.has(user.id) ? (
              <span className="text-xs text-slate-500 font-medium px-2">Sent</span>
            ) : (
              <Button
                size="xs"
                variant="outline"
                leftIcon={<UserPlus size={12} />}
                onClick={() => sendRequest(user.id)}
              >
                Add
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
