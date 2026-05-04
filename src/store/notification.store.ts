// src/store/notification.store.ts
"use client";

import { create } from "zustand";
import type { Notification } from "../types";

interface NotificationState {
  notifications: Notification[];
  unreadCount:   number;
  hasMore:       boolean;
  nextCursor:    string | null;
  isLoading:     boolean;

  // Actions
  setNotifications: (items: Notification[], cursor: string | null, hasMore: boolean, unread: number) => void;
  addNotification:  (n: Notification) => void;
  markAllRead:      () => void;
  markOneRead:      (id: string) => void;
  setLoading:       (v: boolean) => void;
  reset:            () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount:   0,
  hasMore:       false,
  nextCursor:    null,
  isLoading:     false,

  setNotifications: (items, nextCursor, hasMore, unreadCount) =>
    set({ notifications: items, nextCursor, hasMore, unreadCount }),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount:   s.unreadCount + 1,
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  markOneRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({ notifications: [], unreadCount: 0, hasMore: false, nextCursor: null }),
}));
