import { type NavLinkItem } from "@/types/dashboard";

export const primaryNav: readonly NavLinkItem[] = [
  { label: "Field Analytics", route: "/magazine" },
  { label: "Session History", route: "/history" },
];

export const secondaryNav: readonly NavLinkItem[] = [
  { label: "Settings", route: "/settings" },
  { label: "Profile", route: "/profile" },
];

export const topNavLinks = ["Dashboard", "Camera"] as const;

export type TopNavLink = (typeof topNavLinks)[number];

export const topNavRoutes: Record<TopNavLink, string> = {
  Dashboard: "/dashboard",
  Camera: "/camera",
};