import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  console.log("=================================");
  console.log("OAUTH CALLBACK HIT");
  console.log("CODE RECEIVED:", !!code);
  console.log("=================================");

  if (!code) {
    console.error("OAuth callback: No code received");

    return NextResponse.redirect(
      `${origin}/?error=No+code`
    );
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Exchange OAuth code for a session.
    // The SSR client stores the session in cookies.
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error(
        "Google OAuth exchange error:",
        error
      );

      return NextResponse.redirect(
        `${origin}/?error=Authentication+failed`
      );
    }

    const user = data.user;

    console.log("=================================");
    console.log("GOOGLE AUTH SUCCESS");
    console.log("USER ID:", user.id);
    console.log("USER EMAIL:", user.email);
    console.log("=================================");

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "";

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "";

    
    const { data: sessionCheck } = await supabase.auth.getUser(); 
    console.log("AUTH.UID AT INSERT TIME:", sessionCheck?.user?.id);
    
    // Check if profile already exists.
    const {
      data: existingProfile,
      error: profileCheckError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error(
        "PROFILE CHECK ERROR:",
        profileCheckError
      );

      return NextResponse.redirect(
        `${origin}/?error=Profile+check+failed`
      );
    }

    // Create profile if it does not exist.
    if (!existingProfile) {
      const {
        data: profileData,
        error: profileInsertError,
      } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: fullName,
          email: user.email ?? "",
          phone: "",
          location: "",
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (profileInsertError) {
        console.error(
          "PROFILE INSERT ERROR:",
          profileInsertError
        );

        return NextResponse.redirect(
          `${origin}/?error=Profile+creation+failed`
        );
      }

      console.log(
        "GOOGLE PROFILE CREATED:",
        profileData
      );
    } else {
      console.log(
        "PROFILE ALREADY EXISTS:",
        user.id
      );
    }

    console.log("REDIRECTING TO DASHBOARD");

    return NextResponse.redirect(
      `${origin}/dashboard`
    );

  } catch (error) {
    console.error(
      "OAUTH CALLBACK SERVER ERROR:",
      error
    );

    return NextResponse.redirect(
      `${origin}/?error=OAuth+callback+failed`
    );
  }
}