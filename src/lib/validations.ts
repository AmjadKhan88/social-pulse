// src/lib/validations.ts
import { z } from "zod";

// ─────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─────────────────────────────────────────
// PROFILE SCHEMAS
// ─────────────────────────────────────────
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Too long")
    .optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]),
  postDefaultAudience: z.enum(["PUBLIC", "FRIENDS", "ONLY_ME"]),
  whoCanSendFriendRequest: z.enum(["EVERYONE", "FRIENDS_OF_FRIENDS", "NOBODY"]),
  whoCanSeeEmail: z.enum(["PUBLIC", "FRIENDS", "ONLY_ME"]),
  showOnlineStatus: z.boolean(),
});

// ─────────────────────────────────────────
// POST SCHEMAS
// ─────────────────────────────────────────
export const createPostSchema = z.object({
  content: z.string().max(5000, "Post is too long").optional(),
  audience: z.enum(["PUBLIC", "FRIENDS", "ONLY_ME"]).default("PUBLIC"),
  mediaIds: z.array(z.string().cuid()).max(10, "Max 10 media items").optional(),
}).refine((d) => d.content || (d.mediaIds && d.mediaIds.length > 0), {
  message: "Post must have content or media",
  path: ["content"],
});

export const updatePostSchema = z.object({
  content: z.string().max(5000, "Post is too long").optional(),
  audience: z.enum(["PUBLIC", "FRIENDS", "ONLY_ME"]).optional(),
});

// ─────────────────────────────────────────
// COMMENT SCHEMAS
// ─────────────────────────────────────────
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
  parentId: z.string().cuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
});

// ─────────────────────────────────────────
// REACTION SCHEMA
// ─────────────────────────────────────────
export const reactionSchema = z.object({
  reactionType: z.enum(["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"]),
});

// ─────────────────────────────────────────
// SEARCH SCHEMA
// ─────────────────────────────────────────
export const searchSchema = z.object({
  q: z.string().min(1, "Search query required").max(100),
  type: z.enum(["users", "posts", "all"]).default("all"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─────────────────────────────────────────
// PAGINATION SCHEMA
// ─────────────────────────────────────────
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Type exports
export type RegisterInput     = z.infer<typeof registerSchema>;
export type LoginInput        = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type CreatePostInput   = z.infer<typeof createPostSchema>;
export type UpdatePostInput   = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ReactionInput     = z.infer<typeof reactionSchema>;
export type SearchInput       = z.infer<typeof searchSchema>;
export type PaginationInput   = z.infer<typeof paginationSchema>;
