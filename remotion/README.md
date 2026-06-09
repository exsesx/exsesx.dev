# exsesx.dev — motion presentation

Brand films for [exsesx.dev](https://exsesx.dev), built with [Remotion](https://remotion.dev)
(video as React). This is a separate workspace inside the main repo — it shares
one `node_modules` and lockfile with the site but has its own toolchain.

## What's in here

Five compositions, all driven by the same brand system ([`src/brand.ts`](src/brand.ts))
and project data, so they always stay in sync with the site:

| Composition            | Size       | Length | Use                                            |
| ---------------------- | ---------- | ------ | ---------------------------------------------- |
| `Showreel`             | 1920×1080  | ~42s   | Landscape brand film (recruiter / client)      |
| `Vertical`             | 1080×1920  | ~42s   | Same film, 9:16 social cut                     |
| `LoopBanner`           | 1080×1080  | 7s     | Seamless looping hero (embeddable)             |
| `TerminalReel`         | 1920×1080  | ~36s   | Dev-native cut: terminal + AI "thinking"       |
| `TerminalReelVertical` | 1080×1920  | ~36s   | Terminal cut, 9:16 social                       |

## Quick start

You don't need to install anything separately — the root `bun install` already
set this up. From the **repo root**:

```bash
# open the visual editor (scrub the timeline, tweak, preview)
bun run remotion:studio

# render every video to remotion/out/*.mp4
bun run remotion:render
```

Or work inside this folder directly:

```bash
cd remotion
bun run dev            # Remotion Studio at http://localhost:3000
bun run render:all     # render all 5 videos -> out/
```

## Rendering one video at a time

Each composition has its own script, so you don't have to remember IDs:

```bash
cd remotion
bun run render:showreel           # -> out/Showreel.mp4
bun run render:vertical           # -> out/Vertical.mp4
bun run render:loop               # -> out/LoopBanner.mp4
bun run render:terminal           # -> out/TerminalReel.mp4
bun run render:terminal-vertical  # -> out/TerminalReelVertical.mp4
```

Under the hood these call `remotion render <Id> out/<Id>.mp4`. To render with
options (a custom range, quality, codec), run the CLI directly:

```bash
bunx remotion render Showreel out/Showreel.mp4 --jpeg-quality 90
```

## Where to change things

- [`src/brand.ts`](src/brand.ts) — colors, project list + accents, stats,
  specialties. Edit a project here and every video updates.
- [`src/compositions/`](src/compositions) — the five top-level videos and their
  scene timing.
- [`src/scenes/`](src/scenes) — individual scenes (hero, snapshot, project cards,
  terminal console, outro).
- [`src/components/`](src/components) — reusable motion primitives (logo, pulse,
  glass cards, kinetic text, terminal chrome).
- [`public/`](public) — image and video assets, referenced with `staticFile()`.

## Notes

- **No CSS transitions or keyframes** — Remotion is frame-driven. Animate with
  `useCurrentFrame()` + `interpolate()` / `spring()` instead.
- **Linting**: `bun run check` (Biome + `tsc --noEmit`) and `bun run check:remotion`
  (ESLint with Remotion's render-safety rules, e.g. no `background-image`).
- Rendered `.mp4`s in `out/` are gitignored — regenerate them with the commands above.

See the [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals)
to go deeper.
