// src/types/index.ts
// Central type definitions for SocialSphere

// ─────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  privacySettings?: PrivacySettings;
  _count?: {
    posts: number;
    friendshipsA: number;
    friendshipsB: number;
  };
  friendshipStatus?: FriendshipStatus;
}

export type FriendshipStatus =
  | "SELF"
  | "FRIENDS"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "NOT_FRIENDS";

// ─────────────────────────────────────────
// POST TYPES
// ─────────────────────────────────────────
export interface Post {
  id: string;
  content: string | null;
  audience: PostAudience;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: UserProfile;
  media: PostMedia[];
  _count: {
    comments: number;
    likes: number;
    reactions: number;
  };
  userLiked?: boolean;
  userReaction?: ReactionType | null;
}

export interface PostMedia {
  id: string;
  mediaId: string;
  order: number;
  media: Media;
}

export interface Media {
  id: string;
  url: string;
  publicId: string;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
}

export type PostAudience = "PUBLIC" | "FRIENDS" | "ONLY_ME";
export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

// ─────────────────────────────────────────
// COMMENT TYPES
// ─────────────────────────────────────────
export interface Comment {
  id: string;
  postId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: UserProfile;
  parentId: string | null;
  replies?: Comment[];
  _count: {
    likes: number;
    replies: number;
  };
  userLiked?: boolean;
}

// ─────────────────────────────────────────
// FRIEND TYPES
// ─────────────────────────────────────────
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  sender: UserProfile;
  receiver: UserProfile;
}

export interface Friendship {
  id: string;
  createdAt: string;
  friend: UserProfile;
}

// ─────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  entityId: string | null;
  entityType: string | null;
  isRead: boolean;
  createdAt: string;
  trigger: UserProfile | null;
}

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "COMMENT_LIKE"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPT"
  | "REACTION"
  | "MENTION"
  | "SYSTEM";

// ─────────────────────────────────────────
// PRIVACY TYPES
// ─────────────────────────────────────────
export interface PrivacySettings {
  profileVisibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  postDefaultAudience: PostAudience;
  whoCanSendFriendRequest: "EVERYONE" | "FRIENDS_OF_FRIENDS" | "NOBODY";
  whoCanSeeEmail: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  showOnlineStatus: boolean;
}

// ─────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// ─────────────────────────────────────────
// SOCKET TYPES
// ─────────────────────────────────────────
export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface SocketNotification {
  notification: Notification;
  recipientId: string;
}

export interface SocketNewComment {
  comment: Comment;
  postId: string;
}

export interface SocketOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}
