import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Consider the machine online if its latest status
// was received within the last 30 seconds.
const ONLINE_THRESHOLD_MS = 30 * 1000;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          online: false,
          error: "Supabase configuration is missing on the server.",
        },
        { status: 500 }
      );
    }

    // Get the most recent telemetry/status record
    const { data, error } = await supabase
      .from("telemetry_events")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase status query error:", error);

      return NextResponse.json(
        {
          success: false,
          online: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // No telemetry has been received yet
    if (!data) {
      return NextResponse.json({
        success: true,
        online: false,
        lastSeen: null,
        message: "No telemetry data received yet.",
      });
    }

    // Calculate how long ago the last telemetry was received
    const lastSeenTime = new Date(data.created_at).getTime();
    const currentTime = Date.now();
    const timeSinceLastSeen = currentTime - lastSeenTime;

    // Determine whether the machine is online
    const online = timeSinceLastSeen <= ONLINE_THRESHOLD_MS;

    return NextResponse.json({
      success: true,
      online,
      lastSeen: data.created_at,
      secondsSinceLastSeen: Math.floor(timeSinceLastSeen / 1000),
      message: online
        ? "AgriDrill machine is online."
        : "AgriDrill machine appears to be offline.",
    });
  } catch (error) {
    console.error("Status API error:", error);

    return NextResponse.json(
      {
        success: false,
        online: false,
        error: "Unable to determine machine status.",
      },
      { status: 500 }
    );
  }
}