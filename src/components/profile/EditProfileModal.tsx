// src/components/profile/EditProfileModal.tsx
"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Camera, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { updateProfileSchema, type UpdateProfileInput } from "../../lib/validations";
import { useAuthStore } from "../../store/auth.store";
import type { UserProfile } from "../../types";

interface Props {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => void;
}

export function EditProfileModal({ profile, onClose, onSave }: Props) {
  const { updateUser } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio:         profile.bio ?? "",
      username:    profile.username,
    },
  });

  async function uploadFile(file: File, purpose: "avatar" | "cover") {
    const setter  = purpose === "avatar" ? setUploadingAvatar : setUploadingCover;
    const preview = purpose === "avatar" ? setAvatarPreview   : setCoverPreview;

    setter(true);
    try {
      // Show local preview immediately
      const url = URL.createObjectURL(file);
      preview(url);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);

      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(`${purpose === "avatar" ? "Avatar" : "Cover"} updated`);
      return json.data.url as string;
    } catch (err: unknown) {
      preview(null);
      toast.error((err as Error).message ?? "Upload failed");
      return null;
    } finally {
      setter(false);
    }
  }

  async function onSubmit(data: UpdateProfileInput) {
    try {
      const res  = await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }

      updateUser({ displayName: data.displayName, username: data.username });
      onSave(json.data);
    } catch {
      toast.error("Failed to save changes");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cover photo editor */}
        <div className="relative h-32 bg-gradient-to-r from-brand-400 to-purple-500 overflow-hidden group cursor-pointer"
          onClick={() => coverInputRef.current?.click()}>
          {(coverPreview ?? profile.coverUrl) && (
            <img
              src={coverPreview ?? profile.coverUrl!}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingCover ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Camera size={16} />
                Change Cover
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, "cover");
            }}
          />
        </div>

        {/* Avatar editor */}
        <div className="px-6 -mt-10 mb-4">
          <div
            className="relative inline-block group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Avatar
              src={avatarPreview ?? profile.avatarUrl}
              alt={profile.displayName}
              size="xl"
              className="ring-4 ring-white"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "avatar");
              }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Name"
              error={errors.displayName?.message}
              {...register("displayName")}
            />
            <Input
              label="Username"
              error={errors.username?.message}
              leftAddon={<span className="text-xs">@</span>}
              {...register("username")}
            />
          </div>

          <Textarea
            label="Bio"
            rows={3}
            placeholder="Tell the world about yourself..."
            hint="Max 300 characters"
            error={errors.bio?.message}
            {...register("bio")}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
