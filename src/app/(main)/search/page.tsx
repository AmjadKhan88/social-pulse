// src/app/(main)/search/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon, Users, FileText, X } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/posts/PostCard";
import { formatRelativeTime } from "@/lib/utils";
import type { UserProfile, Post } from "@/types";

type SearchTab = "all" | "users" | "posts";

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [query,     setQuery]     = useState(params.get("q") ?? "");
  const [tab,       setTab]       = useState<SearchTab>((params.get("type") as SearchTab) ?? "all");
  const [users,     setUsers]     = useState<UserProfile[]>([]);
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [loading,   setLoading]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string, t: SearchTab) => {
    if (!q.trim()) { setUsers([]); setPosts([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users ?? []);
        setPosts(json.data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, tab);
      // Sync URL
      const url = new URL(window.location.href);
      if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
      url.searchParams.set("type", tab);
      router.replace(url.pathname + url.search, { scroll: false });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, tab, doSearch, router]);

  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      {/* Search input */}
      <div className="relative">
        <SearchIcon
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, posts…"
          autoFocus
          className="w-full h-11 pl-10 pr-10 rounded-2xl border border-slate-200 bg-white
                     text-sm text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500
                     transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["all", "users", "posts"] as SearchTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && !hasResults && (
        <div className="text-center py-16 text-slate-400">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-slate-600">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {/* No query state */}
      {!loading && !query && (
        <div className="text-center py-16 text-slate-400">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Search for people or posts</p>
          <p className="text-sm mt-1">Discover new connections and content</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="space-y-6">
          {/* Users section */}
          {(tab === "all" || tab === "users") && users.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  People {tab === "all" && <span className="text-slate-400 font-normal">· {users.length}</span>}
                </h2>
              </div>
              <div className="space-y-2">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all group"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.displayName}
                      size="md"
                      isOnline={user.isOnline}
                      showStatus
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 text-sm group-hover:text-brand-700 transition-colors truncate">
                          {user.displayName}
                        </span>
                        {user.isVerified && (
                          <span className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{user.bio}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {((user._count?.friendshipsA ?? 0) + (user._count?.friendshipsB ?? 0))} friends
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts section */}
          {(tab === "all" || tab === "posts") && posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Posts {tab === "all" && <span className="text-slate-400 font-normal">· {posts.length}</span>}
                </h2>
              </div>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
