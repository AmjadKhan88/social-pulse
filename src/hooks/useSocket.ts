// src/hooks/useSocket.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import type { Comment, Notification } from "@/types";

let socketInstance: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketInstance?.disconnect();
      socketInstance = null;
      return;
    }

    // Reuse existing connection
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
      auth:       { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    // Handle real-time notifications
    socket.on("notification:new", (notification: Notification) => {
      addNotification(notification);
    });

    socketInstance = socket;
    socketRef.current = socket;

    return () => {
      // Don't disconnect — keep connection alive across re-renders
      // Only disconnect on logout (handled in auth store)
    };
  }, [isAuthenticated, accessToken]);

  const joinPost = useCallback((postId: string) => {
    socketRef.current?.emit("post:join", postId);
  }, []);

  const leavePost = useCallback((postId: string) => {
    socketRef.current?.emit("post:leave", postId);
  }, []);

  const onNewComment = useCallback(
    (handler: (data: { postId: string; comment: Comment }) => void) => {
      socketRef.current?.on("comment:new", handler);
      return () => socketRef.current?.off("comment:new", handler);
    },
    []
  );

  const emitNewComment = useCallback((postId: string, comment: Comment) => {
    socketRef.current?.emit("comment:new", { postId, comment });
  }, []);

  const onUserOnline = useCallback(
    (handler: (data: { userId: string; isOnline: boolean }) => void) => {
      socketRef.current?.on("user:online", handler);
      return () => socketRef.current?.off("user:online", handler);
    },
    []
  );

  return { joinPost, leavePost, onNewComment, emitNewComment, onUserOnline };
}

// Hook for joining a specific post room
export function usePostRoom(postId: string) {
  const { joinPost, leavePost, onNewComment, emitNewComment } = useSocket();

  useEffect(() => {
    joinPost(postId);
    return () => leavePost(postId);
  }, [postId, joinPost, leavePost]);

  return { onNewComment, emitNewComment };
}
