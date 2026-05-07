// src/app/(main)/profile/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera, Edit2, UserPlus, UserMinus, UserCheck, MessageCircle,
  MapPin, Calendar, Link as LinkIcon, MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/posts/PostCard";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useAuthStore } from "@/store/auth.store";
import { formatRelativeTime, formatCount, getAvatarUrl } from "@/lib/utils";
import type { UserProfile, Post } from "@/types";

type Props = { params: Promise<{ id: string }> };

export default function ProfilePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [posts,   setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingAction, setAction]    = useState(false);
  const [editModalOpen, setEditModal] = useState(false);
  const [activeTab, setTab]           = useState<"posts" | "friends" | "photos">("posts");

  const isSelf = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/${id}`);
      const json = await res.json();
      if (json.success) setProfile(json.data);
      else router.push("/feed");
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPosts() {
    try {
      const res  = await fetch(`/api/posts?userId=${id}&limit=20`);
      const json = await res.json();
      if (json.success) setPosts(json.data.items);
    } catch {
      // Silently fail; posts are secondary
    }
  }

  async function handleFriendAction() {
    if (!profile || !currentUser) return;
    setAction(true);
    try {
      const status = profile.friendshipStatus;
      let url = "";
      let method = "POST";

      if (status === "NOT_FRIENDS") {
        url = `/api/friends/request/${id}`;
      } else if (status === "PENDING_SENT") {
        url = `/api/friends/request/${id}`;
        method = "DELETE"; // Cancel
      } else if (status === "PENDING_RECEIVED") {
        url = `/api/friends/request/${id}/accept`;
      } else if (status === "FRIENDS") {
        url = `/api/friends/${id}`;
        method = "DELETE"; // Unfriend
      }

      const res = await fetch(url, { method });
      const json = await res.json();
      if (json.success) {
        await fetchProfile();
        toast.success(json.message ?? "Done");
      } else {
        toast.error(json.error ?? "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setAction(false);
    }
  }

  function getFriendButtonProps() {
    const status = profile?.friendshipStatus;
    if (status === "FRIENDS")          return { label: "Friends",          icon: <UserCheck size={16} />, variant: "secondary" as const };
    if (status === "PENDING_SENT")     return { label: "Request Sent",     icon: <UserCheck size={16} />, variant: "outline" as const };
    if (status === "PENDING_RECEIVED") return { label: "Accept Request",   icon: <UserCheck size={16} />, variant: "primary" as const };
    return                                    { label: "Add Friend",        icon: <UserPlus  size={16} />, variant: "primary" as const };
  }

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const friendBtn = getFriendButtonProps();
  const totalFriends = (profile._count?.friendshipsA ?? 0) + (profile._count?.friendshipsB ?? 0);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Cover Photo */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-r from-brand-400 to-purple-500 rounded-b-2xl overflow-hidden group">
        {profile.coverUrl && (
          <Image
            src={profile.coverUrl}
            alt="Cover photo"
            fill
            className="object-cover"
            priority
          />
        )}
        {isSelf && (
          <button
            onClick={() => setEditModal(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera size={14} />
            Edit cover
          </button>
        )}
      </div>

      {/* Profile header */}
      <div className="px-4 sm:px-6">
        <div className="flex items-end gap-4 -mt-14 sm:-mt-16 mb-4">
          <div className="relative group">
            <Avatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              size="2xl"
              isOnline={profile.isOnline}
              showStatus
              className="ring-4 ring-white shadow-lg"
            />
            {isSelf && (
              <button
                onClick={() => setEditModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={20} className="text-white" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                    {profile.displayName}
                  </h1>
                  {profile.isVerified && (
                    <span className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">@{profile.username}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {isSelf ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 size={15} />}
                    onClick={() => setEditModal(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={friendBtn.variant}
                      size="sm"
                      leftIcon={friendBtn.icon}
                      loading={loadingAction}
                      onClick={handleFriendAction}
                    >
                      {friendBtn.label}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<MessageCircle size={15} />}
                    >
                      Message
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio & meta */}
        {profile.bio && (
          <p className="text-slate-700 mb-3 leading-relaxed">{profile.bio}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Joined {formatRelativeTime(profile.createdAt)}
          </span>
          {profile.isOnline && (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Online now
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 pb-4 border-b border-slate-200">
          {[
            { label: "Posts",   value: profile._count?.posts   ?? 0 },
            { label: "Friends", value: totalFriends },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold text-slate-900">{formatCount(value)}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 mt-1">
          {(["posts", "friends", "photos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium">No posts yet</p>
                <p className="text-sm mt-1">
                  {isSelf ? "Share your first post!" : "Nothing to see here yet."}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={(updated) =>
                    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                  onDelete={(pid) =>
                    setPosts((prev) => prev.filter((p) => p.id !== pid))
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <FriendsGrid userId={id} />
        )}

        {activeTab === "photos" && (
          <PhotosGrid userId={id} />
        )}
      </div>

      {editModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditModal(false)}
          onSave={(updated) => {
            setProfile((prev) => prev ? { ...prev, ...updated } : prev);
            setEditModal(false);
            toast.success("Profile updated!");
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────
function FriendsGrid({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/friends?userId=${userId}&limit=12`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setFriends(j.data.items); })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="skeleton h-40 rounded-xl" />;
  if (friends.length === 0)
    return <div className="text-center py-12 text-slate-500">No friends yet</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {friends.map((f) => (
        <a
          key={f.id}
          href={`/profile/${f.id}`}
          className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Avatar src={f.avatarUrl} alt={f.displayName} size="md" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate">{f.displayName}</p>
            <p className="text-xs text-slate-500 truncate">@{f.username}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function PhotosGrid({ userId }: { userId: string }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <p>Photos grid coming soon</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-56 sm:h-72 bg-slate-200 rounded-b-2xl" />
      <div className="px-6 -mt-16">
        <div className="w-24 h-24 bg-slate-300 rounded-full ring-4 ring-white" />
        <div className="mt-3 space-y-2">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
      </div>
    </div>
  );
}
