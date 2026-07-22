import { expect, type Page, type TestInfo, test } from "@playwright/test";
import sharp from "sharp";

type ProbeAnimation = {
  animationName: string;
  computedDuration: number;
  pseudoElement: string | null;
};

type ProbeCall = {
  animations: ProbeAnimation[];
  finished?: number;
  ready?: number;
  sourceProjectMediaNames: string[];
  start: number;
  types: string[];
};

type ProbeSnapshot = {
  calls: ProbeCall[];
};

type RuntimeErrors = {
  console: string[];
  page: string[];
};

const projectTypePrefix = "project-transition-";
const runtimeErrorsByPage = new WeakMap<Page, RuntimeErrors>();

if (!("Bun" in globalThis)) {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const probe = {
        calls: [] as ProbeCall[],
        pending: [] as Promise<void>[],
      };

      Object.defineProperty(window, "__routeMotionProbe", {
        configurable: true,
        value: probe,
      });

      const original = document.startViewTransition;

      if (!original) {
        return;
      }

      document.startViewTransition = function (...args: Parameters<Document["startViewTransition"]>) {
        const call: ProbeCall = {
          animations: [],
          sourceProjectMediaNames: Array.from(document.querySelectorAll(".project-media-frame"))
            .map(element => getComputedStyle(element).viewTransitionName)
            .filter(name => name !== "none"),
          start: performance.now(),
          types: [],
        };
        probe.calls.push(call);

        const transition = original.apply(this, args);
        const ready = transition.ready.then(() => {
          call.ready = performance.now();
          call.types = Array.from(transition.types ?? []);
          call.animations = document.getAnimations().flatMap(animation => {
            const effect = animation.effect;

            if (!(effect instanceof KeyframeEffect) || !effect.pseudoElement?.startsWith("::view-transition-")) {
              return [];
            }

            const computedDuration = effect.getComputedTiming().duration;
            return [
              {
                animationName: animation instanceof CSSAnimation ? animation.animationName : "",
                computedDuration: typeof computedDuration === "number" ? computedDuration : 0,
                pseudoElement: effect.pseudoElement,
              },
            ];
          });
        });
        const finished = transition.finished.then(() => {
          call.finished = performance.now();
        });

        probe.pending.push(Promise.allSettled([ready, finished]).then(() => undefined));
        return transition;
      };
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) {
      return;
    }

    const errors = runtimeErrorsByPage.get(page) ?? { console: [], page: [] };
    const probe = await readProbe(page).catch(() => ({ calls: [] }));
    await testInfo.attach("route-motion-probe", {
      body: Buffer.from(JSON.stringify({ errors, probe }, null, 2)),
      contentType: "application/json",
    });
  });

  test.describe("route motion contract", () => {
    test("desktop project card morphs without a directional page slide", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop contract");
      const errors = collectRuntimeErrors(page);

      await page.goto("/projects");
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      const href = await card.getAttribute("href");
      expect(href).toMatch(/^\/project\//);
      await expect(page.locator(".project-media-frame").first()).toBeVisible();
      const expectedName = `project-media-project-${href?.split("/").at(-1)}`;

      await resetProbe(page);
      await Promise.all([page.waitForURL(`**${href}`), card.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(probe.calls).toHaveLength(1);
      expect(probe.calls[0]?.types.filter(type => type.startsWith(projectTypePrefix))).toHaveLength(1);
      expect(probe.calls[0]?.types).toContain("nav-forward");
      await expect(page.locator(".project-media-frame").first()).toBeVisible();
      expect(morphAnimations(probe).some(animation => animation.pseudoElement?.includes(expectedName))).toBe(true);
      expect(animationNames(probe)).not.toContain("view-slide");
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("desktop back restores projects intent and preserves header isolation", async ({
      page,
      isMobile,
    }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop contract");
      const errors = collectRuntimeErrors(page);

      await page.goto("/projects");
      await page.evaluate(() => window.scrollTo(0, 520));
      const expectedScroll = await page.evaluate(() => window.scrollY);
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).nth(2);
      const href = await card.getAttribute("href");
      expect(href).toMatch(/^\/project\//);
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);

      await resetProbe(page);
      await Promise.all([page.waitForURL("**/projects"), page.getByRole("button", { name: "Back" }).click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(probe.calls[0]?.sourceProjectMediaNames).toHaveLength(1);
      const expectedName = probe.calls[0]?.sourceProjectMediaNames[0];
      expect(expectedName).toMatch(/^project-media-project-/);
      expect(probe.calls[0]?.types).toContain("nav-back");
      expect(probe.calls[0]?.types.some(type => type.startsWith(projectTypePrefix))).toBe(true);
      expect(morphAnimationPseudoNames(probe)).toContain(expectedName);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.max(0, expectedScroll - 80));
      expect(await viewTransitionName(page.locator(".site-header-nav-frame"))).toBe("persistent-nav");
      expect(await viewTransitionName(page.locator(".site-header-fade"))).toBe("persistent-nav-fade");
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("persistent header navigation is lateral and includes Blog", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop contract");
      const errors = collectRuntimeErrors(page);

      await page.goto("/");
      await resetProbe(page);
      await Promise.all([
        page.waitForURL("**/projects"),
        page.getByRole("link", { name: "Projects", exact: true }).click(),
      ]);
      await waitForProbe(page);
      const projectsProbe = await readProbe(page);

      expect(projectsProbe.calls.flatMap(call => call.types)).toEqual([]);
      expect(animationNames(projectsProbe)).not.toContain("view-slide");

      await resetProbe(page);
      await Promise.all([page.waitForURL(/\/$/), page.getByRole("link", { name: "Home", exact: true }).click()]);
      await waitForProbe(page);
      const homeProbe = await readProbe(page);

      expect(homeProbe.calls.flatMap(call => call.types)).toEqual([]);
      expect(animationNames(homeProbe)).not.toContain("view-slide");

      await resetProbe(page);
      const blogLink = page.getByRole("link", { name: "Blog", exact: true });
      await expect(blogLink).toHaveAttribute("href", "/blog/en");
      await Promise.all([page.waitForURL("**/blog/en"), blogLink.click()]);
      await waitForProbe(page);
      const blogProbe = await readProbe(page);

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".site-nav-active-pill")).toHaveAttribute("data-active-nav", "blog");
      expect(blogProbe.calls.flatMap(call => call.types)).toEqual([]);
      expect(animationNames(blogProbe)).not.toContain("view-slide");
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(
        testInfo,
        { calls: [...projectsProbe.calls, ...blogProbe.calls, ...homeProbe.calls] },
        errors,
      );
    });

    test("brand navigation keeps the logo circular while the active pill moves Home", async ({
      page,
      isMobile,
    }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop header interaction contract");
      const errors = collectRuntimeErrors(page);
      await page.goto("/projects");
      const brand = page.getByRole("link", { name: "Oleh Vanin home" });
      const logo = page.locator(".logo-tile");
      const activePill = page.locator(".site-nav-active-pill");
      const brandBox = await brand.boundingBox();
      const logoBox = await logo.boundingBox();

      expect(brandBox).not.toBeNull();
      expect(logoBox).not.toBeNull();
      await expect(activePill).toHaveAttribute("data-active-nav", "projects");
      await resetProbe(page);

      if (!brandBox) {
        return;
      }

      await page.mouse.move(brandBox.x + brandBox.width / 2, brandBox.y + brandBox.height / 2);
      await page.mouse.down();

      const pillFrames = await activePill.evaluate(async element => {
        const frames: Array<{ activeNav: string | undefined; running: boolean; transform: string }> = [];
        const sample = () => {
          frames.push({
            activeNav: element.getAttribute("data-active-nav") ?? undefined,
            running: element.getAnimations().some(animation => animation.playState === "running"),
            transform: getComputedStyle(element).transform,
          });
        };

        sample();

        for (let frame = 0; frame < 6; frame += 1) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          sample();
        }

        return frames;
      });

      const transitionFrame = await page.screenshot({
        clip: logoBox ?? { height: 40, width: 40, x: 0, y: 0 },
      });
      const edgeContrast = await logoCornerToTopContrast(transitionFrame);
      const navigation = page.waitForURL(/\/$/);

      await page.mouse.up();
      await navigation;
      await expect(activePill).toHaveAttribute("data-active-nav", "home");
      await expect
        .poll(() => activePill.evaluate(element => getComputedStyle(element).transform))
        .toBe("matrix(1, 0, 0, 1, 0, 0)");

      await waitForProbe(page);

      expect(edgeContrast).toBeGreaterThan(36);
      expect(pillFrames.some(frame => frame.activeNav === "home")).toBe(true);
      expect(new Set(pillFrames.map(frame => frame.transform)).size).toBeGreaterThan(1);
      expect(pillFrames.some(frame => frame.running)).toBe(true);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, await readProbe(page), errors);
    });

    test("mobile project navigation has no animated view-transition pseudos", async ({ page, isMobile }, testInfo) => {
      test.skip(!isMobile, "mobile contract");
      const errors = collectRuntimeErrors(page);

      await page.goto("/projects");
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      await resetProbe(page);
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(nonZeroAnimations(probe)).toEqual([]);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("reduced-motion project navigation has no animated view-transition pseudos", async ({
      page,
      isMobile,
    }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop reduced-motion contract");
      const errors = collectRuntimeErrors(page);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/projects");
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      await resetProbe(page);
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(nonZeroAnimations(probe)).toEqual([]);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });
  });

  test.describe("adjacent project navigation", () => {
    test("Previous carries direction without project identity", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop shared-media contract");
      const errors = collectRuntimeErrors(page);
      await openDetailWithBothControls(page);
      const link = page.getByRole("link", { name: "Previous", exact: true });
      const href = await link.getAttribute("href");

      await resetProbe(page);
      await Promise.all([page.waitForURL(`**${href}`), link.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(probe.calls).toEqual([]);
      expect(morphAnimations(probe)).toEqual([]);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("Next carries direction without project identity", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop shared-media contract");
      const errors = collectRuntimeErrors(page);
      await openDetailWithBothControls(page);
      const link = page.getByRole("link", { name: "Next", exact: true });
      const href = await link.getAttribute("href");

      await resetProbe(page);
      await Promise.all([page.waitForURL(`**${href}`), link.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(probe.calls).toEqual([]);
      expect(morphAnimations(probe)).toEqual([]);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("an adjacent project card keeps its shared-media identity", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop shared-media contract");
      const errors = collectRuntimeErrors(page);
      await openDetailWithBothControls(page);
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      const href = await card.getAttribute("href");
      const expectedName = `project-media-project-${href?.split("/").at(-1)}`;

      await resetProbe(page);
      await Promise.all([page.waitForURL(`**${href}`), card.click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      const types = probe.calls.flatMap(call => call.types);
      expect(types).toContain("nav-forward");
      expect(types.filter(type => type.startsWith(projectTypePrefix))).toHaveLength(1);
      expect(morphAnimations(probe).some(animation => animation.pseudoElement?.includes(expectedName))).toBe(true);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });
  });

  test.describe("route intent seams", () => {
    test("404 Back home crosses the global root cleanly", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop route-intent contract");
      const errors = collectRuntimeErrors(page);
      await page.goto("/missing-route-for-motion-contract");
      errors.console.length = 0;

      await Promise.all([page.waitForURL(/\/$/), page.getByRole("link", { name: "Back home", exact: true }).click()]);

      await expect(page.locator("main")).toBeVisible();
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, await readProbe(page), errors);
    });

    test("Back button applies prepared scroll and transition intent", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop route-intent contract");
      const errors = collectRuntimeErrors(page);
      await page.goto("/projects");
      await page.evaluate(() => window.scrollTo(0, 520));
      const expectedScroll = await page.evaluate(() => window.scrollY);
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).nth(2);
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);

      await resetProbe(page);
      await Promise.all([page.waitForURL("**/projects"), page.getByRole("button", { name: "Back" }).click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      const types = probe.calls.flatMap(call => call.types);
      expect(types).toContain("nav-back");
      expect(types.some(type => type.startsWith(projectTypePrefix))).toBe(true);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.max(0, expectedScroll - 80));
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("Blog article Back returns to its matching localized index", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop route-intent contract");
      const errors = collectRuntimeErrors(page);
      await page.goto("/blog/en/codex-agents-v2");

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("button", { name: "Back" })).toBeEnabled();
      await page.evaluate(() => {
        window.sessionStorage.setItem("exsesx.previousRoute", JSON.stringify({ path: "/blog/uk", scrollY: 0 }));
      });

      await resetProbe(page);
      await Promise.all([page.waitForURL("**/blog/en"), page.getByRole("button", { name: "Back" }).click()]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      if (probe.calls.length > 0) {
        expect(probe.calls.flatMap(call => call.types)).toContain("nav-back");
      }
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1, name: "Notes from the workbench" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("aria-current", "page");
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });

    test("g h performs lateral hotkey navigation without transition types", async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), "desktop hotkeys contract");
      const errors = collectRuntimeErrors(page);
      await page.goto("/projects");
      await expect(page.getByRole("button", { name: "Toggle keyboard shortcuts" })).toBeVisible();
      await resetProbe(page);

      await page.keyboard.press("g");
      await Promise.all([page.waitForURL(/\/$/), page.keyboard.press("h")]);
      await waitForProbe(page);

      const probe = await readProbe(page);
      expect(probe.calls.flatMap(call => call.types)).toEqual([]);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, probe, errors);
    });
  });

  test.describe("hotkey hint continuity", () => {
    test("keeps a visible corner surface while Escape cancels a pending chord", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "desktop hotkeys contract");
      await page.goto("/");
      await expect(page.getByRole("button", { name: "Toggle keyboard shortcuts" })).toBeVisible();
      const cornerHint = page.locator(".hotkeys-corner-hint");
      const idleWidth = await cornerHint.evaluate(element => element.getBoundingClientRect().width);

      await page.keyboard.press("g");
      await expect(page.locator('.sr-only[aria-live="polite"]')).toHaveText("g pressed; awaiting next shortcut key");
      const pendingWidth = await cornerHint.evaluate(element => element.getBoundingClientRect().width);
      expect(Math.abs(pendingWidth - idleWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator(".hotkeys-corner-state:not(.hotkeys-chord-waiting)")).toHaveCSS("opacity", "0");

      const frameSamples = await page.evaluate(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));

        const samples: Array<{ pendingKeyCount: number; pendingOpacity: number; surfaceOpacity: number }> = [];

        for (let frame = 0; frame < 8; frame += 1) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          const opacities = Array.from(
            document.querySelectorAll<HTMLElement>(".hotkeys-corner-hint, .hotkeys-chord-waiting"),
          ).map(element => Number.parseFloat(getComputedStyle(element).opacity));
          const pendingLayer = document.querySelector<HTMLElement>(".hotkeys-chord-waiting");

          samples.push({
            pendingKeyCount: pendingLayer?.querySelectorAll(".hotkeys-trigger-key").length ?? 0,
            pendingOpacity: pendingLayer ? Number.parseFloat(getComputedStyle(pendingLayer).opacity) : 0,
            surfaceOpacity: Math.max(0, ...opacities),
          });
        }

        return samples;
      });

      expect(Math.min(...frameSamples.map(sample => sample.surfaceOpacity))).toBeGreaterThanOrEqual(0.95);
      expect(
        frameSamples.filter(sample => sample.pendingOpacity > 0.01).every(sample => sample.pendingKeyCount > 0),
      ).toBe(true);

      const interruptedSamples = await page.evaluate(async () => {
        const samples: Array<{ contentOpacity: number; pendingKeyCount: number; pendingOpacity: number }> = [];

        function sampleContent() {
          const idleLayer = document.querySelector<HTMLElement>(".hotkeys-corner-state:not(.hotkeys-chord-waiting)");
          const pendingLayer = document.querySelector<HTMLElement>(".hotkeys-chord-waiting");
          const idleOpacity = idleLayer ? Number.parseFloat(getComputedStyle(idleLayer).opacity) : 0;
          const pendingOpacity = pendingLayer ? Number.parseFloat(getComputedStyle(pendingLayer).opacity) : 0;

          samples.push({
            contentOpacity: idleOpacity + pendingOpacity,
            pendingKeyCount: pendingLayer?.querySelectorAll(".hotkeys-trigger-key").length ?? 0,
            pendingOpacity,
          });
        }

        for (let cycle = 0; cycle < 6; cycle += 1) {
          window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "g" }));
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          sampleContent();
          window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));

          for (let frame = 0; frame < 2; frame += 1) {
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            sampleContent();
          }
        }

        return samples;
      });

      expect(Math.min(...interruptedSamples.map(sample => sample.contentOpacity))).toBeGreaterThanOrEqual(0.95);
      expect(Math.max(...interruptedSamples.map(sample => sample.contentOpacity))).toBeLessThanOrEqual(1.05);
      expect(
        interruptedSamples.filter(sample => sample.pendingOpacity > 0.01).every(sample => sample.pendingKeyCount > 0),
      ).toBe(true);
    });
  });

  test.describe("back chip geometry", () => {
    test("folds the back arrow in and out on the live element without snapshot layers", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "desktop back-arrow motion contract");
      await page.goto("/projects");
      expect((await measureHeaderGeometry(page)).back.layoutWidth).toBeLessThanOrEqual(1);
      await resetProbe(page);

      await startBackChipFoldSampler(page);
      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);
      await expect.poll(async () => (await readBackChipFoldSamples(page)).finalWidth).toBeGreaterThanOrEqual(39);

      const unfold = await readBackChipFoldSamples(page);
      expect(unfold.sawFoldTransition || unfold.sawIntermediateWidth).toBe(true);
      // the chip must never become its own snapshot: it sits above the frozen
      // persistent-nav group and ends up overlapping the brand logo there
      expect(
        nonZeroAnimations(await readProbe(page)).filter(animation =>
          animation.pseudoElement?.includes("nav-back-button"),
        ),
      ).toHaveLength(0);

      await resetProbe(page);
      await startBackChipFoldSampler(page);
      await Promise.all([page.waitForURL("**/projects"), page.keyboard.press("Escape")]);
      await waitForProbe(page);
      await expect.poll(async () => (await readBackChipFoldSamples(page)).finalWidth).toBeLessThanOrEqual(1);

      const fold = await readBackChipFoldSamples(page);
      expect(fold.sawFoldTransition || fold.sawIntermediateWidth).toBe(true);
      expect(
        nonZeroAnimations(await readProbe(page)).filter(animation =>
          animation.pseudoElement?.includes("nav-back-button"),
        ),
      ).toHaveLength(0);
    });

    test("collapses the inactive slot and restores it on detail routes", async ({ page }, testInfo) => {
      const errors = collectRuntimeErrors(page);
      await page.goto("/projects");
      const backButton = page.getByRole("button", { name: "Back", includeHidden: true });
      const initial = await measureHeaderGeometry(page);

      await expect(backButton).toBeDisabled();
      await expect(backButton).toHaveAttribute("aria-hidden", "true");
      await expect(backButton).toHaveCSS("opacity", "0");
      await expect(backButton).toHaveCSS("pointer-events", "none");
      expect(initial.back.layoutWidth).toBeLessThanOrEqual(1);
      expect(
        await backButton.evaluate(element => {
          const box = element.getBoundingClientRect();
          const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return target === element || (target !== null && element.contains(target));
        }),
      ).toBe(false);

      const card = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      await Promise.all([page.waitForURL(/\/project\//), card.click()]);
      await waitForProbe(page);
      await expect(backButton).toBeEnabled();
      await expect(backButton).toHaveCSS("opacity", "1");
      expect(await backButton.getAttribute("aria-hidden")).toBeNull();
      await expect.poll(async () => (await measureHeaderGeometry(page)).back.width).toBeGreaterThanOrEqual(39.9);
      const active = await measureHeaderGeometry(page);

      expect(active.back.width).toBeGreaterThanOrEqual(39.9);
      expect(active.back.height).toBeGreaterThanOrEqual(40);
      await expect(page.locator("header[data-safari-chrome-sample]")).toHaveAttribute(
        "data-safari-chrome-sample",
        "true",
      );
      expect(await viewTransitionName(page.locator(".site-header-nav-frame"))).toBe("persistent-nav");
      expect(await viewTransitionName(page.locator(".site-header-fade"))).toBe("persistent-nav-fade");

      await Promise.all([page.waitForURL("**/projects"), backButton.click()]);
      await expect(backButton).toBeDisabled();
      await expect(backButton).toHaveAttribute("aria-hidden", "true");
      await expect(backButton).toHaveCSS("opacity", "0");
      await expect.poll(async () => (await measureHeaderGeometry(page)).back.layoutWidth).toBeLessThanOrEqual(1);
      const restored = await measureHeaderGeometry(page);
      expect(restored.back.layoutWidth).toBeLessThanOrEqual(1);
      expect(Math.abs(restored.switcher.centerX - initial.switcher.centerX)).toBeLessThanOrEqual(1);
      expect(Math.abs(restored.brand.x - initial.brand.x)).toBeLessThanOrEqual(1);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/projects");
      const reducedInitial = await measureHeaderGeometry(page);
      const reducedCard = page.getByRole("link", { name: /^View .+ project details$/ }).first();
      await Promise.all([page.waitForURL(/\/project\//), reducedCard.click()]);
      await waitForProbe(page);
      const reducedActive = await measureHeaderGeometry(page);

      await expect(backButton).toBeEnabled();
      expect(await backButton.getAttribute("aria-hidden")).toBeNull();
      await expect(backButton).toHaveCSS("opacity", "1");
      expect(reducedActive.back.layoutWidth).toBeGreaterThanOrEqual(40);
      await expect(page.locator("header[data-safari-chrome-sample]")).toHaveAttribute(
        "data-safari-chrome-sample",
        "true",
      );
      expect(await viewTransitionName(page.locator(".site-header-nav-frame"))).toBe("persistent-nav");
      expect(await viewTransitionName(page.locator(".site-header-fade"))).toBe("persistent-nav-fade");
      const reducedDurations = await backButton.evaluate(element =>
        getComputedStyle(element).transitionDuration.split(","),
      );
      expect(reducedDurations.every(duration => Number.parseFloat(duration) <= 0.00001)).toBe(true);
      expect(
        await backButton.evaluate(
          element => element.getAnimations().filter(animation => animation.playState === "running").length,
        ),
      ).toBe(0);

      await Promise.all([page.waitForURL("**/projects"), backButton.click()]);
      await expect(backButton).toBeDisabled();
      await expect(backButton).toHaveAttribute("aria-hidden", "true");
      await expect(backButton).toHaveCSS("opacity", "0");
      await expect(backButton).toHaveCSS("pointer-events", "none");
      const reducedRestored = await measureHeaderGeometry(page);
      expect(reducedRestored.back.layoutWidth).toBeLessThanOrEqual(1);
      expect(Math.abs(reducedRestored.switcher.centerX - reducedInitial.switcher.centerX)).toBeLessThanOrEqual(1);
      expect(Math.abs(reducedRestored.brand.x - reducedInitial.brand.x)).toBeLessThanOrEqual(1);
      expectRuntimeClean(errors);
      await attachFailureDiagnostics(testInfo, await readProbe(page), errors);
    });
  });
}

function collectRuntimeErrors(page: Page): RuntimeErrors {
  const errors: RuntimeErrors = { console: [], page: [] };
  runtimeErrorsByPage.set(page, errors);
  page.on("console", message => {
    if (message.type() === "error") {
      errors.console.push(message.text());
    }
  });
  page.on("pageerror", error => errors.page.push(error.message));
  return errors;
}

function expectRuntimeClean(errors: RuntimeErrors) {
  expect(errors.console, "console errors, including hydration and duplicate ViewTransition names").toEqual([]);
  expect(errors.page, "uncaught page errors").toEqual([]);
}

async function resetProbe(page: Page) {
  await page.evaluate(() => {
    const probe = window.__routeMotionProbe;
    probe.calls.length = 0;
    probe.pending.length = 0;
  });
}

async function waitForProbe(page: Page) {
  await page.evaluate(async () => {
    const probe = window.__routeMotionProbe;
    await Promise.all(probe.pending);
  });
}

async function logoCornerToTopContrast(image: Buffer) {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sample = (centerX: number, centerY: number) => {
    const radius = 2;
    const totals = [0, 0, 0];
    let count = 0;

    for (let y = Math.max(0, centerY - radius); y <= Math.min(info.height - 1, centerY + radius); y += 1) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(info.width - 1, centerX + radius); x += 1) {
        const offset = (y * info.width + x) * info.channels;
        totals[0] += data[offset] ?? 0;
        totals[1] += data[offset + 1] ?? 0;
        totals[2] += data[offset + 2] ?? 0;
        count += 1;
      }
    }

    return totals.map(total => total / count);
  };
  const corner = sample(3, 3);
  const top = sample(Math.floor(info.width / 2), 4);

  return Math.sqrt(corner.reduce((sum, channel, index) => sum + (channel - (top[index] ?? 0)) ** 2, 0));
}

async function readProbe(page: Page): Promise<ProbeSnapshot> {
  return page.evaluate(() => ({ calls: window.__routeMotionProbe.calls }));
}

/* The fold happens on the live element (a width transition inside the frozen
   persistent-nav snapshot), so the view-transition probe can't see it; sample
   the chip across frames instead, starting before the navigation fires. */
async function startBackChipFoldSampler(page: Page) {
  await page.evaluate(() => {
    const chip = document.querySelector<HTMLElement>(".nav-back-button");

    if (!chip) {
      throw new Error("Missing fold sampler target: .nav-back-button");
    }

    const samples: BackChipFoldSample[] = [];
    window.__backChipFoldSamples = samples;

    function sample() {
      const folding = chip
        ? chip.getAnimations().some(animation => {
            if (!(animation instanceof CSSTransition) || animation.playState !== "running") {
              return false;
            }

            return ["flex-basis", "inline-size", "width"].includes(animation.transitionProperty);
          })
        : false;

      samples.push({ folding, width: chip?.getBoundingClientRect().width ?? 0 });

      if (samples.length < 300) {
        requestAnimationFrame(sample);
      }
    }

    requestAnimationFrame(sample);
  });
}

async function readBackChipFoldSamples(page: Page) {
  return page.evaluate(() => {
    const samples = window.__backChipFoldSamples ?? [];

    return {
      finalWidth: samples.at(-1)?.width ?? -1,
      sawFoldTransition: samples.some(sample => sample.folding),
      sawIntermediateWidth: samples.some(sample => sample.width > 2 && sample.width < 38),
    };
  });
}

async function viewTransitionName(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate(element => getComputedStyle(element).viewTransitionName);
}

async function openDetailWithBothControls(page: Page) {
  await page.goto("/projects");
  const card = page.getByRole("link", { name: /^View .+ project details$/ }).nth(1);
  await Promise.all([page.waitForURL(/\/project\//), card.click()]);
  await waitForProbe(page);
  await expect(page.getByRole("link", { name: "Previous", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next", exact: true })).toBeVisible();
}

async function measureHeaderGeometry(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      const box = element?.getBoundingClientRect();

      if (!element || !box) {
        throw new Error(`Missing geometry target: ${selector}`);
      }

      return {
        centerX: box.x + box.width / 2,
        height: box.height,
        layoutWidth: element.offsetWidth,
        width: box.width,
        x: box.x,
      };
    };

    return {
      back: rect(".nav-back-button"),
      brand: rect(".site-nav-brand-link"),
      switcher: rect(".site-nav-switcher"),
    };
  });
}

function nonZeroAnimations(probe: ProbeSnapshot) {
  return probe.calls.flatMap(call => call.animations).filter(animation => animation.computedDuration > 0);
}

function morphAnimations(probe: ProbeSnapshot) {
  return nonZeroAnimations(probe).filter(animation => animation.pseudoElement?.includes("project-media-"));
}

function morphAnimationPseudoNames(probe: ProbeSnapshot) {
  return nonZeroAnimations(probe)
    .map(
      animation => animation.pseudoElement?.match(/^::view-transition-(?:group|image-pair|old|new)\(([^)]+)\)$/)?.[1],
    )
    .filter((name): name is string => name?.startsWith("project-media-") === true);
}

function animationNames(probe: ProbeSnapshot) {
  return probe.calls.flatMap(call => call.animations.map(animation => animation.animationName));
}

async function attachFailureDiagnostics(testInfo: TestInfo, probe: ProbeSnapshot, errors: RuntimeErrors) {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  await testInfo.attach("route-motion-probe", {
    body: Buffer.from(JSON.stringify({ errors, probe }, null, 2)),
    contentType: "application/json",
  });
}

type BackChipFoldSample = {
  folding: boolean;
  width: number;
};

declare global {
  interface Window {
    __backChipFoldSamples?: BackChipFoldSample[];
    __routeMotionProbe: {
      calls: ProbeCall[];
      pending: Promise<void>[];
    };
  }
}
