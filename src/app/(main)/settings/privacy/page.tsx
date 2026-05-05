// src/app/(main)/settings/privacy/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Shield, Eye, Users, Globe, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import type { PrivacySettings } from "@/types";

type ProfileVis  = "PUBLIC" | "FRIENDS" | "PRIVATE";
type PostAud     = "PUBLIC" | "FRIENDS" | "ONLY_ME";
type FriendReqPr = "EVERYONE" | "FRIENDS_OF_FRIENDS" | "NOBODY";
type EmailPr     = "PUBLIC" | "FRIENDS" | "ONLY_ME";

export default function PrivacySettingsPage() {
  const { user } = useAuthStore();
  const [settings,  setSettings]  = useState<PrivacySettings | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/users/${user.id}/privacy`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setSettings(j.data); })
      .finally(() => setLoading(false));
  }, [user]);

  async function save() {
    if (!user || !settings) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/users/${user.id}/privacy`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) toast.success("Privacy settings saved");
      else toast.error(json.error ?? "Save failed");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <SettingsSkeleton />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Privacy Settings</h1>
          <p className="text-sm text-slate-500">Control who can see your content</p>
        </div>
      </div>

      {/* Profile Visibility */}
      <PrivacyCard
        icon={<Eye size={18} />}
        title="Profile Visibility"
        description="Who can see your profile"
      >
        <RadioGroup
          value={settings.profileVisibility}
          onChange={(v) => setSettings({ ...settings, profileVisibility: v as ProfileVis })}
          options={[
            { value: "PUBLIC",  label: "Everyone",          icon: <Globe size={14} />, desc: "Anyone can view your profile" },
            { value: "FRIENDS", label: "Friends Only",      icon: <Users size={14} />, desc: "Only your friends can view" },
            { value: "PRIVATE", label: "Private",           icon: <Lock  size={14} />, desc: "Only you can view your profile" },
          ]}
        />
      </PrivacyCard>

      {/* Default Post Audience */}
      <PrivacyCard
        icon={<Globe size={18} />}
        title="Default Post Audience"
        description="Who sees your posts by default"
      >
        <RadioGroup
          value={settings.postDefaultAudience}
          onChange={(v) => setSettings({ ...settings, postDefaultAudience: v as PostAud })}
          options={[
            { value: "PUBLIC",   label: "Everyone",    icon: <Globe size={14} />, desc: "Visible to all users" },
            { value: "FRIENDS",  label: "Friends",     icon: <Users size={14} />, desc: "Only your friends" },
            { value: "ONLY_ME",  label: "Only Me",     icon: <Lock  size={14} />, desc: "Completely private" },
          ]}
        />
      </PrivacyCard>

      {/* Friend Requests */}
      <PrivacyCard
        icon={<Users size={18} />}
        title="Friend Requests"
        description="Who can send you friend requests"
      >
        <RadioGroup
          value={settings.whoCanSendFriendRequest}
          onChange={(v) => setSettings({ ...settings, whoCanSendFriendRequest: v as FriendReqPr })}
          options={[
            { value: "EVERYONE",           label: "Everyone",              icon: <Globe size={14} />, desc: "Anyone can send a request" },
            { value: "FRIENDS_OF_FRIENDS", label: "Friends of Friends",   icon: <Users size={14} />, desc: "Only mutual connections" },
            { value: "NOBODY",             label: "Nobody",               icon: <Lock  size={14} />, desc: "Disable friend requests" },
          ]}
        />
      </PrivacyCard>

      {/* Email Visibility */}
      <PrivacyCard
        icon={<Mail size={18} />}
        title="Email Visibility"
        description="Who can see your email address"
      >
        <RadioGroup
          value={settings.whoCanSeeEmail}
          onChange={(v) => setSettings({ ...settings, whoCanSeeEmail: v as EmailPr })}
          options={[
            { value: "PUBLIC",  label: "Everyone",  icon: <Globe size={14} />, desc: "Your email is visible to all" },
            { value: "FRIENDS", label: "Friends",   icon: <Users size={14} />, desc: "Only friends can see your email" },
            { value: "ONLY_ME", label: "Only Me",   icon: <Lock  size={14} />, desc: "Email is completely private" },
          ]}
        />
      </PrivacyCard>

      {/* Online Status */}
      <PrivacyCard
        icon={<Eye size={18} />}
        title="Online Status"
        description="Show when you are active"
      >
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-slate-900">Show online status</p>
            <p className="text-xs text-slate-500">Friends can see when you&apos;re online</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.showOnlineStatus}
            onClick={() => setSettings({ ...settings, showOnlineStatus: !settings.showOnlineStatus })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              settings.showOnlineStatus ? "bg-brand-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                settings.showOnlineStatus ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </PrivacyCard>

      <Button onClick={save} loading={saving} size="lg" fullWidth>
        Save Privacy Settings
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────
function PrivacyCard({
  icon, title, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-brand-600">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function RadioGroup({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: React.ReactNode; desc: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
            value === opt.value
              ? "border-brand-500 bg-brand-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <input
            type="radio"
            name={`radio-${options[0].value}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span className={value === opt.value ? "text-brand-600" : "text-slate-500"}>{opt.icon}</span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${value === opt.value ? "text-brand-800" : "text-slate-700"}`}>
              {opt.label}
            </p>
            <p className="text-xs text-slate-500">{opt.desc}</p>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === opt.value ? "border-brand-600" : "border-slate-300"
          }`}>
            {value === opt.value && <div className="w-2 h-2 bg-brand-600 rounded-full" />}
          </div>
        </label>
      ))}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
      ))}
    </div>
  );
}
