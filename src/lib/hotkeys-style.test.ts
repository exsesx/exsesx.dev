import { describe, expect, test } from "bun:test";

const loaderUrl = new URL("../components/HotkeysLoader.tsx", import.meta.url);
const hotkeysUrl = new URL("../components/Hotkeys.tsx", import.meta.url);
const globalsUrl = new URL("../styles/globals.css", import.meta.url);

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ?? "";
}

describe("hotkey loading and motion contracts", () => {
  test("gates the implementation chunk after initial null parity and cleans up capability listeners", async () => {
    const loader = await Bun.file(loaderUrl).text();

    expect(loader).toMatch(/dynamic\(\(\) => import\("\.\/Hotkeys"\),\s*\{\s*ssr:\s*false/);
    expect(loader).toMatch(/useState\(false\)/);
    expect(loader).toMatch(/if \(!isEnabled\) \{\s*return null;\s*\}/);
    expect(loader).toMatch(
      /shouldEnableHotkeys\(\{\s*hasHover:\s*hoverQuery\.matches,\s*hasCoarsePointer:\s*coarsePointerQuery\.matches/,
    );
    expect(loader.match(/addEventListener\("change", handleChange\)/g)).toHaveLength(2);
    expect(loader.match(/removeEventListener\("change", handleChange\)/g)).toHaveLength(2);
    expect(loader).toMatch(/return <Hotkeys \/>/);
  });

  test("keeps capability detection out of the implementation and exposes descriptive shortcut UI", async () => {
    const source = await Bun.file(hotkeysUrl).text();

    expect(source).not.toMatch(/matchMedia|shouldEnableHotkeys|isEnabled|setIsEnabled|syncEnabledState/);
    expect(source).not.toContain("getHotkeyContinuationKeys");
    expect(source).not.toMatch(/continuationKeys\.map|available next keys/);
    expect(source).toMatch(/>\s*Shortcuts\s*</);
    expect(source).toMatch(/>\s*Pending…\s*</);
    expect(source).toMatch(/<DialogTitle[^>]*>[\s\S]*?Keyboard shortcuts\s*<\/DialogTitle>/);
    expect(source).toMatch(/aria-live="polite"/);
    expect(source).toMatch(/awaiting next shortcut key/);
  });

  test("removes keyboard-driven loops, dots, entrances, and child staggering", async () => {
    const source = await Bun.file(hotkeysUrl).text();
    const css = await Bun.file(globalsUrl).text();
    const combined = `${source}\n${css}`;

    expect(combined).not.toMatch(/hotkeys-trigger-dots|hotkeys-wait-dots|hotkeys-wait-(?:ring|dot)/);
    expect(css).not.toMatch(/\.hotkeys-panel\s*>\s*\*/);
    expect(getRuleBody(css, ".dialog-backdrop")).not.toMatch(/animation:/);
    expect(getRuleBody(css, ".hotkeys-panel")).not.toMatch(/animation:/);
    expect(getRuleBody(css, ".hotkeys-chord-panel")).not.toMatch(/animation:/);
    expect(source).toMatch(/type="button"[\s\S]*?aria-label="Toggle keyboard shortcuts"/);
    expect(source.match(/aria-label="Close keyboard shortcuts"/g)).toHaveLength(1);
    expect(source).toContain('from "./ui/dialog"');
    expect(source).toMatch(/<DialogContent[\s\S]*?initialFocus=\{closeButtonRef\}/);
    expect(source).toMatch(/<DialogClose[\s\S]*?aria-label="Close keyboard shortcuts"/);
    expect(source).not.toContain("dialog.showModal()");
  });

  test("keeps one corner surface mounted while its status crossfades", async () => {
    const source = await Bun.file(hotkeysUrl).text();
    const css = await Bun.file(globalsUrl).text();
    const state = getRuleBody(css, ".hotkeys-corner-state");
    const hiddenState = getRuleBody(css, '.hotkeys-corner-state[data-visible="false"]');

    expect(source).not.toMatch(/isSequenceRendered\s*\?\s*<PendingSequence/);
    expect(source.match(/className="hotkeys-corner-hint/g)).toHaveLength(1);
    expect(source.match(/hotkeys-corner-state/g)).toHaveLength(2);
    expect(state).toMatch(/transition:\s*opacity/);
    expect(hiddenState).toMatch(/opacity:\s*0/);
    expect(hiddenState).toMatch(/pointer-events:\s*none/);
  });

  test("limits tactile motion to pointer controls", async () => {
    const source = await Bun.file(hotkeysUrl).text();
    const css = await Bun.file(globalsUrl).text();
    const pointerControl = getRuleBody(css, ".hotkeys-pointer-control");

    expect(source.match(/hotkeys-pointer-control/g)).toHaveLength(2);
    expect(pointerControl).toContain("transform var(--duration-press) var(--ease-out)");
    expect(pointerControl).toContain("opacity var(--duration-press) var(--ease-out)");
    expect(getRuleBody(css, ".hotkeys-pointer-control:active")).toContain("transform: scale(0.97)");
    expect(getRuleBody(css, ".dialog-backdrop")).not.toMatch(/transition|animation/);
    expect(getRuleBody(css, ".hotkeys-panel")).not.toMatch(/transition|animation/);
  });
});
