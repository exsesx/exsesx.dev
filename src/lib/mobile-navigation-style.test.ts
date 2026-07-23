import { describe, expect, test } from "bun:test";
import { getBackTransitionTypeProps, MOTION_ATTRIBUTES, ROUTE_TRANSITION_TYPES } from "./motion-contract";

const globalsCssUrl = new URL("../styles/globals.css", import.meta.url);
const headerUrl = new URL("../components/Header.tsx", import.meta.url);
const navBackButtonUrl = new URL("../components/NavBackButton.tsx", import.meta.url);
const appDocumentUrl = new URL("../components/AppDocument.tsx", import.meta.url);
const documentBootstrapScriptsUrl = new URL("../components/DocumentBootstrapScripts.tsx", import.meta.url);
const blogFocusProviderUrl = new URL("../components/blog/BlogFocusProvider.tsx", import.meta.url);
const nextConfigUrl = new URL("../../next.config.mts", import.meta.url);

async function readGlobalsCss() {
  return Bun.file(globalsCssUrl).text();
}

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`));

  return rule?.groups?.body ?? "";
}

function getReducedMotionActivePillRule(css: string) {
  const rule = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{(?:\s*\/\*[\s\S]*?\*\/)?\s*\.site-nav-active-pill\s*\{(?<body>[\s\S]*?)\n\s*\}\s*\n\}/,
  );

  return rule?.groups?.body ?? "";
}

function getReducedMotionBackButtonRule(css: string) {
  const rule = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.nav-back-button\s*\{(?<body>[\s\S]*?)\n\s*\}/,
  );

  return rule?.groups?.body ?? "";
}

describe("mobile navigation styles", () => {
  test("routes the shared small-screen boundary through Tailwind variants", async () => {
    const css = await readGlobalsCss();

    expect(css).not.toMatch(/@media \((?:min|max)-width: (?:639|640)px\)/);
    expect(css.match(/@variant max-sm/g)).toHaveLength(5);
    expect(css.match(/@variant sm/g)).toHaveLength(2);
  });

  test("keeps the active nav pill positioned when reduced motion removes animation", async () => {
    const css = await readGlobalsCss();
    const activePillRule = getReducedMotionActivePillRule(css);

    expect(activePillRule).not.toBe("");
    // the translate parks the pill on the active tab; reduced motion may only
    // remove the slide, never the transform itself
    expect(activePillRule).not.toMatch(/transform:/);
    expect(activePillRule).toMatch(/transition:\s*none/);
  });

  test("aligns the active pill with all three navigation destinations", async () => {
    const [css, header] = await Promise.all([readGlobalsCss(), Bun.file(headerUrl).text()]);
    const activePillRule = getRuleBody(css, ".site-nav-active-pill");
    const projectsPillRule = getRuleBody(css, '.site-nav-active-pill[data-active-nav="projects"]');
    const blogPillRule = getRuleBody(css, '.site-nav-active-pill[data-active-nav="blog"]');

    expect(header).toContain('{ href: "/blog/en", label: "Blog", icon: BookOpenText }');
    expect(header).toContain("grid-cols-[2.5rem_2.5rem_2.5rem]");
    expect(header).toContain("sm:grid-cols-3");
    expect(activePillRule).toMatch(/width:\s*calc\(\(100% - 1rem\) \/ 3\)/);
    expect(projectsPillRule).toMatch(/translate3d\(calc\(100% \+ 0\.25rem\), 0, 0\)/);
    expect(blogPillRule).toMatch(/translate3d\(calc\(200% \+ 0\.5rem\), 0, 0\)/);
    expect(css).toMatch(/@variant max-sm \{[\s\S]*?\.site-nav-active-pill\s*\{[\s\S]*?width:\s*2\.5rem/);
  });

  test("folds the back-chip slot on the live element so the brand glides with it", async () => {
    const css = await readGlobalsCss();
    const baseRule = getRuleBody(css, ".nav-back-button");
    const inactiveRule = getRuleBody(css, `.nav-back-button[${MOTION_ATTRIBUTES.activeBackButton}="false"]`);
    const reducedMotionRule = getReducedMotionBackButtonRule(css);
    const transition = baseRule.match(/transition:\s*(?<value>[\s\S]*?);/)?.groups?.value ?? "";

    expect(baseRule).toMatch(/(?:inline-size:\s*2\.5rem|width:\s*2\.5rem|flex:\s*0\s+0\s+2\.5rem)/);
    // The fold IS a layout transition, by design: the slot width animates on
    // the live element so the brand link moves with the layout instead of
    // jumping into the chip's place at the start of a route transition.
    expect(transition).toMatch(/inline-size/);
    expect(transition).toMatch(/flex-basis/);
    expect(transition).toMatch(/opacity/);
    expect(transition).toMatch(/transform/);
    expect(transition.split(",").every(segment => (segment.match(/\b\d+(?:\.\d+)?m?s\b/g) ?? []).length <= 1)).toBe(
      true,
    );
    expect(baseRule).not.toMatch(/transition-delay/);
    expect(baseRule).toMatch(/overflow:\s*hidden/);

    expect(inactiveRule).toMatch(/inline-size:\s*0/);
    expect(inactiveRule).toMatch(/flex(?:-basis)?:\s*(?:0\s+0\s+)?0/);
    expect(inactiveRule).toMatch(/border-width:\s*0/);
    expect(inactiveRule).toMatch(/opacity:\s*0/);
    expect(inactiveRule).not.toMatch(/transform|scale\(/);
    expect(inactiveRule).toMatch(/pointer-events:\s*none/);
    expect(inactiveRule).not.toMatch(/transition-delay/);

    expect(reducedMotionRule).toMatch(/transition-duration:\s*0ms/);
    expect(reducedMotionRule).toMatch(/transition-delay:\s*0ms/);
  });

  test("names the back chip's morph transition attribute for TS writers", () => {
    expect(getBackTransitionTypeProps("project-transition-project-quicklizard")).toEqual({
      [MOTION_ATTRIBUTES.backTransitionType]: "project-transition-project-quicklizard",
    });
  });

  test("keeps the back chip out of view-transition snapshot layers", async () => {
    const [css, source] = await Promise.all([readGlobalsCss(), Bun.file(navBackButtonUrl).text()]);

    // Regression guard: a named chip snapshot lives above the frozen
    // persistent-nav group, whose old image is display: none — so the brand
    // jumps into the chip's place at frame 0 and any chip snapshot overlaps
    // it (or, if its animation never matches, freezes over the logo for the
    // whole transition). The chip must stay inside the live nav and fold via
    // the CSS transition above instead.
    expect(source).not.toContain("viewTransitionName");
    expect(css).not.toMatch(/::view-transition-[a-z-]*\(nav-back-button\)/);
    expect(css).not.toMatch(/@keyframes nav-back-button-/);
  });

  test("names the route navigation transition contracts used by CSS", async () => {
    const css = await readGlobalsCss();

    expect(css).toContain(`html[${MOTION_ATTRIBUTES.viewTransitionNavigated}="true"]`);
    expect(css).toContain(`:active-view-transition-type(${ROUTE_TRANSITION_TYPES.navForward})`);
    expect(css).toContain(`:active-view-transition-type(${ROUTE_TRANSITION_TYPES.navBack})`);
  });

  test("does not put the app shell in an overflow container that disables sticky descendants", async () => {
    const [appDocument, blogFocusProvider] = await Promise.all([
      Bun.file(appDocumentUrl).text(),
      Bun.file(blogFocusProviderUrl).text(),
    ]);
    const appShell = `${appDocument}\n${blogFocusProvider}`;

    expect(appShell).not.toContain("overflow-x-hidden");
    expect(appShell).toContain("overflow-x-clip");
  });

  test("server-inserts document bootstraps outside client route rendering", async () => {
    const [appDocument, bootstrapScripts] = await Promise.all([
      Bun.file(appDocumentUrl).text(),
      Bun.file(documentBootstrapScriptsUrl).text(),
    ]);

    expect(appDocument).toContain("<DocumentBootstrapScripts />");
    expect(appDocument).not.toContain('id="noflash"');
    expect(appDocument).not.toContain('id="blog-focus-bootstrap"');
    expect(bootstrapScripts).toContain("useServerInsertedHTML");
    expect(bootstrapScripts).toContain('id="noflash"');
    expect(bootstrapScripts).toContain('id="blog-focus-bootstrap"');
    expect(bootstrapScripts).toContain("dangerouslySetInnerHTML");
  });

  test("offers a localized keyboard escape route to the main content", async () => {
    const appDocument = await Bun.file(appDocumentUrl).text();

    expect(appDocument).toContain('className="skip-to-content"');
    expect(appDocument).toContain('href="#main-content"');
    expect(appDocument).toContain('lang === "uk" ? "Перейти до основного вмісту" : "Skip to main content"');
  });

  test("keeps the Turbopack persistent build cache disabled", async () => {
    const nextConfig = await Bun.file(nextConfigUrl).text();

    // it shipped a stale compiled globals.css to production (new markup, old
    // stylesheet), which is how the nav pill broke on 2026-07-02
    expect(nextConfig).not.toMatch(/turbopackFileSystemCacheForBuild:\s*true/);
  });
});
