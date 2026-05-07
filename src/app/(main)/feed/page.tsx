// src/app/(main)/feed/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { CreatePost } from "@/components/posts/CreatePost";
import { PostCard }   from "@/components/posts/PostCard";
import { FriendSuggestions } from "@/components/friends/FriendSuggestions";
import type { Post } from "@/types";

export default function FeedPage() {
  const [posts,      setPosts]     = useState<Post[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setCursor]    = useState<string | null>(null);
  const [hasMore,    setHasMore]   = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursor) params.set("cursor", cursor);

      const res  = await fetch(`/api/posts?${params}`);
      const json = await res.json();

      if (!json.success) { toast.error("Failed to load posts"); return; }

      const { items, nextCursor: nc, hasMore: hm } = json.data;
      setPosts((prev) => cursor ? [...prev, ...items] : items);
      setCursor(nc);
      setHasMore(hm);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loadingMore) {
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, nextCursor, loadingMore, fetchPosts]);

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => [newPost, ...prev]);
  }

  function handlePostUpdate(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handlePostDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main feed */}
      <div className="lg:col-span-2 space-y-4">
        <CreatePost onPostCreated={handlePostCreated} />

        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <EmptyFeed />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {loadingMore && <Loader2 size={24} className="animate-spin text-brand-500" />}
              {!hasMore && posts.length > 0 && (
                <p className="text-sm text-slate-400">You&apos;re all caught up! 🎉</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block space-y-4">
        <FriendSuggestions />
        <TrendingTopics />
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-slate-200 rounded w-32" />
              <div className="h-2.5 bg-slate-200 rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
          </div>
          <div className="h-48 bg-slate-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">👋</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">Welcome to SocialSphere!</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        Your feed is empty. Add some friends or create your first post to get started!
      </p>
    </div>
  );
}

function TrendingTopics() {
  const topics = ["#technology", "#design", "#programming", "#webdev", "#ai", "#startup"];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      <h3 className="font-semibold text-slate-900 mb-3 text-sm">Trending Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <span
            key={t}
            className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium hover:bg-brand-100 cursor-pointer transition-colors"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
