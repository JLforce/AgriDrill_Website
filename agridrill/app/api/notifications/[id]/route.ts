import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const { error } = await getSupabaseAdminClient()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("type", "obstacle");

  if (error) {
    console.error("Unable to mark notification as read:", error);
    return NextResponse.json({ error: "Unable to update notification" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
