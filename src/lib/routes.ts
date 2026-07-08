import type { Route } from "next";

export type PrimaryNavHref = "/" | "/projects";
export type NavbarHotkeyDirection = "left" | "right";

export const PRIMARY_NAV_HREFS: readonly PrimaryNavHref[] = ["/", "/projects"];

export function getPrimaryNavHref(pathname: string): PrimaryNavHref {
  return isProjectsSectionPath(pathname) ? "/projects" : "/";
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
