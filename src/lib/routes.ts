import { resolveBlogBackHref } from "./blog";
import { getRoutePathname } from "./route-path";

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
  return resolveBlogBackHref(pathname) !== null;
}

export function isProjectsIndexRoutePath(routePath: string) {
  return getRoutePathname(routePath) === "/projects";
}
