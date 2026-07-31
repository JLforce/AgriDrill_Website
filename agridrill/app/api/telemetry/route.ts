import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Read the JSON data sent to this API route
    const body = await request.json();

    // Extract telemetry values
    const {
      ir1,
      ir2,
      ir3,
      ir4,
      battery_percent,
      seed_count,
      hole_count,
      drive_speed,
    } = body;

    // Validate required telemetry values
    if (
      typeof ir1 !== "boolean" ||
      typeof ir2 !== "boolean" ||
      typeof ir3 !== "boolean" ||
      typeof ir4 !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "IR sensor values must be boolean (true or false).",
        },
        { status: 400 }
      );
    }

    // Insert telemetry data into Supabase
    const { data, error } = await supabase
      .from("telemetry_events")
      .insert({
        ir1,
        ir2,
        ir3,
        ir4,
        battery_percent:
          battery_percent !== undefined ? Number(battery_percent) : null,
        seed_count:
          seed_count !== undefined ? Number(seed_count) : null,
        hole_count:
          hole_count !== undefined ? Number(hole_count) : null,
        drive_speed:
          drive_speed !== undefined ? Number(drive_speed) : null,
      })
      .select()
      .single();

    // Check if Supabase returned an error
    if (error) {
      console.error("Supabase telemetry insert error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Successfully inserted telemetry
    return NextResponse.json(
      {
        success: true,
        message: "Telemetry saved successfully.",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Telemetry API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON request or server error.",
      },
      { status: 400 }
    );
  }
}