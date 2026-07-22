import type { Route } from "next";
import { isBlogLocale } from "./blog";

export type PrimaryNavHref = "/" | "/projects" | "/blog/en";
export type NavbarHotkeyDirection = "left" | "right";

export const PRIMARY_NAV_HREFS: readonly PrimaryNavHref[] = ["/", "/projects", "/blog/en"];

export function getPrimaryNavHref(pathname: string): PrimaryNavHref {
  if (isProjectsSectionPath(pathname)) {
    return "/projects";
  }

  return isBlogSectionPath(pathname) ? "/blog/en" : "/";
}

export function getAdjacentPrimaryNavHref(pathname: string, direction: NavbarHotkeyDirection): PrimaryNavHref {
  const activeHref = getPrimaryNavHref(pathname);
  const activeIndex = PRIMARY_NAV_HREFS.indexOf(activeHref);
  const offset = direction === "left" ? -1 : 1;
  const nextIndex = (activeIndex + offset + PRIMARY_NAV_HREFS.length) % PRIMARY_NAV_HREFS.length;

  return PRIMARY_NAV_HREFS[nextIndex];
}

export function isProjectsSectionPath(pathname: string) {
  return pathname === "/projects" || pathname.startsWith("/projects/") || isProjectDetailPath(pathname);
}

export function isProjectDetailPath(pathname: string) {
  return pathname.startsWith("/project/");
}

export function isBlogSectionPath(pathname: string) {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}

export function isBlogPostPath(pathname: string) {
  const segments = getRoutePathname(pathname).split("/").filter(Boolean);

  return segments[0] === "blog" && segments.length === 3 && isBlogLocale(segments[1] ?? "");
}

export function isBlogIndexRoutePath(routePath: string) {
  const segments = getRoutePathname(routePath).split("/").filter(Boolean);

  return segments[0] === "blog" && segments.length === 2 && isBlogLocale(segments[1] ?? "");
}

export function isProjectsIndexRoutePath(routePath: string) {
  return getRoutePathname(routePath) === "/projects";
}

export function getProjectsHref() {
  return "/projects" as Route;
}

function getRoutePathname(routePath: string) {
  try {
    return new URL(routePath, "https://exsesx.dev").pathname;
  } catch {
    return routePath.split(/[?#]/, 1)[0] ?? routePath;
  }
}
