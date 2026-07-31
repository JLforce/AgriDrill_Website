"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type SupabaseClient } from "@supabase/supabase-js";
import { ACTIVITY_ROW_LIMIT, TELEMETRY_TABLE } from "@/constants/dashboard";
import { type ActivityRecord, type MachineTelemetry, type TelemetryRow } from "@/types/dashboard";
import { formatClockTime } from "@/utils/formatTime";
import { useRealtimeTelemetry } from "@/hooks/useRealtimeTelemetry";

export interface UseTelemetryResult {
  readonly telemetry: MachineTelemetry | null;
  readonly lastSeenIso: string | null;
  readonly activity: ActivityRecord[];
  /** True until the initial Supabase SELECT has resolved (used to drive skeleton loaders). */
  readonly isLoading: boolean;
  /** True once at least one telemetry row has ever been received. */
  readonly hasTelemetry: boolean;
  readonly error: string | null;
}

function rowToTelemetry(row: TelemetryRow): MachineTelemetry {
  return {
    ir1: row.ir1,
    ir2: row.ir2,
    ir3: row.ir3,
    ir4: row.ir4,
    battery_percent: row.battery_percent,
    seed_count: row.seed_count,
    hole_count: row.hole_count,
    drive_speed: row.drive_speed,
  };
}

function rowToActivity(row: TelemetryRow): ActivityRecord {
  return {
    time: formatClockTime(row.created_at),
    battery_percent: row.battery_percent,
    ir1: row.ir1,
    ir2: row.ir2,
    ir3: row.ir3,
    ir4: row.ir4,
    seed_count: row.seed_count,
    hole_count: row.hole_count,
    drive_speed: row.drive_speed,
  };
}

/**
 * Owns all telemetry state for the dashboard:
 *  - performs exactly ONE Supabase SELECT, on mount
 *  - subscribes to realtime INSERTs and merges `payload.new` straight into
 *    state (no extra database round-trip per event)
 */
export function useTelemetry(supabase: SupabaseClient): UseTelemetryResult {
  const [telemetry, setTelemetry] = useState<MachineTelemetry | null>(null);
  const [lastSeenIso, setLastSeenIso] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTelemetry, setHasTelemetry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTelemetry() {
      const { data, error: queryError } = await supabase
        .from(TELEMETRY_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_ROW_LIMIT);

      if (cancelled) return;

      if (queryError) {
        setError("Failed to load telemetry from Supabase.");
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as TelemetryRow[];

      if (rows.length === 0) {
        setIsLoading(false);
        return;
      }

      const [latest] = rows;
      setTelemetry(rowToTelemetry(latest));
      setLastSeenIso(latest.created_at);
      setActivity(rows.map(rowToActivity));
      setHasTelemetry(true);
      setIsLoading(false);
    }

    loadInitialTelemetry();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleRealtimeInsert = useCallback((row: TelemetryRow) => {
    setTelemetry(rowToTelemetry(row));
    setLastSeenIso(row.created_at);
    setHasTelemetry(true);
    setActivity((previous) => [rowToActivity(row), ...previous].slice(0, ACTIVITY_ROW_LIMIT));
  }, []);

  useRealtimeTelemetry(supabase, handleRealtimeInsert);

  return useMemo(
    () => ({ telemetry, lastSeenIso, activity, isLoading, hasTelemetry, error }),
    [telemetry, lastSeenIso, activity, isLoading, hasTelemetry, error]
  );
}