"use client";

import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SettingsHeader from "@/components/settings/SettingsHeader";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import SessionSettings from "@/components/settings/SessionSettings";
import DataExport from "@/components/settings/DataExport";
import UserGuide from "@/components/settings/UserGuide";
import AboutSettings from "@/components/settings/AboutSettings";

function BackToDashboardButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard")}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition hover:border-emerald-500 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 18l-6-6 6-6"
        />
      </svg>

      Back to Dashboard
    </button>
  );
}

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

        <main className="min-h-screen bg-slate-950 p-6 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <BackToDashboardButton />
            </div>

            <div className="flex min-h-[70vh] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800" />

                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>

                <p className="animate-pulse text-sm font-medium text-slate-400">
                  Loading settings...
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        <TopNavbar pageReady={true} />

        <main className="min-h-screen bg-slate-950 p-6 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <BackToDashboardButton />
            </div>

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

      <main className="min-h-screen bg-slate-950 p-6 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <BackToDashboardButton />

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