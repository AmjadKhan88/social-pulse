// src/app/(main)/friends/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, Users, Lightbulb, Check, X, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import type { UserProfile, FriendRequest, Friendship } from "@/types";

type Tab = "friends" | "requests" | "suggestions";

export default function FriendsPage() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "friends");
  const [friends,     setFriends]     = useState<Friendship[]>([]);
  const [requests,    setRequests]    = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { fetchData(tab); }, [tab]);

  async function fetchData(t: Tab) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/friends?type=${t}&limit=30`);
      const json = await res.json();
      if (!json.success) return;
      if (t === "friends")     setFriends(json.data.items);
      if (t === "requests")    setRequests(json.data.items);
      if (t === "suggestions") setSuggestions(json.data.items);
    } finally {
      setLoading(false);
    }
  }

  async function acceptRequest(senderId: string) {
    const res = await fetch(`/api/friends/request/${senderId}/accept`, { method: "POST" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.senderId !== senderId));
      toast.success("Friend request accepted!");
    }
  }

  async function rejectRequest(senderId: string) {
    await fetch(`/api/friends/request/${senderId}`, { method: "DELETE" });
    setRequests((prev) => prev.filter((r) => r.senderId !== senderId));
    toast.success("Request declined");
  }

  async function unfriend(friendId: string) {
    if (!confirm("Remove this friend?")) return;
    const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (res.ok) {
      setFriends((prev) => prev.filter((f) => f.friend.id !== friendId));
      toast.success("Unfriended");
    }
  }

  async function sendRequest(userId: string) {
    const res  = await fetch(`/api/friends/request/${userId}`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setSuggestions((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Friend request sent!");
    } else {
      toast.error(json.error ?? "Failed");
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "friends",     label: "Friends",     icon: <Users      size={16} />, count: friends.length },
    { id: "requests",    label: "Requests",    icon: <UserPlus   size={16} />, count: requests.length },
    { id: "suggestions", label: "Suggestions", icon: <Lightbulb  size={16} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Friends</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your connections</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {icon}
            {label}
            {count !== undefined && count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                tab === id ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <FriendsSkeleton />
      ) : (
        <>
          {/* Friends list */}
          {tab === "friends" && (
            <div>
              {friends.length === 0 ? (
                <EmptyState icon={<Users size={40} />} message="No friends yet" sub="Add some friends to get started" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map(({ friend, createdAt }) => (
                    <div key={friend.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-card">
                      <Link href={`/profile/${friend.id}`}>
                        <Avatar src={friend.avatarUrl} alt={friend.displayName} size="md" isOnline={friend.isOnline} showStatus />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${friend.id}`} className="font-semibold text-slate-900 text-sm hover:text-brand-600 transition-colors truncate block">
                          {friend.displayName}
                        </Link>
                        <p className="text-xs text-slate-500">@{friend.username}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Friends since {formatRelativeTime(createdAt)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<UserMinus size={13} />}
                        onClick={() => unfriend(friend.id)}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                      >
                        Unfriend
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friend requests */}
          {tab === "requests" && (
            <div>
              {requests.length === 0 ? (
                <EmptyState icon={<UserPlus size={40} />} message="No pending requests" sub="You're all caught up!" />
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-card">
                      <Link href={`/profile/${req.sender.id}`}>
                        <Avatar src={req.sender.avatarUrl} alt={req.sender.displayName} size="lg" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${req.sender.id}`} className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block">
                          {req.sender.displayName}
                        </Link>
                        <p className="text-sm text-slate-500">@{req.sender.username}</p>
                        {req.sender.bio && <p className="text-xs text-slate-400 truncate mt-0.5">{req.sender.bio}</p>}
                        <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(req.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          leftIcon={<Check size={14} />}
                          onClick={() => acceptRequest(req.senderId)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<X size={14} />}
                          onClick={() => rejectRequest(req.senderId)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friend suggestions */}
          {tab === "suggestions" && (
            <div>
              {suggestions.length === 0 ? (
                <EmptyState icon={<Lightbulb size={40} />} message="No suggestions right now" sub="Add more friends to see suggestions" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-card">
                      <Link href={`/profile/${user.id}`}>
                        <Avatar src={user.avatarUrl} alt={user.displayName} size="md" isOnline={user.isOnline} showStatus />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${user.id}`} className="font-semibold text-slate-900 text-sm hover:text-brand-600 transition-colors block truncate">
                          {user.displayName}
                        </Link>
                        <p className="text-xs text-slate-500">@{user.username}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {((user._count?.friendshipsA ?? 0) + (user._count?.friendshipsB ?? 0))} mutual connections
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<UserPlus size={14} />}
                        onClick={() => sendRequest(user.id)}
                        className="shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="mb-4 opacity-30">{icon}</div>
      <p className="font-semibold text-slate-600">{message}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
