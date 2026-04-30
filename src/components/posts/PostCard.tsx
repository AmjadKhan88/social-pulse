// src/components/posts/PostCard.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Edit2, Trash2, Globe, Users, Lock, Bookmark,
  ThumbsUp, Laugh, Frown, Angry, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
// import { CommentSection } from "../../components/posts/CommentSection";
import { useAuthStore } from "../../store/auth.store";
import { formatRelativeTime } from "../../lib/utils";
import type { Post, ReactionType } from "../../types";

interface Props {
  post: Post;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "LIKE",  emoji: "👍", label: "Like",   color: "text-brand-600" },
  { type: "LOVE",  emoji: "❤️",  label: "Love",   color: "text-red-500" },
  { type: "HAHA",  emoji: "😂", label: "Haha",   color: "text-yellow-500" },
  { type: "WOW",   emoji: "😮", label: "Wow",    color: "text-orange-500" },
  { type: "SAD",   emoji: "😢", label: "Sad",    color: "text-blue-500" },
  { type: "ANGRY", emoji: "😡", label: "Angry",  color: "text-red-700" },
];

const AUDIENCE_ICONS = {
  PUBLIC:   <Globe size={12} />,
  FRIENDS:  <Users size={12} />,
  ONLY_ME:  <Lock  size={12} />,
};

export function PostCard({ post, onUpdate, onDelete }: Props) {
  const { user } = useAuthStore();
  const [showComments,  setShowComments]  = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [isEditing,     setIsEditing]     = useState(false);
  const [editContent,   setEditContent]   = useState(post.content ?? "");
  const [liked,         setLiked]         = useState(post.userLiked);
  const [likeCount,     setLikeCount]     = useState(post._count.likes);
  const [userReaction,  setUserReaction]  = useState<ReactionType | null>(post.userReaction ?? null);
  const [currentPost,   setCurrentPost]   = useState(post);
  const reactionRef = useRef<ReturnType<typeof setTimeout>>();
  const menuRef     = useRef<HTMLDivElement>(null);

  const isMine = user?.id === post.author.id;

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLike() {
    if (!user) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    if (!wasLiked) setUserReaction("LIKE");
    else setUserReaction(null);

    try {
      const res = await fetch(`/api/posts/${post.id}/likes`, {
        method: wasLiked ? "DELETE" : "POST",
      });
      if (!res.ok) {
        // Revert
        setLiked(wasLiked);
        setLikeCount((c) => wasLiked ? c + 1 : c - 1);
        setUserReaction(wasLiked ? "LIKE" : null);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    }
  }

  async function handleReaction(type: ReactionType) {
    if (!user) return;
    setShowReactions(false);
    const prev = userReaction;
    setUserReaction(type);
    setLiked(true);
    if (!prev) setLikeCount((c) => c + 1);

    try {
      await fetch(`/api/posts/${post.id}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      });
    } catch {
      setUserReaction(prev);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        onDelete?.(post.id);
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  }

  async function handleEditSave() {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentPost(json.data);
        onUpdate?.(json.data);
        setIsEditing(false);
        toast.success("Post updated");
      }
    } catch {
      toast.error("Failed to update post");
    }
  }

  const activeReaction = REACTIONS.find((r) => r.type === userReaction);

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-0">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size="md"
            isOnline={post.author.isOnline}
            showStatus
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                {post.author.displayName}
              </span>
              {post.author.isVerified && (
                <span className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <time>{formatRelativeTime(post.createdAt)}</time>
              {post.isEdited && <span>· Edited</span>}
              <span>·</span>
              <span className="flex items-center gap-0.5">
                {AUDIENCE_ICONS[post.audience]}
              </span>
            </div>
          </div>
        </Link>

        {/* Menu */}
        {isMine && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-slate-200 shadow-lg py-1 w-40 animate-scale-in">
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                >
                  <Edit2 size={14} /> Edit post
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => { handleDelete(); setShowMenu(false); }}
                >
                  <Trash2 size={14} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none text-sm outline-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleEditSave}>Save</Button>
            </div>
          </div>
        ) : (
          currentPost.content && (
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {currentPost.content}
            </p>
          )
        )}
      </div>

      {/* Media */}
      {post.media.length > 0 && (
        <MediaGrid media={post.media.map((pm) => pm.media)} />
      )}

      {/* Stats bar */}
      {(likeCount > 0 || currentPost._count.comments > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            {REACTIONS.slice(0, 3).map((r) => (
              <span key={r.type} className="text-sm">{r.emoji}</span>
            ))}
            {likeCount > 0 && <span className="ml-1">{likeCount}</span>}
          </div>
          {currentPost._count.comments > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {currentPost._count.comments} comment{currentPost._count.comments !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex border-t border-slate-100">
        {/* Like / Reaction */}
        <div
          className="relative flex-1"
          onMouseEnter={() => {
            clearTimeout(reactionRef.current);
            reactionRef.current = setTimeout(() => setShowReactions(true), 600);
          }}
          onMouseLeave={() => {
            clearTimeout(reactionRef.current);
            reactionRef.current = setTimeout(() => setShowReactions(false), 200);
          }}
        >
          <button
            onClick={handleLike}
            className={`reaction-btn w-full justify-center ${liked ? "active" : ""}`}
          >
            {activeReaction ? (
              <span>{activeReaction.emoji}</span>
            ) : (
              <Heart size={16} className={liked ? "fill-current" : ""} />
            )}
            <span>{activeReaction?.label ?? "Like"}</span>
          </button>

          {/* Reaction picker */}
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl px-3 py-2 flex gap-1 z-30 animate-scale-in">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  title={r.label}
                  className="text-2xl hover:scale-125 transition-transform duration-100 p-1"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="reaction-btn flex-1 justify-center"
        >
          <MessageCircle size={16} />
          <span>Comment</span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
            toast.success("Link copied!");
          }}
          className="reaction-btn flex-1 justify-center"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments */}
      {/* {showComments && <CommentSection postId={post.id} commentCount={currentPost._count.comments} />} */}
    </article>
  );
}

// ─────────────────────────────────────────
// Media Grid
// ─────────────────────────────────────────
function MediaGrid({ media }: { media: Post["media"][number]["media"][] }) {
  const count = media.length;

  if (count === 0) return null;

  const gridClass =
    count === 1 ? "grid-cols-1" :
    count === 2 ? "grid-cols-2" :
    count === 3 ? "grid-cols-2" :
    "grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-0.5 overflow-hidden`}>
      {media.slice(0, 4).map((m, i) => {
        const isOdd3 = count === 3 && i === 0;
        return (
          <div
            key={m.id}
            className={`relative overflow-hidden bg-slate-100 ${
              isOdd3 ? "row-span-2" : ""
            } ${count === 1 ? "max-h-96" : "aspect-square"}`}
          >
            {m.mediaType === "VIDEO" ? (
              <video
                src={m.url}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <Image
                src={m.url}
                alt={m.altText ?? "Post image"}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            {i === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{count - 4}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
