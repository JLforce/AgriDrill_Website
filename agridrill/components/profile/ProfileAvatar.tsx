"use client";

import { useRef } from "react";
import Image from "next/image";
import { CircleCheckBig, Pencil, ShieldCheck, User } from "lucide-react";

interface ProfileAvatarProps {
  profile: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  isEditing: boolean;
  avatarPreview: string | null;
  onFileSelect: (file: File) => void;
}

export default function ProfileAvatar({
  profile,
  isEditing,
  avatarPreview,
  onFileSelect,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = avatarPreview || profile?.avatar_url;

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-emerald-600 shadow-lg">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Profile Avatar"
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-14 w-14 text-white" />
            )}
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handlePickFile}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
              aria-label="Change avatar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        {isEditing && (
          <p className="mt-3 text-xs text-slate-500">
            Click the pencil to choose a new photo. It saves with your other changes.
          </p>
        )}

        {/* Name */}
        <h2 className="mt-6 text-2xl font-bold text-white">
          {profile?.full_name || "Loading..."}
        </h2>

        {/* Email */}
        <p className="mt-2 text-sm text-slate-400">
          {profile?.email || ""}
        </p>

        {/* Role */}
        <div className="mt-4 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-300">
            Operator
          </span>
        </div>

        {/* Status */}
        <div className="mt-6 flex items-center gap-2">
          <CircleCheckBig className="h-5 w-5 text-emerald-500" />
          <span className="text-sm text-emerald-400">
            Online
          </span>
        </div>
      </div>
    </section>
  );
}