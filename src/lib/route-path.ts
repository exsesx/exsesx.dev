export function getRoutePathname(routePath: string) {
  try {
    return new URL(routePath, "https://exsesx.dev").pathname;
  } catch {
    return routePath.split(/[?#]/, 1)[0] ?? routePath;
  }
}
