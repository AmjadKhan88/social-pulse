// src/app/(main)/notifications/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/notification.store";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const TYPE_ICONS: Record<NotificationType, { icon: React.ReactNode; bg: string }> = {
  LIKE:           { icon: <Heart size={14} />,          bg: "bg-red-100 text-red-500" },
  COMMENT:        { icon: <MessageCircle size={14} />,  bg: "bg-brand-100 text-brand-500" },
  COMMENT_LIKE:   { icon: <Heart size={14} />,          bg: "bg-pink-100 text-pink-500" },
  FRIEND_REQUEST: { icon: <UserPlus size={14} />,       bg: "bg-emerald-100 text-emerald-500" },
  FRIEND_ACCEPT:  { icon: <Check size={14} />,          bg: "bg-emerald-100 text-emerald-500" },
  REACTION:       { icon: <Heart size={14} />,          bg: "bg-orange-100 text-orange-500" },
  MENTION:        { icon: <span className="text-xs font-bold">@</span>, bg: "bg-brand-100 text-brand-600" },
  SYSTEM:         { icon: <Bell size={14} />,           bg: "bg-slate-100 text-slate-500" },
};

function getLink(n: Notification): string {
  if (n.entityType === "post" && n.entityId)     return `/feed?post=${n.entityId}`;
  if (n.entityType === "user" && n.entityId)     return `/profile/${n.entityId}`;
  if (n.entityType === "friend_request")         return `/friends?tab=requests`;
  return "#";
}

export default function NotificationsPage() {
  const {
    notifications, unreadCount, isLoading,
    setNotifications, markAllRead, setLoading,
  } = useNotificationStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch("/api/notifications?limit=50");
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data.items, json.data.nextCursor, json.data.hasMore, json.data.unreadCount);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleMarkAllRead() {
    markAllRead();
    await fetch("/api/notifications", { method: "PATCH" });
  }

  // Group by date
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const date = new Date(n.createdAt);
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    let key: string;
    if (diff < 86400000)       key = "Today";
    else if (diff < 172800000) key = "Yesterday";
    else                       key = "Earlier";
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <NotifSkeleton />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Bell size={48} className="mb-4 opacity-30" />
          <p className="font-semibold text-slate-600">No notifications yet</p>
          <p className="text-sm mt-1">We'll notify you when something happens</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupLabel, items]) => (
            <section key={groupLabel}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                {groupLabel}
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden divide-y divide-slate-100">
                {items.map((n) => {
                  const { icon, bg } = TYPE_ICONS[n.type];
                  return (
                    <Link
                      key={n.id}
                      href={getLink(n)}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? "bg-brand-50/30" : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          src={n.trigger?.avatarUrl}
                          alt={n.trigger?.displayName ?? "System"}
                          size="md"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${bg}`}>
                          {icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-snug">
                          <span className="font-semibold">
                            {n.trigger?.displayName ?? "SocialSphere"}
                          </span>{" "}
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>

                      {!n.isRead && (
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
