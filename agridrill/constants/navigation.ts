import { type NavLinkItem } from "@/types/dashboard";

export const primaryNav = [
  { label: "Field Analytics", route: "/field-analytics" },
  { label: "Operation History", route: "/operation-history" },
  { label: "Command History", route: "/command-history" },
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