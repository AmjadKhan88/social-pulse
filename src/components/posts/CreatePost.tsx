// src/components/posts/CreatePost.tsx
"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Video, Globe, Users, Lock, X, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/auth.store";
import type { Post, PostAudience } from "../../types";

interface Props {
  onPostCreated: (post: Post) => void;
}

const AUDIENCE_OPTIONS: { value: PostAudience; label: string; icon: React.ReactNode }[] = [
  { value: "PUBLIC",  label: "Everyone", icon: <Globe  size={14} /> },
  { value: "FRIENDS", label: "Friends",  icon: <Users  size={14} /> },
  { value: "ONLY_ME", label: "Only Me",  icon: <Lock   size={14} /> },
];

interface UploadedMedia { mediaId: string; url: string; mediaType: string }

export function CreatePost({ onPostCreated }: Props) {
  const { user } = useAuthStore();
  const [focused,   setFocused]   = useState(false);
  const [content,   setContent]   = useState("");
  const [audience,  setAudience]  = useState<PostAudience>("PUBLIC");
  const [media,     setMedia]     = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting,   setPosting]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (media.length + files.length > 4) {
      toast.error("Max 4 media items per post");
      return;
    }

    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("purpose", "post");
          const res  = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          return json.data as UploadedMedia;
        })
      );
      setMedia((prev) => [...prev, ...uploads]);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!content.trim() && media.length === 0) {
      toast.error("Write something or attach media");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:  content.trim() || undefined,
          audience,
          mediaIds: media.map((m) => m.mediaId),
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }

      onPostCreated(json.data);
      setContent("");
      setMedia([]);
      setFocused(false);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  }

  const audienceOpt = AUDIENCE_OPTIONS.find((o) => o.value === audience)!;
  const charCount   = content.length;
  const charLimit   = 5000;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      <div className="flex gap-3">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />

        <div className="flex-1 min-w-0">
          {/* Trigger / textarea */}
          {!focused ? (
            <button
              onClick={() => setFocused(true)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm transition-colors"
            >
              What&apos;s on your mind, {user.displayName.split(" ")[0]}?
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${user.displayName.split(" ")[0]}?`}
                  className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none text-sm outline-none text-slate-800 placeholder:text-slate-400"
                  rows={4}
                />
                <div className={`absolute bottom-2 right-2 text-xs ${isOverLimit ? "text-red-500" : "text-slate-400"}`}>
                  {charCount}/{charLimit}
                </div>
              </div>

              {/* Media previews */}
              {media.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {media.map((m, i) => (
                    <div key={m.mediaId} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                      {m.mediaType === "VIDEO" ? (
                        <video src={m.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt="Attachment" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {uploading && (
                    <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Bottom bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || media.length >= 4}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-600 transition-colors disabled:opacity-40"
                    title="Add photo/video"
                  >
                    <ImageIcon size={18} />
                  </button>

                  {/* Audience selector */}
                  <div className="relative">
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value as PostAudience)}
                      className="appearance-none pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {AUDIENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">
                      {audienceOpt.icon}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setFocused(false); setContent(""); setMedia([]); }}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    loading={posting}
                    disabled={isOverLimit || (!content.trim() && media.length === 0)}
                    leftIcon={<Send size={14} />}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
