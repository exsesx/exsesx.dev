import { describe, expect, test } from "bun:test";

const hotkeysUrl = new URL("../components/Hotkeys.tsx", import.meta.url);
const navBackButtonUrl = new URL("../components/NavBackButton.tsx", import.meta.url);
const notFoundUrl = new URL("../components/NotFoundContent.tsx", import.meta.url);
const projectDetailUrl = new URL("../app/(site)/project/[slug]/page.tsx", import.meta.url);

describe("route navigation seams", () => {
  test("Back home publishes the shared entry-motion suppression intent", async () => {
    const source = await Bun.file(notFoundUrl).text();

    expect(source).toMatch(
      /<Link\s+href="\/"(?:(?!>)[\s\S])*?\{\.\.\.suppressEntryMotionProps\}(?:(?!>)[\s\S])*?>\s*<Home[\s\S]*?Back home/,
    );
  });

  test("NavBackButton performs one direct navigation with the prepared intent", async () => {
    const source = await Bun.file(navBackButtonUrl).text();

    expect(source).toMatch(
      /router\.push\(\s*intent\.href as Route,\s*\{\s*scroll:\s*intent\.scroll,\s*transitionTypes:\s*intent\.transitionTypes,\s*\}\s*\);/,
    );
    expect(source).not.toMatch(/\bstartTransition\b/);
  });

  test("Hotkeys performs one direct navigation with the prepared types", async () => {
    const source = await Bun.file(hotkeysUrl).text();

    expect(source).toMatch(/router\.push\(href as Route,\s*\{\s*transitionTypes\s*\}\s*\);/);
    expect(source).not.toMatch(/\bstartTransition\b/);
  });

  test("adjacent text links preserve direction without publishing project identity", async () => {
    const source = await Bun.file(projectDetailUrl).text();
    const previousLink = source.match(
      /<Link\s+href=\{getProjectPath\(previousProject\)\}[\s\S]*?>[\s\S]*?Previous[\s\S]*?<\/Link>/,
    )?.[0];
    const nextLink = source.match(
      /<Link\s+href=\{getProjectPath\(nextProject\)\}[\s\S]*?>[\s\S]*?Next[\s\S]*?<\/Link>/,
    )?.[0];

    expect(previousLink).toContain(`transitionTypes={[ROUTE_TRANSITION_TYPES.navBack]}`);
    expect(previousLink).not.toContain("getProjectRouteTransitionTypes");
    expect(previousLink).not.toContain("getProjectTransitionType");
    expect(nextLink).toContain(`transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}`);
    expect(nextLink).not.toContain("getProjectRouteTransitionTypes");
    expect(nextLink).not.toContain("getProjectTransitionType");
  });
});
