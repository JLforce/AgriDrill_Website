"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiLogOut, FiMenu, FiUser } from "react-icons/fi";
import { topNavLinks, topNavRoutes } from "@/constants/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MobileNavDrawer } from "@/components/dashboard/MobileNavDrawer";

interface TopNavbarProps {
  readonly pageReady: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TopNavbar({ pageReady }: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const [initials, setInitials] = useState("?");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Highlight the tab of the page the user is on.
  // Pages that are not in the tab list (profile, notifications...) keep the
  // first tab highlighted, exactly like before.
  const matchedIndex = topNavLinks.findIndex((item) => {
    const route = topNavRoutes[item];

    return pathname === route || pathname.startsWith(`${route}/`);
  });

  const activeIndex = matchedIndex === -1 ? 0 : matchedIndex;

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setInitials(getInitials(profile.full_name));
      }

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    };

    loadUser();
  }, []);

  // Close the profile menu when the user taps outside it or presses Esc.
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Stop pages with their own Esc shortcut (the camera page)
        // from also reacting while the menu is being closed.
        event.stopPropagation();
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileMenuOpen]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    router.replace("/landing");
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#f3f4f6] shadow-sm backdrop-blur transition-all duration-700 ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        {/*
          Phones (under 768px): two rows
            row 1: menu button and logo on the left, bell / avatar on the right
            row 2: the page tabs, full width
          Tablets and larger (768px and up): one row, same as the desktop design
          The menu button only exists below 1024px, where the sidebar is hidden.
        */}
        <div className="mx-auto flex w-full max-w-375 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:flex-nowrap md:gap-4 md:py-3">
          {/* MENU BUTTON + BRAND */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#334155] shadow-md transition hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-blue-200 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav-drawer"
            >
              <FiMenu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Image
              src="/agridrill-logo.png"
              alt="AgriDrill logo"
              width={36}
              height={36}
              className="rounded-lg border border-[#e5e7eb] bg-white object-contain p-1 shadow-sm"
            />
            <div className="flex flex-col justify-center">
              <span className="text-base font-bold tracking-wide text-[#334155] leading-tight">AgriDrill</span>
              <span className="text-[12px] leading-none text-[#64748b]">Mission Suite</span>
            </div>
          </div>

          {/* PAGE TABS */}
          <div className="order-3 flex w-full items-center justify-center md:order-none md:w-auto md:flex-1 md:pl-6">
            <div className="flex w-full max-w-sm items-center gap-1 overflow-x-auto rounded-full border border-[#e5e7eb] bg-white px-1.5 py-1 shadow-sm md:w-auto md:max-w-none md:gap-2 md:px-2">
              {topNavLinks.map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => router.push(topNavRoutes[item])}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex-1 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition md:flex-none ${
                      isActive ? "bg-[#334155] text-white shadow" : "text-[#334155] hover:bg-[#f3f4f6] hover:text-[#1e293b]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATUS, NOTIFICATIONS, PROFILE */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {/*
              Hidden on phones to make room for the menu button.
              Icon and dot on tablets, full text on large screens.
            */}
            <span
              className="hidden items-center gap-1.5 rounded-full border border-[#d1fae5] bg-[#f0fdf4] px-2 py-1 text-[12px] font-semibold text-[#166634] sm:flex lg:px-3"
              title="Wi-Fi | Supabase Realtime"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 13a10 10 0 0 1 14 0" />
                <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                <path d="M12 20h.01" />
                <path d="M2 8.82a15 15 0 0 1 20 0" />
              </svg>
              <span className="sr-only lg:not-sr-only">Wi-Fi | Supabase Realtime</span>
              <span className="h-2 w-2 rounded-full bg-[#16a34a] lg:ml-1" />
            </span>

            <button
              type="button"
              onClick={() => router.push("/notification")}
              className="relative flex h-11 w-11 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#64748b] shadow-md transition hover:bg-[#f3f4f6] hover:text-[#334155]"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-white bg-[#e6252f] shadow-md" />
            </button>

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e7eb] bg-white text-base font-semibold text-[#334155] shadow transition hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Open profile menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={44}
                    height={44}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-xl" role="menu">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#334155] transition hover:bg-[#f3f4f6]"
                    role="menuitem"
                  >
                    <FiUser className="h-4 w-4 text-[#64748b]" aria-hidden="true" />
                    Profile
                  </button>
                  <div className="my-2 border-t border-[#e5e7eb]" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fef2f2]"
                    role="menuitem"
                  >
                    <FiLogOut className="h-4 w-4" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/*
        Rendered next to the navbar, not inside it: the navbar uses a blur
        and a transform, and both would trap a fixed-position menu inside
        the navbar instead of covering the whole screen.
      */}
      <MobileNavDrawer isOpen={isMobileNavOpen} onClose={closeMobileNav} />
    </>
  );
}
