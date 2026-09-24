import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface MachineStatusContext {
  line1: string;
  line2: string;
  source_message: string | null;
  updated_at: string;
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

export async function getCurrentMachineStatus(): Promise<{
  data: MachineStatusContext | null;
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("machine_status")
    .select("line1, line2, source_message, updated_at")
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

  return {
    data,
    error: null,
  };
}

export async function getLatestTelemetry(): Promise<{
  data: LatestTelemetryContext | null;
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("telemetry_events")
    .select(
      "created_at, ir1, ir4, seed_count, hole_count, drive_speed"
    )
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
      error: "No telemetry data is currently available.",
    };
  }

  return {
    data,
    error: null,
  };
}

export async function getLatestOperationSession(): Promise<{
  data: OperationSessionContext | null;
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("operation_sessions")
    .select(
      "id, started_at, ended_at, start_seed_count, end_seed_count, start_hole_count, end_hole_count, obstacle_count, status, created_at"
    )
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
      error: "No operation history is currently available.",
    };
  }

  return {
    data,
    error: null,
  };
}
export interface RecentNotificationContext {
  id: number;
  created_at: string;
  type: string;
  message: string;
  is_read: boolean;
}

export async function getRecentNotifications(): Promise<{
  data: RecentNotificationContext[];
  error: string | null;
}> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, created_at, type, message, is_read")
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