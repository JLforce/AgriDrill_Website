import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Who is operating the machine, from the point of view of the
 * signed-in user:
 *  - "mine": the user's own operation is running
 *  - "idle": nobody is operating the machine
 *  - "other": another user is operating the machine
 */
export type MachineOwnership = "mine" | "idle" | "other";

export interface MachineStatusContext {
  ownership: MachineOwnership;
  /** Only filled when ownership is "mine". */
  line1: string | null;
  line2: string | null;
  source_message: string | null;
  updated_at: string | null;
}

export interface LatestTelemetryContext {
  created_at: string;
  ir1: boolean;
  ir4: boolean;
  seed_count: number;
  hole_count: number;
  drive_speed: number;
}

export interface OperationSessionContext {
  id: number;
  started_at: string;
  ended_at: string | null;
  start_seed_count: number;
  end_seed_count: number | null;
  start_hole_count: number;
  end_hole_count: number | null;
  obstacle_count: number;
  status: string;
  created_at: string;
}

export interface RecentNotificationContext {
  id: number;
  created_at: string;
  type: string;
  message: string;
  is_read: boolean;
}

/**
 * Machine status, shown only to the user who is operating the machine.
 * Anyone else only learns whether the machine is idle or in use.
 */
export async function getCurrentMachineStatus(
  userId: string
): Promise<{
  data: MachineStatusContext | null;
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("machine_status")
    .select(
      "line1, line2, source_message, updated_at, active_session_id"
    )
    .eq("id", 1)
    .single();

  if (error) {
    console.error(
      "Failed to retrieve AgriDrill machine status:",
      error
    );

    return {
      data: null,
      error: "Machine status is currently unavailable.",
    };
  }

  // Nobody is operating the machine.
  if (!data.active_session_id) {
    return {
      data: {
        ownership: "idle",
        line1: null,
        line2: null,
        source_message: null,
        updated_at: null,
      },
      error: null,
    };
  }

  // Is the running session this user's own?
  const { data: ownSession, error: sessionError } =
    await supabase
      .from("operation_sessions")
      .select("id")
      .eq("id", data.active_session_id)
      .eq("user_id", userId)
      .maybeSingle();

  if (sessionError) {
    console.error(
      "Failed to verify machine ownership:",
      sessionError
    );

    return {
      data: null,
      error: "Machine status is currently unavailable.",
    };
  }

  if (!ownSession) {
    return {
      data: {
        ownership: "other",
        line1: null,
        line2: null,
        source_message: null,
        updated_at: null,
      },
      error: null,
    };
  }

  return {
    data: {
      ownership: "mine",
      line1: data.line1,
      line2: data.line2,
      source_message: data.source_message,
      updated_at: data.updated_at,
    },
    error: null,
  };
}

/**
 * The user's most recent operation session (or null if none).
 */
async function getLatestOwnSessionId(
  userId: string
): Promise<{ id: number | null; failed: boolean }> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("operation_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to retrieve the latest AgriDrill session:",
      error
    );

    return { id: null, failed: true };
  }

  return { id: data?.id ?? null, failed: false };
}

/**
 * Latest telemetry reading from the user's most recent session.
 */
export async function getLatestTelemetry(
  userId: string
): Promise<{
  data: LatestTelemetryContext | null;
  error: string | null;
}> {
  const session = await getLatestOwnSessionId(userId);

  if (session.failed) {
    return {
      data: null,
      error: "Latest telemetry is currently unavailable.",
    };
  }

  if (session.id === null) {
    return {
      data: null,
      error:
        "This account has no recorded operations yet, so there is no telemetry to show.",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("telemetry_events")
    .select(
      "created_at, ir1, ir4, seed_count, hole_count, drive_speed"
    )
    .eq("operation_session_id", session.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to retrieve latest AgriDrill telemetry:",
      error
    );

    return {
      data: null,
      error: "Latest telemetry is currently unavailable.",
    };
  }

  if (!data) {
    return {
      data: null,
      error:
        "No telemetry has been recorded yet for this account's latest operation.",
    };
  }

  return {
    data,
    error: null,
  };
}

/**
 * The user's most recent operation session.
 */
export async function getLatestOperationSession(
  userId: string
): Promise<{
  data: OperationSessionContext | null;
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("operation_sessions")
    .select(
      "id, started_at, ended_at, start_seed_count, end_seed_count, start_hole_count, end_hole_count, obstacle_count, status, created_at"
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to retrieve latest AgriDrill operation:",
      error
    );

    return {
      data: null,
      error: "Operation history is currently unavailable.",
    };
  }

  if (!data) {
    return {
      data: null,
      error:
        "This account has no recorded operations yet.",
    };
  }

  return {
    data,
    error: null,
  };
}

/**
 * The user's own recent notifications.
 */
export async function getRecentNotifications(
  userId: string
): Promise<{
  data: RecentNotificationContext[];
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, created_at, type, message, is_read")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(
      "Failed to retrieve AgriDrill notifications:",
      error
    );

    return {
      data: [],
      error: "Notification data is currently unavailable.",
    };
  }

  return {
    data: data ?? [],
    error: null,
  };
}