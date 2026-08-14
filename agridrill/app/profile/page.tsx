"use client";

import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import PersonalInformation from "@/components/profile/PersonalInformation";
import AccountSettings from "@/components/profile/AccountSettings";
import SystemInformation from "@/components/profile/SystemInformation";
import ProfileActions from "@/components/profile/ProfileActions";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [accountCreated, setAccountCreated] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const { showToast } = useToast();
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);


  const [draft, setDraft] = useState({
    full_name: "",
    phone: "",
    location: "",
  });

  // New: holds the picked file + a local preview URL, separate from the saved profile
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setNotFound(false);


      const supabase = getSupabaseBrowserClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
  setAuthProvider(authUser.app_metadata?.provider ?? "email");

  if (authUser.created_at) {
    setAccountCreated(
      new Date(authUser.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    );
  }

  if (authUser.last_sign_in_at) {
    setLastLogin(
      new Date(authUser.last_sign_in_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }
}

      const response = await fetch("/api/profile");

      if (response.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data: Profile = await response.json();
      setProfile(data);
      setDraft({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        location: data.location ?? "",
      });
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleEdit = () => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handleAvatarSelect = (file: File) => {
    // Basic client-side validation
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", { variant: "error" });
      return;
    }
    if (file.size > maxSizeBytes) {
      showToast("Image must be smaller than 5MB", { variant: "error" });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);

    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      showToast("Not signed in", { variant: "error" });
      return;
    }

    let avatar_url = profile?.avatar_url ?? null;

    // Only touch Storage if the user actually picked a new file
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          upsert: true,
        });

      if (uploadError) {
        setSaving(false);
        console.error("AVATAR UPLOAD ERROR:", uploadError);
        showToast("Failed to upload avatar", {
          description: uploadError.message,
          variant: "error",
        });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Cache-bust so the new image shows immediately, since the filename stays the same
      avatar_url = `${publicUrl}?t=${Date.now()}`;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: draft.full_name,
        phone: draft.phone,
        location: draft.location,
        avatar_url,
      })
      .eq("id", user.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      showToast("Failed to update profile", {
        description: error.message,
        variant: "error",
      });
      return;
    }

    setProfile(data);
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
    showToast("Profile updated successfully", { variant: "success" });
  };

  if (loading) {
  return (
    <>
      <TopNavbar pageReady={true} />
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
          <p className="animate-pulse text-sm font-medium text-slate-400">
            Loading profile...
          </p>
        </div>
      </main>
    </>
  );
}

  if (notFound) {
  return (
    <>
      <TopNavbar pageReady={true} />
      <main className="min-h-screen bg-slate-950 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-400">
            No profile found for this account.
          </p>
        </div>
      </main>
    </>
  );
}

  return (
    <>
      <TopNavbar pageReady={true} />
      <main className="min-h-screen bg-slate-950 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <ProfileHeader />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProfileAvatar
              profile={profile}
              isEditing={isEditing}
              avatarPreview={avatarPreview}
              onFileSelect={handleAvatarSelect}
            />

            <div className="lg:col-span-2">
              <PersonalInformation
                profile={profile}
                draft={draft}
                isEditing={isEditing}
                onChange={setDraft}
              />
            </div>
          </div>

          <AccountSettings authProvider={authProvider} />

          <SystemInformation
            accountCreated={accountCreated}
            lastLogin={lastLogin}
          />

          <ProfileActions
            isEditing={isEditing}
            saving={saving}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        </div>
      </main>
    </>
  );
}