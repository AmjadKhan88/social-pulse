// src/components/notifications/NotificationBell.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/notification.store";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, React.ReactNode> = {
  LIKE:           <Heart      size={14} className="text-red-500" />,
  COMMENT:        <MessageCircle size={14} className="text-brand-500" />,
  COMMENT_LIKE:   <Heart      size={14} className="text-pink-500" />,
  FRIEND_REQUEST: <UserPlus   size={14} className="text-emerald-500" />,
  FRIEND_ACCEPT:  <Check      size={14} className="text-emerald-500" />,
  REACTION:       <Heart      size={14} className="text-orange-500" />,
  MENTION:        <span className="text-brand-500 text-xs font-bold">@</span>,
  SYSTEM:         <Bell       size={14} className="text-slate-500" />,
};

function getNotifLink(n: Notification): string {
  if (n.entityType === "post" && n.entityId) return `/feed?post=${n.entityId}`;
  if (n.entityType === "user" && n.entityId) return `/profile/${n.entityId}`;
  if (n.entityType === "friend_request") return "/friends?tab=requests";
  return "/notifications";
}

export function NotificationBell() {
  const { notifications, unreadCount, setNotifications, markAllRead, setLoading } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications?limit=15");
      const json = await res.json();
      if (json.success) {
        setNotifications(
          json.data.items,
          json.data.nextCursor,
          json.data.hasMore,
          json.data.unreadCount
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    markAllRead();
    await fetch("/api/notifications", { method: "PATCH" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) handleMarkAllRead(); }}
        className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <NotifItem key={n.id} notification={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-1"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ notification: n, onClose }: { notification: Notification; onClose: () => void }) {
  return (
    <Link
      href={getNotifLink(n)}
      onClick={onClose}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-brand-50/40" : ""}`}
    >
      <div className="relative shrink-0">
        <Avatar
          src={n.trigger?.avatarUrl}
          alt={n.trigger?.displayName ?? "System"}
          size="sm"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-100">
          {ICONS[n.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-semibold">{n.trigger?.displayName ?? "System"}</span>{" "}
          {n.message}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
      )}
    </Link>
  );
}
