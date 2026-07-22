# Improvement backlog

**Updated:** 2026-06-10 · **Context:** written at the end of the `feat/liquid-glass-2` redesign slice
(liquid glass 2.0, real fonts, hero ECG, view-transition polish, react-doctor triage, remotion removal).

This is a queue of concrete, validated next steps for any agent (or human) picking the site up.
Each item is independent. Read the **invariants** section before touching anything.

---

## Invariants — do not regress these

1. **Safari 26 chrome tinting.** The solid `.site-header` band, `--safari-chrome-color`, the two
   synchronized paint paths (noflash script in `layout.tsx` + `paintSafariChromeSamples` in
   `ThemeSwitcher.tsx`), and static rendering of `/` and `/projects` are all load-bearing.
   Read `docs/safari-tinting-handoff.md` and the postmortem before touching the header, theme,
   or anything near `backdrop-filter` on sampled elements.
2. **`backdrop-filter` prefix handling.** Never hand-write `-webkit-backdrop-filter` next to the
   standard property: LightningCSS collapses the pair and emits only the `-webkit-` form, which
   Chrome rejects — Chrome silently loses all glass blur. Standard property only; the pipeline
   owns prefixing. (This bug shipped once already.)
3. **Liquid lens gating.** `backdrop-filter: url(#liquid-lens)` renders only in Chromium; other
   engines drop the whole declaration list. Keep it behind `html.glass-lens`
   (set from `navigator.userAgentData` in the noflash script).
4. **`bun run build` must keep `/` and `/projects` as `○ (Static)`.**
5. Don't run `next build` while `next dev` is serving — it can wedge the dev server's module
   graph (happened during this slice; fix is restarting dev).

## Design / visual

- **Hover specular sweep on the nav glass.** `.site-nav-glass::before` already carries a
  scroll-driven sheen; add a pointer-driven highlight (CSS `--pointer-x` like
  `InteractiveCardShell`) so the glass responds to the mouse. Desktop-only, compositor props.
- **Lens displacement tuning.** `LiquidGlassLens.tsx` — `scale="0.024"` and the map's neutral-plate
  inset (16px on a 480×128 map) are tuned by eye at 1372px. Worth revisiting on an ultrawide and
  at 768–1024px widths.
- **Projects page scroll reveals.** Home has `.scroll-rise` (CSS view-timeline); the projects grid
  and detail-page sections could adopt it. The utility is generic — add the class, nothing else.
- **`not-found.tsx`** still uses only `motion-rise`; could get the ECG/glass treatment.
- **OG / social images** (`scripts/generate-social-images.ts`) predate the Bricolage Grotesque
  headings — regenerate with the display font so share cards match the live site.
- **Hotkeys chord preview.** When `g` is pending, the bottom-left pill could preview available
  second keys (`h p t d g`) from the sequencer state instead of just showing `g …`.

## Motion / view transitions

- **Adjacent-project morph polish.** Clicking *Next* on a detail page already morphs the bottom
  compact card into the next hero (pairing falls out of `project-media-${id}` naming). Verify the
  long-travel morph on slower machines; consider shortening `--duration-move` for that path.
- **List-identity VTs** are intentionally absent (the project lists never reorder). If filtering or
  sorting is ever added to `/projects`, wrap each card in a keyed `<ViewTransition>` per the
  `vercel-react-view-transitions` skill.

## Code health

- **`.react-doctor/false-positives.md` does not exist yet.** Creating it with the validated FPs
  below lifts the score without code changes (was 56 → 67 in this slice; FPs are most of the rest):
  - `react-doctor/no-danger` + `nextjs-no-native-script` — `src/components/AppDocument.tsx` noflash script:
    static trusted content that must run pre-paint for Safari chrome sampling.
  - `react-doctor/exhaustive-deps` — `InteractiveCardShell.tsx`, `ThemeSwitcher.tsx`: cleanup reads
    a **rAF-id ref** (not a DOM node); canceling the latest frame at unmount is correct.
  - `react-doctor/no-initialize-state` — `SnapshotSpecialtyRail.tsx`: standard IntersectionObserver
    subscription.
- **`js-batch-dom-css` in `ThemeSwitcher.tsx`** was deliberately deferred: the flagged writes are
  one of the two synchronized Safari-tinting paint paths. Only touch with on-device iOS testing.
- **Deslop sweep:** `src/lib/theme.ts` still exports a few symbols only the noflash script mirrors
  conceptually; periodic `npx react-doctor@latest --verbose` runs are cheap.

## Performance / a11y

- **Lighthouse / performance trace pass** post-glass: blur surface count is unchanged from the
  pre-redesign site, but nobody has traced scrolling with the lens filter active on a low-end
  machine.
- **Glass contrast audit.** The clearer glass trades contrast for depth; `exsesx.dev` muted text
  over busy backdrops (giant headline behind nav) is the edge case. A `prefers-contrast: more`
  fallback (similar to the existing `prefers-reduced-transparency` block in `globals.css`) would
  be cheap.
- **iOS on-device verification** after any glass/theme change: top + bottom chrome tint on load and
  on toggle, nav clearance, glass intact. No simulator covers Safari's chrome sampler.

## Infra

- **react-doctor in CI** (or a husky pre-push) with `--diff --score` to catch regressions.
- **Font subsetting:** Inter + Bricolage load `latin` + `latin-ext`; if weight budget matters,
  Bricolage could drop to the 600–800 range used by headings.
