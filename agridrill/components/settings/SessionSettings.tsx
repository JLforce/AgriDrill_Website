"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Monitor } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

interface SessionSettingsProps {
  email: string | null;
}

export default function SessionSettings({ email }: SessionSettingsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async (allDevices: boolean) => {
    setSigningOut(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut({
      scope: allDevices ? "global" : "local",
    });

    setSigningOut(false);

    if (error) {
      console.error("SIGN OUT ERROR:", error);
      showToast("Failed to sign out", {
        description: error.message,
        variant: "error",
      });
      return;
    }

    router.push("/landing");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Session</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage where you're signed in.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/60">
        <Monitor className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">Signed in as</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{email || "Unknown"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => handleSignOut(false)}
          disabled={signingOut}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <button
          type="button"
          onClick={() => handleSignOut(true)}
          disabled={signingOut}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of All Devices
        </button>
      </div>
    </section>
  );
}