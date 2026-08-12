"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

interface AccountSettingsProps {
  authProvider: string | null;
}

export default function AccountSettings({ authProvider }: AccountSettingsProps) {
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isGoogleUser = authProvider === "google";

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast("Please fill in both password fields", { variant: "error" });
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", { variant: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", { variant: "error" });
      return;
    }

    setSaving(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);

    if (error) {
      console.error("PASSWORD UPDATE ERROR:", error);
      showToast("Failed to update password", {
        description: error.message,
        variant: "error",
      });
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated successfully", { variant: "success" });
  };

  if (isGoogleUser) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            Account Settings
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Manage your login credentials and account security.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-4 text-slate-400">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <p className="text-sm">
            Your account signs in with Google. Password management is handled by your Google account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Account Settings
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage your login credentials and account security.
        </p>
      </div>

      <div className="space-y-5">
        {/* New Password */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Lock className="h-4 w-4" />
            New Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Lock className="h-4 w-4" />
            Confirm Password
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-500"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </section>
  );
}