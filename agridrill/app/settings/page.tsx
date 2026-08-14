"use client";

import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SettingsHeader from "@/components/settings/SettingsHeader";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import SessionSettings from "@/components/settings/SessionSettings";
import DataExport from "@/components/settings/DataExport";
import UserGuide from "@/components/settings/UserGuide";
import AboutSettings from "@/components/settings/AboutSettings";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setEmail(user.email ?? null);
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) {
  return (
    <>
      <TopNavbar pageReady={true} />
      <main className="flex min-h-screen items-center justify-center bg-slate-950 dark:bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
          <p className="animate-pulse text-sm font-medium text-slate-400">
            Loading settings...
          </p>
        </div>
      </main>
    </>
  );
}


if (!authenticated) {
  return (
    <>
      <TopNavbar pageReady={true} />
      <main className="min-h-screen bg-slate-950 dark:bg-slate-950 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-400">
            You must be signed in to view settings.
          </p>
        </div>
      </main>
    </>
  );
}

return (
  <>
    <TopNavbar pageReady={true} />
    <main className="min-h-screen bg-slate-950 dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <SettingsHeader />
        <AppearanceSettings />
        <SessionSettings email={email} />
        <DataExport />
        <UserGuide />
        <AboutSettings />
      </div>
    </main>
  </>
);
}