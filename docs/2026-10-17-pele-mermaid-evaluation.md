# Pele versus the current Mermaid renderer

**Date:** 2026-10-17

**Status:** initial evaluation followed by implementation on
`feature/pele-diagrams`; local verification recorded below.

## Recommendation

Pele is a good candidate for a small renderer replacement experiment. Its CSS
variables match this site's existing custom light and dark palette, and its
modular API could reduce diagram JavaScript and simplify theme changes. Keep the
current diagram frame, accessible controls, and viewBox camera. Replace the
rendering seam first, then compare every published diagram before adopting it.
This is a recommendation from the integration fit, not a measured production
performance result.

Pele consumes Mermaid syntax and implements its own parser, layout, and SVG
renderer. It is not an extra theme for Mermaid. Mermaid `theme` and
`themeVariables` colors do not carry over, and node positions, spacing, and edge
paths will change. It targets all diagram types built into Mermaid **12.1.0**,
matching this repository's installed Mermaid version. External plugins such as
ZenUML are outside that target. Source:
[compatibility](https://pele.run/compatibility).

## Integration before migration

The blog has six diagrams across three articles and their English/Ukrainian
versions. All are flowcharts. Each supplies `accTitle` and `accDescr`; existing
syntax includes a decision diamond, `<br/>` labels, and a custom node class.
Sources: [Agents V2](../src/content/blog/codex-agents-v2/en.mdx),
[Memories](../src/content/blog/codex-memories/en.mdx),
[Safari sampler](../src/content/blog/safari-26-invisible-tint-sampler/en.mdx),
and their adjacent `uk.mdx` translations.

The current renderer dynamically imports Mermaid and serializes renders because
initialization changes global configuration. Its theme adapter resolves CSS
colors, composites them into hex values, and supplies Mermaid configuration and
custom CSS. A color-theme change generates SVG again while preserving the
camera. The component already provides 1–4× zoom, controls, keyboard input, and
touch support. Sources:
[renderer](../src/components/blog/MermaidDiagram.tsx),
[theme adapter](../src/lib/mermaid-theme.ts).

## What Pele changes

| Area           | Fit and tradeoff                                                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme colors   | Bind existing palette values to `--pele-bg`, `--pele-fg`, `--pele-muted`, `--pele-line`, `--pele-surface`, `--pele-surface-alt`, `--pele-border`, and `--pele-accent`. Color changes then apply through CSS without rendering SVG again. |
| Font           | `--pele-font` sets the displayed font; layout must measure that same font. Font changes still need a render.                                                                                                                             |
| Node styling   | Pele exposes classes such as `.pele-node` and `.pele-label`, plus `data-id`. Existing Mermaid-specific selectors need adaptation. Inline `style`/`classDef` colors remain fixed across themes.                                           |
| Bundle         | `pele/core` plus `pele/diagrams/flowchart` fits the present corpus. The main `pele` entry includes every diagram type; `pele/lazy` loads types asynchronously.                                                                           |
| Rendering      | `render(source, options)` synchronously returns SVG, dimensions, type, and links. `mount()` also manages container resizing, font loading, errors, and optional zoom.                                                                    |
| Narrow screens | With `maxWidth`, layouts can wrap/rearrange. Supported horizontal diagrams can become vertical below 640px; `autoDirection: false` preserves the authored direction.                                                                     |

Sources: [theming](https://pele.run/theming), [API](https://pele.run/api),
[entry-point exports](https://github.com/obsidianmd/pele/blob/main/package.json).

Use the existing camera initially instead of installing a second set of zoom
controls. The render adapter should supply a unique `idPrefix` for each diagram
and preserve its accessibility title and description. Pele's supported label
format includes line breaks, bold, and italic, but not arbitrary HTML. JavaScript
click callbacks are ignored. Sources: [API](https://pele.run/api),
[compatibility](https://pele.run/compatibility).

## Server rendering and fonts

Build-time or server-generated SVG is possible because rendering does not require
a browser. That could remove the renderer from article visitors' JavaScript.
However, the default non-canvas measurer uses Arial advance tables for ASCII and
generic estimates for other characters. Passing `fontFamily: 'MonoLisa'` alone
does not load that font or measure its actual server-side glyphs. Browser canvas
uses the actual available font. Source:
[text measurer](https://github.com/obsidianmd/pele/blob/main/src/text/measurer.ts).

For this site's MonoLisa and Ukrainian labels, start with client rendering after
fonts are ready, or supply a verified server-side `TextMeasurer`. Compare long
labels and translated diagrams visually before choosing build-time output.
`mount()` redraws when pending web fonts load; direct `render()` requires the
caller to coordinate font readiness. Source:
[font guidance](https://pele.run/theming#fonts).

## Performance evidence and maturity

The official site claims **230 kB gzip versus 1.6 MB**, **0.05–0.3 ms versus
6–82 ms** rendering, and up to **500×** faster rendering than Mermaid. These are
upstream figures, not measurements of this Next.js application's loaded chunks,
first diagram paint, or responsiveness. Source: [Pele introduction](https://pele.run/).

The public `scripts/bench.mjs` times synchronous rendering of documentation
flowcharts and generated trees/meshes, and optionally compares
`beautiful-mermaid`. It does not itself reproduce the headline Mermaid.js
comparison or include browser fetching, DOM insertion, fonts, or paint. Source:
[benchmark script](https://github.com/obsidianmd/pele/blob/main/scripts/bench.mjs).

As checked today, npm `latest` is **1.6.0**, published **17 October 2026 at
14:23 UTC**. The package has no runtime dependencies, requires Node **20+**, and
uses the MIT license. GitHub reports repository creation on **5 October 2026**:
the public project is approximately twelve days old despite its 1.x version.
Treat the integration as a young dependency and pin the evaluated version.
Sources: [npm metadata](https://registry.npmjs.org/pele),
[package manifest](https://github.com/obsidianmd/pele/blob/main/package.json),
[repository metadata](https://api.github.com/repos/obsidianmd/pele),
[license](https://github.com/obsidianmd/pele/blob/main/LICENSE).

## Security and verification

Pele escapes text, filters URLs and styles, and bounds source length, output size,
and edges. It does not render arbitrary HTML labels or execute diagram callbacks.
Custom icon markup is trusted and inserted without filtering; render options
must remain application-controlled, and errors must be displayed as text.
`mount()` can call an application-supplied SVG sanitizer. These are upstream
design guarantees, not a security audit performed for this repository. Source:
[security documentation](https://pele.run/security).

An isolated Bun smoke test used the integrity-verified npm **Pele 1.6.0** package
in `/tmp/exsesx-pele-evaluation`, without changing application dependencies. All
six exact authored blocks rendered at `maxWidth: 760` and `maxWidth: 340`
(**12/12**). SVG output retained accessibility titles and descriptions and the
Agents V2 `focus` class. It contained no `foreignObject` or escaped literal
`<br>` label. This confirms basic rendering of the current content with fallback
text metrics, not browser font/layout equivalence.

Width is advisory: at a 340px target, the Ukrainian Memories diagram's natural
width was 430px and the Safari diagrams' natural widths were 414px (Ukrainian)
and 373px (English). The English Safari diagram changed from 1055×156 at the
760px target to 373×424 at the 340px target because its horizontal layout became
vertical. Shrinking, zoom, and a deliberate decision on `autoDirection` remain
relevant. These are local smoke-test observations, not production measurements.

A migration needs all six diagrams checked in both themes at desktop and phone
widths, including translated labels, custom classes, accessibility text, and
existing zoom interactions. Measure production diagram chunks and time to usable
SVG before claiming a visitor-facing speedup. A successful parser smoke test is
necessary but does not establish visual equivalence or browser performance.

## Implementation and verification

The migration pins Pele 1.6.0 and lazy-loads only its core and flowchart modules.
It removes Mermaid and `rehype-mermaid`; a small local rehype transform preserves
the existing `pre.mermaid` handoff without pulling in another renderer. Authored
MDX, the diagram frame, accessibility labels, and camera controls remain intact.

Pele colors now reference site CSS tokens directly, so theme switches keep the
same SVG and camera. Browser canvas measurement matches MonoLisaCode weight and
spacing, and font loading includes the actual source text for Cyrillic glyphs.
A ResizeObserver supplies available width for adaptive layout. Pele's
`responsive` output option is disabled because the existing camera CSS controls
SVG dimensions; `maxWidth` still enables layout adaptation.

Verified locally on 17 October 2026:

- 266 unit tests passed, including the renderer and MDX transform.
- 24 browser tests passed in desktop Chromium, mobile Chromium, and iPhone
  WebKit. These cover all six diagrams in both themes, font and label bounds,
  SVG viewport sizing, camera gestures, theme switches without replacing SVG,
  and desktop-to-phone resizing while zoomed.
- Production build, TypeScript, Biome, and MDX formatting checks passed.
- React Doctor's changed-code scan reported no issues; its remote score API
  was unreachable, so a numerical score was unavailable.
- The Turbopack development preview rendered the Memories diagram correctly
  during visual inspection.

No production performance or bundle-transfer comparison was performed.
