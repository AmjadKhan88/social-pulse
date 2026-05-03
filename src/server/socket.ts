// src/server/socket.ts
// Socket.IO Real-time Server
// Run separately: tsx src/server/socket.ts

import { createServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prismaOptions: any = {};
if (process.env.PRISMA_ACCELERATE_URL) {
  prismaOptions.accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
} else if (process.env.DATABASE_URL) {
  prismaOptions.adapter = { url: process.env.DATABASE_URL };
}

const db = new PrismaClient(prismaOptions);
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin:      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    methods:     ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ─────────────────────────────────────────
// In-memory: userId -> Set<socketId>
// ─────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>();

function getUserSockets(userId: string): string[] {
  return [...(onlineUsers.get(userId) ?? [])];
}

function addUserSocket(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
}

function removeUserSocket(userId: string, socketId: string) {
  onlineUsers.get(userId)?.delete(socketId);
  if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId);
}

function isOnline(userId: string): boolean {
  return (onlineUsers.get(userId)?.size ?? 0) > 0;
}

// ─────────────────────────────────────────
// Auth Middleware
// ─────────────────────────────────────────
io.use((socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.authorization?.replace("Bearer ", "");

  if (!token) return next(new Error("Authentication required"));

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub: string; username: string };
    (socket as Socket & { userId: string; username: string }).userId   = payload.sub;
    (socket as Socket & { userId: string; username: string }).username = payload.username;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ─────────────────────────────────────────
// Connection Handler
// ─────────────────────────────────────────
io.on("connection", async (socket) => {
  const userId   = (socket as Socket & { userId: string }).userId;
  const username = (socket as Socket & { username: string }).username;

  console.log(`[Socket] Connected: ${username} (${socket.id})`);

  // Register socket
  addUserSocket(userId, socket.id);

  // Update DB online status
  await db.user.update({
    where: { id: userId },
    data:  { isOnline: true, lastSeen: new Date() },
  }).catch(console.error);

  // Broadcast online status to friends
  const friendIds = await getFriendIds(userId);
  for (const fid of friendIds) {
    const sockets = getUserSockets(fid);
    sockets.forEach((sid) => {
      io.to(sid).emit("user:online", { userId, isOnline: true });
    });
  }

  // Send current online friends to this user
  const onlineFriends = friendIds.filter(isOnline);
  socket.emit("friends:online", onlineFriends);

  // ── Room management ─────────────────────
  // Join personal notification room
  socket.join(`user:${userId}`);

  // ── Event handlers ──────────────────────

  // Join a post room (for live comments)
  socket.on("post:join", (postId: string) => {
    socket.join(`post:${postId}`);
  });

  socket.on("post:leave", (postId: string) => {
    socket.leave(`post:${postId}`);
  });

  // New comment (broadcast to post room)
  socket.on("comment:new", (data: { postId: string; comment: unknown }) => {
    socket.to(`post:${data.postId}`).emit("comment:new", data);
  });

  // Typing indicators
  socket.on("comment:typing", (data: { postId: string; username: string }) => {
    socket.to(`post:${data.postId}`).emit("comment:typing", data);
  });

  // Ping (keep-alive)
  socket.on("ping", () => socket.emit("pong"));

  // ── Disconnect ──────────────────────────
  socket.on("disconnect", async () => {
    console.log(`[Socket] Disconnected: ${username} (${socket.id})`);
    removeUserSocket(userId, socket.id);

    // Only mark offline if no other sockets open
    if (!isOnline(userId)) {
      const lastSeen = new Date();
      await db.user.update({
        where: { id: userId },
        data:  { isOnline: false, lastSeen },
      }).catch(console.error);

      // Broadcast offline
      for (const fid of friendIds) {
        getUserSockets(fid).forEach((sid) => {
          io.to(sid).emit("user:online", { userId, isOnline: false, lastSeen });
        });
      }
    }
  });
});

// ─────────────────────────────────────────
// Helper: get all friend IDs
// ─────────────────────────────────────────
async function getFriendIds(userId: string): Promise<string[]> {
  const fs = await db.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });
  return fs.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
}

// ─────────────────────────────────────────
// Notification Emitter (called from API routes via HTTP)
// ─────────────────────────────────────────

// Export a function to emit notifications (used in same process)
export function emitNotification(recipientId: string, notification: unknown) {
  io.to(`user:${recipientId}`).emit("notification:new", notification);
}

// ─────────────────────────────────────────
// Start
// ─────────────────────────────────────────
const PORT = parseInt(process.env.SOCKET_PORT ?? "3001");
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});

export { io };
