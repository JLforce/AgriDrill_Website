"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** True once at least one telemetry row of the user's own session has been received. */
  readonly hasTelemetry: boolean;
  readonly error: string | null;
}

/** A telemetry row that also carries the session it belongs to. */
type SessionTelemetryRow = TelemetryRow & {
  operation_session_id?: number | null;
};

function rowToTelemetry(row: TelemetryRow): MachineTelemetry {
  return {
    ir1: row.ir1,
    ir4: row.ir4,
    seed_count: row.seed_count,
    hole_count: row.hole_count,
    drive_speed: row.drive_speed,
  };
}

function rowToActivity(row: TelemetryRow): ActivityRecord {
  return {
    time: formatClockTime(row.created_at),
    ir1: row.ir1,
    ir4: row.ir4,
    seed_count: row.seed_count,
    hole_count: row.hole_count,
    drive_speed: row.drive_speed,
  };
}

/**
 * Owns all telemetry state for the dashboard.
 *
 * Every user only sees telemetry from THEIR OWN most recent operation
 * session:
 *  1. find the signed-in user's latest row in `operation_sessions`
 *  2. load telemetry rows that belong to that session
 *  3. listen for realtime INSERTs and keep only rows of that session
 *
 * A brand-new user has no sessions yet, so the dashboard stays empty
 * until they run the machine themselves.
 */
export function useTelemetry(supabase: SupabaseClient): UseTelemetryResult {
  const [telemetry, setTelemetry] = useState<MachineTelemetry | null>(null);
  const [lastSeenIso, setLastSeenIso] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTelemetry, setHasTelemetry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The session whose telemetry is currently on screen.
  const sessionIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const clearTelemetry = useCallback(() => {
    sessionIdRef.current = null;
    setTelemetry(null);
    setLastSeenIso(null);
    setActivity([]);
    setHasTelemetry(false);
  }, []);

  const loadTelemetry = useCallback(async () => {
    // 1. Who is signed in?
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!isMountedRef.current) return;

    if (!user) {
      clearTelemetry();
      setIsLoading(false);
      return;
    }

    // 2. This user's most recent session.
    const { data: session, error: sessionError } = await supabase
      .from("operation_sessions")
      .select("id")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!isMountedRef.current) return;

    if (sessionError) {
      setError("Failed to load your operation session from Supabase.");
      setIsLoading(false);
      return;
    }

    // New user (or no operation yet): nothing to show.
    if (!session) {
      clearTelemetry();
      setIsLoading(false);
      return;
    }

    sessionIdRef.current = session.id;

    // 3. Telemetry of that session only.
    const { data, error: queryError } = await supabase
      .from(TELEMETRY_TABLE)
      .select("*")
      .eq("operation_session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_ROW_LIMIT);

    if (!isMountedRef.current) return;

    if (queryError) {
      setError("Failed to load telemetry from Supabase.");
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as TelemetryRow[];

    setError(null);

    if (rows.length === 0) {
      // Session exists but the machine has not sent data yet.
      setTelemetry(null);
      setLastSeenIso(null);
      setActivity([]);
      setHasTelemetry(false);
      setIsLoading(false);
      return;
    }

    const [latest] = rows;
    setTelemetry(rowToTelemetry(latest));
    setLastSeenIso(latest.created_at);
    setActivity(rows.map(rowToActivity));
    setHasTelemetry(true);
    setIsLoading(false);
  }, [supabase, clearTelemetry]);

  useEffect(() => {
    isMountedRef.current = true;
    loadTelemetry();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadTelemetry]);

  const handleRealtimeInsert = useCallback(
    (row: TelemetryRow) => {
      const incoming = row as SessionTelemetryRow;

      // Ignore rows that are not attached to any session.
      if (incoming.operation_session_id == null) return;

      // A session we are not showing yet (for example the user just pressed
      // Start again). Reload from the database so the dashboard switches to
      // the user's newest session. The database only returns this user's own
      // sessions, so another user's data can never be loaded this way.
      if (incoming.operation_session_id !== sessionIdRef.current) {
        void loadTelemetry();
        return;
      }

      setTelemetry(rowToTelemetry(row));
      setLastSeenIso(row.created_at);
      setHasTelemetry(true);
      setActivity((previous) => [rowToActivity(row), ...previous].slice(0, ACTIVITY_ROW_LIMIT));
    },
    [loadTelemetry]
  );

  useRealtimeTelemetry(supabase, handleRealtimeInsert);

  return useMemo(
    () => ({ telemetry, lastSeenIso, activity, isLoading, hasTelemetry, error }),
    [telemetry, lastSeenIso, activity, isLoading, hasTelemetry, error]
  );
}