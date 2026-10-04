"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { primaryNav, secondaryNav } from "@/constants/navigation";

interface MobileNavDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface DrawerItem {
  readonly label: string;
  readonly route: string;
}

// Same destinations as the desktop sidebar.
function resolveSecondaryRoute(item: DrawerItem): string {
  if (item.label === "Settings") return "/settings";
  if (item.label === "Profile") return "/profile";

  return item.route;
}

interface DrawerLinkProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}

function DrawerLink({ label, active, onClick }: DrawerLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`block min-h-12 w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm font-medium transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#111827] ${
        active
          ? "bg-[#2f3742] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(243,244,246,0.12)]"
          : "text-[#a5b1c2] hover:bg-[#1f2937] hover:text-[#d1d5db]"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Navigation menu for screens narrower than 1024px, where the desktop
 * sidebar is hidden. Slides in from the left and closes when the user taps
 * the dark background, presses Esc, chooses a page, or the screen becomes
 * wide enough for the sidebar.
 */
export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const mainItems: DrawerItem[] = [
    { label: "Dashboard", route: "/dashboard" },
    ...primaryNav.map((item) => ({
      label: item.label,
      route: item.route,
    })),
  ];

  const secondaryItems: DrawerItem[] = secondaryNav.map((item) => ({
    label: item.label,
    route: resolveSecondaryRoute({
      label: item.label,
      route: item.route,
    }),
  }));

  const isActive = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  const goTo = (route: string) => {
    onClose();
    router.push(route);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Keep the page behind the menu from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Stop pages with their own Esc shortcut (the camera page)
        // from also reacting while the menu is being closed.
        event.stopPropagation();
        onClose();
      }
    };

    // The sidebar takes over at 1024px, so close the drawer there.
    const wideScreen = window.matchMedia("(min-width: 1024px)");

    const onScreenChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    wideScreen.addEventListener("change", onScreenChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      wideScreen.removeEventListener("change", onScreenChange);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dark background */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Menu panel */}
      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-[#111827] p-3 shadow-2xl transition-[transform,visibility] duration-300 lg:hidden ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-[#0f172a] p-4">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/agridrill-logo.png"
                alt="AgriDrill logo"
                width={28}
                height={28}
                className="rounded-md border border-[#334155] bg-[#111827] object-contain p-1"
              />

              <p className="text-xl font-extrabold tracking-tight text-white">
                AgriDrill
              </p>
            </div>

            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-[#94a3b8]">
              Operator Panel
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#334155] text-[#cbd5e1] transition hover:bg-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-1">
          {mainItems.map((item) => (
            <DrawerLink
              key={item.label}
              label={item.label}
              active={isActive(item.route)}
              onClick={() => goTo(item.route)}
            />
          ))}
        </div>

        <div className="my-4 h-px bg-[#1f2937]" />

        <div className="space-y-1">
          {secondaryItems.map((item) => (
            <DrawerLink
              key={item.label}
              label={item.label}
              active={isActive(item.route)}
              onClick={() => goTo(item.route)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
