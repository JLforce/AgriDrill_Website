"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AgriDrillChatbot from "@/components/ai/AgriDrillChatbot";

export default function AuthenticatedChatbot() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Check auth state on mount.
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAuthenticated(!!user);
    };

    checkAuth();

    // Keep this in sync if the user logs in/out without a full
    // page reload (e.g. after the OAuth callback redirect).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!authenticated) {
    return null;
  }

  return <AgriDrillChatbot />;
}