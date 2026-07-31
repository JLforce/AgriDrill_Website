"use client";

import { useEffect, useRef } from "react";
import { type SupabaseClient } from "@supabase/supabase-js";
import { TELEMETRY_CHANNEL, TELEMETRY_TABLE } from "@/constants/dashboard";
import { type TelemetryRow } from "@/types/dashboard";

/**
 * Subscribes to INSERT events on `telemetry_events` and invokes `onInsert`
 * with the new row directly from the realtime payload.
 *
 * Deliberately does NOT re-query Supabase on every event — the caller is
 * responsible for merging `payload.new` into local state. This is what
 * keeps realtime updates cheap (no extra SELECT per event).
 */
export function useRealtimeTelemetry(
  supabase: SupabaseClient,
  onInsert: (row: TelemetryRow) => void
) {
  // Keep the latest callback in a ref so the subscription effect doesn't
  // need to re-run (and re-subscribe) every time the caller's callback
  // identity changes.
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    const channel = supabase
      .channel(TELEMETRY_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TELEMETRY_TABLE,
        },
        (payload) => {
          onInsertRef.current(payload.new as TelemetryRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}