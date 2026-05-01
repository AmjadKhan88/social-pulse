// src/components/posts/CommentSection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Reply, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/auth.store";
import { formatRelativeTime } from "../../lib/utils";
import type { Comment } from "../../types";

interface Props {
  postId: string;
  commentCount: number;
}

export function CommentSection({ postId, commentCount }: Props) {
  const { user } = useAuthStore();
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [content,   setContent]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore,   setHasMore]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchComments(); }, [postId]);

  async function fetchComments(cursor?: string) {
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursor) params.set("cursor", cursor);
      const res  = await fetch(`/api/posts/${postId}/comments?${params}`);
      const json = await res.json();
      if (json.success) {
        setComments((prev) => cursor ? [...prev, ...json.data.items] : json.data.items);
        setNextCursor(json.data.nextCursor);
        setHasMore(json.data.hasMore);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => [...prev, json.data]);
        setContent("");
      } else {
        toast.error(json.error ?? "Failed to comment");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-4">
      {/* Input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500 transition-all">
            <input
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            />
            {content.trim() && (
              <button
                type="submit"
                disabled={submitting}
                className="text-brand-600 hover:text-brand-700 disabled:opacity-50 text-xs font-semibold shrink-0"
              >
                {submitting ? "..." : "Post"}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-200 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={(newComment) => setComments((prev) => [...prev, newComment])}
              onDelete={(cid) => setComments((prev) => prev.filter((c) => c.id !== cid))}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => nextCursor && fetchComments(nextCursor)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <ChevronDown size={14} />
              Load more comments
            </button>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Single Comment Item
// ─────────────────────────────────────────
function CommentItem({
  comment,
  postId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  postId: string;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuthStore();
  const [liked,       setLiked]      = useState(comment.userLiked);
  const [likeCount,   setLikeCount]  = useState(comment._count.likes);
  const [showReply,   setShowReply]  = useState(false);
  const [replyText,   setReplyText]  = useState("");
  const [submitting,  setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies,     setReplies]    = useState<Comment[]>([]);

  async function handleLike() {
    if (!user) return;
    const was = liked;
    setLiked(!was);
    setLikeCount((c) => was ? c - 1 : c + 1);
    try {
      await fetch(`/api/comments/${comment.id}/likes`, {
        method: was ? "DELETE" : "POST",
      });
    } catch {
      setLiked(was);
      setLikeCount((c) => was ? c + 1 : c - 1);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
      });
      const json = await res.json();
      if (json.success) {
        setReplies((prev) => [...prev, json.data]);
        setShowReplies(true);
        setReplyText("");
        setShowReply(false);
        onReply(json.data);
      }
    } catch {
      toast.error("Failed to reply");
    } finally {
      setSubmitting(false);
    }
  }

  const isMine = user?.id === comment.author.id;

  return (
    <div className="flex gap-2.5 animate-fade-in">
      <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 border border-slate-100 inline-block max-w-full">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-slate-900">
              {comment.author.displayName}
            </span>
            {comment.isEdited && <span className="text-[10px] text-slate-400">· Edited</span>}
          </div>
          <p className="text-sm text-slate-700 break-words">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-slate-400">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          <button
            onClick={handleLike}
            className={`font-medium transition-colors ${liked ? "text-red-500" : "hover:text-slate-600"}`}
          >
            {liked ? "♥ Liked" : "Like"}
          </button>
          {likeCount > 0 && <span>{likeCount}</span>}
          <button
            onClick={() => setShowReply(!showReply)}
            className="font-medium hover:text-slate-600 transition-colors"
          >
            Reply
          </button>
          {isMine && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
                  if (res.ok) onDelete(comment.id);
                } catch { /* silent */ }
              }}
              className="text-red-400 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply && user && (
          <form onSubmit={handleReply} className="flex items-center gap-2 mt-2">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="xs" />
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-brand-500/40 transition-all">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.author.displayName}...`}
                className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              />
              {replyText.trim() && (
                <button type="submit" disabled={submitting} className="text-brand-600 text-xs font-semibold">
                  {submitting ? "..." : "Reply"}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment._count.replies > 0 && (
          <button
            onClick={async () => {
              if (!showReplies) {
                const res  = await fetch(`/api/posts/${postId}/comments?parentId=${comment.id}`);
                const json = await res.json();
                if (json.success) setReplies(json.data.items);
              }
              setShowReplies(!showReplies);
            }}
            className="flex items-center gap-1 text-xs text-brand-600 font-medium mt-1.5 ml-1"
          >
            <Reply size={12} />
            {comment._count.replies} {comment._count.replies === 1 ? "reply" : "replies"}
          </button>
        )}

        {showReplies && replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-2">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                postId={postId}
                onReply={() => {}}
                onDelete={(rid) => setReplies((prev) => prev.filter((c) => c.id !== rid))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
