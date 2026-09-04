# Dependency upgrade research

**Date:** 2026-09-04

**Baseline:** `package.json` and `bun.lock` before the upgrade work began

## Recommendation

Proceed with the eleven direct dependency updates and Bun 1.4.1 in one upgrade pass. I found no
runtime, peer-dependency, migration, or source-API blocker in the versions currently used by this
repository.

Two items deserve explicit verification, but neither is a reason to stop:

- Lucide 1.36.0 normalized check, cross, and plus geometry. This repository renders `Check`, `X`,
  `Plus`, and related icons, so the 1.34.0 -> 1.41.0 update can produce intentional visual drift even
  though its component API is compatible. The change is documented in the
  [Lucide 1.36.0 release](https://github.com/lucide-icons/lucide/releases/tag/1.36.0).
- The `@types/node` and `@types/react-dom` patch releases include declaration corrections rather than
  only metadata changes. Searches of this repository found no use of the affected Node FFI/VFS or
  React DOM server-streaming types, so they should be smooth here; typechecking remains the proof.

The `shadcn-ui/cn` replacement is the only higher-risk item. Its API is compatible with this codebase
and the user explicitly requested it, but `cn` is a days-old, pre-1.0 package with rapid patch
turnover. Pin it exactly, add focused class-merging tests, and keep it only if the full application
verification passes. Treat the upstream benchmark as directional rather than a promised user-visible
speedup.

## Implementation outcome

The audited upgrade, including exact-pinned `cn@0.2.5`, passed the repository's complete verification
path. `bun outdated` reported no remaining direct updates, `bun audit` found no vulnerabilities in 553
packages, and Bun 1.4.1 reproduced the lockfile with `--frozen-lockfile`. Biome, MDX validation, Next
type generation, TypeScript, 227 unit tests, the Webpack production build, a Turbopack development
smoke test, and all 63 browser tests passed. One timing-sensitive route-motion test failed once in the
first browser run, then passed three focused repetitions and the clean full rerun.

The `cn` swap has focused tests for conditional inputs, Tailwind conflict resolution, arbitrary
variants, and consumer-class precedence. A small hot-call benchmark using stable strings measured the
old `clsx` + `tailwind-merge` wrapper against `cn` over seven warmed rounds of two million calls. The
median was 81 ns versus 6 ns under Node 26.8.1 (13.1x) and 80 ns versus 3 ns under Bun 1.4.1 (25.4x).
These results cover one repeated call shape on the local machine. They do not measure page
performance or varied production inputs.

The comparable production client-chunk snapshot stayed at 117 JavaScript files. Aggregate raw size
moved from 4,806,430 to 4,806,684 bytes, while concatenated gzip streams moved from 1,408,073 to
1,410,823 bytes. Because every dependency changed in the same build, this is not an isolated `cn`
measurement; it does show that the batch is effectively flat in raw size and about 2.7 kB larger when
gzipped. The optional `cn build` compiler was not added because this repository contains dynamic class
composition and would require a separate scanning and safelist audit.

## Current latest versions

`bun outdated` found these direct updates. All other direct dependencies were current at the time of
the check.

| Package | Current | Latest stable | Assessment | Primary source |
| --- | ---: | ---: | --- | --- |
| `@base-ui/react` | 1.7.0 | 1.8.0 | Smooth minor; useful automatic performance work | [1.8.0 notes](https://base-ui.com/react/overview/releases/v1-8-0), [manifest](https://registry.npmjs.org/@base-ui%2freact/1.8.0) |
| `@next/mdx` | 16.3.3 | 16.3.4 | Smooth patch; update with `next` | [manifest](https://registry.npmjs.org/@next%2fmdx/16.3.4) |
| `lucide` | 1.34.0 | 1.41.0 | API-safe; visually inspect changed glyphs | [1.35-1.41 compare](https://github.com/lucide-icons/lucide/compare/1.34.0...1.41.0), [manifest](https://registry.npmjs.org/lucide/1.41.0) |
| `lucide-react` | 1.34.0 | 1.41.0 | Update in lockstep with `lucide`; React 19 remains supported | [manifest](https://registry.npmjs.org/lucide-react/1.41.0) |
| `morphicons` | 1.7.0 | 1.7.1 | Smooth; web artifacts are unchanged | [1.7.1 notes](https://github.com/guillermolg00/morphicons/releases/tag/v1.7.1) |
| `motion` | 13.1.1 | 13.2.0 | Smooth minor; spring implementation is smaller/faster | [changelog](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md#1320) |
| `next` | 16.3.3 | 16.3.4 | Smooth patch; fixes an AVIF regression relevant here | [16.3.4 notes](https://github.com/vercel/next.js/releases/tag/v16.3.4), [compare](https://github.com/vercel/next.js/compare/v16.3.3...v16.3.4) |
| `postcss` | 8.5.26 | 8.5.28 | Smooth patches; update the direct pin and override together | [changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md#8528) |
| `@biomejs/biome` | 2.5.10 | 2.5.12 | Smooth patches; fixed diagnostics can change check output | [2.5.11](https://biomejs.dev/internals/changelog/version/2-5-11/), [2.5.12](https://biomejs.dev/internals/changelog/version/2-5-12/) |
| `@types/node` | 26.3.0 | 26.4.1 | Smooth here; declaration changes are not used by the app | [manifest](https://registry.npmjs.org/@types%2fnode/26.4.1), [type history](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/master/types/node) |
| `@types/react-dom` | 19.2.5 | 19.2.7 | Smooth here; server API declarations changed | [manifest](https://registry.npmjs.org/@types%2freact-dom/19.2.7), [server option corrections](https://github.com/DefinitelyTyped/DefinitelyTyped/pull/75488) |

`@types/bun` remains at 1.4.0 because that is still its latest published version; it does not need to
match the Bun executable patch number. The current metadata is visible in the
[`@types/bun` registry record](https://registry.npmjs.org/@types%2fbun/latest).

## Base UI 1.8.0 and performance

This is the most valuable application-facing update in the batch. The release has no breaking-change
section or required migration. Its published peer range remains React and React DOM 17, 18, or 19,
and its Node engine remains `>=14`; this repository's React 19.2.8 setup is supported by the
[1.8.0 manifest](https://registry.npmjs.org/@base-ui%2freact/1.8.0).

The benefits relevant to this repository require no component changes:

- Base UI reduced closed popup/trigger mounting work. The maintainer benchmark in
  [PR #5426](https://github.com/mui/base-ui/pull/5426) reports roughly 27-41% lower Menu mount time
  across its cases and about 15% lower Dialog mount time. This repository uses Menu, Dialog, Drawer,
  and Tooltip primitives, so that optimization is on an active path. These are library microbenchmarks,
  not a prediction of a 15-41% faster page.
- Outside-press touch listeners are now passive, reducing the chance that touch handling blocks
  scrolling; this is an internal change from
  [PR #5572](https://github.com/mui/base-ui/pull/5572).
- [PR #5535](https://github.com/mui/base-ui/pull/5535) batches animation completion for built-in
  selection indicators and removes unnecessary Avatar enter observation. This repository uses its
  own check/morph icons and no Avatar, so those changes do not benefit its current components.
  Dialog, Drawer, Tooltip, and Toast completion callbacks do not opt into that batching.

The Select/Combobox item-lookup optimization and the new opt-in `Avatar.Image keepMounted` API do not
apply: the repository imports neither Select, Combobox, nor Avatar. They are documented in the
[1.8.0 release notes](https://base-ui.com/react/overview/releases/v1-8-0) and
[PR #5536](https://github.com/mui/base-ui/pull/5536).

The upgrade should therefore be a dependency and lockfile change only. Afterward, smoke-test Menu,
Dialog/Drawer outside interactions, Tooltip delay, and route transitions because 1.8.0 also contains
behavioral bug fixes in those areas.

## Next.js and MDX

Update `next` and `@next/mdx` together from 16.3.3 to 16.3.4. This is a patch release with fixes, not a
migration release: it restores AVIF image optimization and fixes test-mode recursion, TypeScript path
alias builds, and Turbopack cross-origin manifest behavior. The repository explicitly enables
`image/avif`, so the AVIF restoration is directly relevant. See the official
[16.3.4 release](https://github.com/vercel/next.js/releases/tag/v16.3.4) and
[16.3.3...16.3.4 diff](https://github.com/vercel/next.js/compare/v16.3.3...v16.3.4).

The engine and primary peer constraints did not move: Next still requires Node `>=20.9.0` and accepts
React 18.2 or React 19. The optional Sharp dependency moved to `^0.35.4`, which this repository already pins
directly and through its override. Those constraints can be compared in the official
[16.3.3 manifest](https://raw.githubusercontent.com/vercel/next.js/v16.3.3/packages/next/package.json)
and [16.3.4 manifest](https://raw.githubusercontent.com/vercel/next.js/v16.3.4/packages/next/package.json).

## Remaining runtime and tooling updates

### Lucide 1.41.0

Releases 1.35.0 through 1.41.0 are overwhelmingly additions and SVG corrections, with no component
API migration. The published React peer range continues through React 19. The only repository-specific
risk is visual: 1.36.0 standardized check/cross/plus sizes, and those shapes appear throughout the UI.
Later releases add icons or modify unrelated glyphs; see the official
[1.38.0](https://github.com/lucide-icons/lucide/releases/tag/1.38.0),
[1.39.0](https://github.com/lucide-icons/lucide/releases/tag/1.39.0),
[1.40.0](https://github.com/lucide-icons/lucide/releases/tag/1.40.0), and
[1.41.0](https://github.com/lucide-icons/lucide/releases/tag/1.41.0) notes. Keep `lucide` and
`lucide-react` on the same version because this repository imports from both packages.

### Motion 13.2.0

The release adds APIs that this repository does not use and reduces the size/improves the performance
of the spring implementation. Existing `useSpring`, `useReducedMotion`, and `useMotionValueEvent`
usage needs no migration. React 18 and 19 remain within the optional peer range. See the official
[Motion changelog](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md#1320) and
[13.2.0 manifest](https://registry.npmjs.org/motion/13.2.0).

### Morphicons 1.7.1

This patch only fixes React Native New Architecture output. The core, driver, adapter, and other
framework binding artifacts are unchanged from 1.7.0, so the repository's React web imports should be
byte-for-byte unaffected. See the official
[1.7.1 changelog](https://github.com/guillermolg00/morphicons/blob/main/CHANGELOG.md#171).

### PostCSS 8.5.28

8.5.27 fixed parsing, source-position, warning, and type issues; 8.5.28 corrected a resulting type
regression. There is no migration. Because `package.json` pins 8.5.26 both as a direct dependency and
under `overrides`, both values must become 8.5.28 or the graph will remain deliberately constrained.
The changes are recorded in the official
[PostCSS changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md#8528).

### Biome 2.5.12

2.5.11 and 2.5.12 are parser, formatter, linter, performance, and crash-fix releases. New rules are in
the nursery group and are not implicitly enabled by this repository's React/Next recommended domains.
Corrections to existing diagnostics can still change `biome check` output, which is why the normal
check must run after the bump. No configuration migration is listed in the official
[2.5.11](https://biomejs.dev/internals/changelog/version/2-5-11/) or
[2.5.12](https://biomejs.dev/internals/changelog/version/2-5-12/) notes. Updating `biome.jsonc`'s
editor schema URL from 2.5.7 to 2.5.12 is sensible housekeeping, but it is not required for CLI
compatibility.

### Type definitions

`@types/node` 26.4.1 incorporates Node 26.4 APIs and declaration fixes, including FFI pointer typing.
`@types/react-dom` 19.2.7 corrects server-rendering option names/types and adds a browser-bailout hook.
The repository does not reference those surfaces. The React DOM package still peers on
`@types/react ^19.2.0`, satisfied by the current 19.2.18 pin. Primary details are in the
[Node type history](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/master/types/node),
[React DOM server-rendering PR](https://github.com/DefinitelyTyped/DefinitelyTyped/pull/75488), and
[browser-bailout PR](https://github.com/DefinitelyTyped/DefinitelyTyped/pull/75489).

## Bun 1.4.1

Upgrade Bun from 1.4.0 to 1.4.1. This is a patch release with fixes and incremental performance work,
not a migration release. The headline additions include HTTP/2 server support, offline package-manager
operation, smaller bytecode-compiled executables, and Buffer/runtime improvements; see the official
[Bun 1.4.1 notes](https://bun.com/blog/bun-v1.4.1) and
[signed release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.1).

The version is currently repeated in three maintained places and should move together:

- `package.json` -> `packageManager`
- `.github/workflows/ci.yml` -> `oven-sh/setup-bun`'s `bun-version`
- `README.md` -> prerequisite and setup text

There is no separate runtime-version file. The repository's text `bun.lock` is compatible: using the
installed Bun 1.4.1 binary, `bun install --frozen-lockfile --dry-run --no-progress` completed against
the 1.4.0-era lock without changing the worktree. Bun's lockfile documentation also states that
`--frozen-lockfile` prevents lockfile writes; see the official
[lockfile guide](https://bun.com/docs/pm/lockfile). The real dependency bump will intentionally
regenerate `bun.lock` under 1.4.1, after which CI's frozen install and dedupe check should validate it.

The new `--offline` install mode should not replace the CI install: a fresh GitHub runner cannot assume
that all package artifacts are already cached. Most other 1.4.1 runtime/server benchmarks are not
directly transferable to this project, which primarily uses Bun for installs, scripts, and tests while
shipping a Next.js application.

## `shadcn-ui/cn` replacement

### Compatibility

Before the upgrade, the repository's entire abstraction was:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Application callers import that wrapper; no caller directly uses custom `tailwind-merge` configuration
or its advanced parser API. The new `cn` package presents itself as a drop-in replacement for this
common `clsx` + `tailwind-merge` combination and supports Tailwind CSS 4, which matches the current
4.3.3 setup. The implementation preserves every call site with:

```ts
export { cn } from "cn";
```

The package publishes ESM and CommonJS entry points, declares `sideEffects: false`, has zero runtime
dependencies, and requires Node 20 for its tooling. These details are in its official
[package manifest](https://github.com/shadcn-ui/cn/blob/main/packages/cn/package.json) and
[npm metadata](https://registry.npmjs.org/cn/0.2.5).

The compatibility gaps are advanced APIs this repository does not use: `experimentalParseClassName`
is unsupported, while `createTailwindMerge` and `getDefaultConfig` are exposed under the shorter names
`createTwMerge` and `defaultConfig`. The project documents those differences in its
[migration section](https://github.com/shadcn-ui/cn#coming-from-tailwind-merge).

### Performance and size

The maintainer's best-of-five isolated-process benchmark reports approximately 30x faster typical
calls, 1.9x faster warm-cache calls, a 37x geometric mean over class strings collected from 58 public
repositories, and a faster first call (about 0.4 ms versus 3.2 ms). Those numbers are documented in
the official [benchmark summary](https://github.com/shadcn-ui/cn#how-much-faster) and
[methodology](https://github.com/shadcn-ui/cn/blob/main/docs/how-it-works.md#benchmark-methodology).
They are project-authored microbenchmarks, not independent evidence of a measurable page or render
improvement for this site. Here, each saved call is measured in nanoseconds or low microseconds, and
the site has a modest number of wrapper call sites.

The README reports roughly 26 kB minified for the runtime. That figure cannot be compared directly to
npm's unpacked artifact sizes or to both currently installed packages: tree-shaking, import paths, and
compression determine the shipped client chunks. A production-build chunk comparison is required
before calling the replacement a bundle-size win. The package's optional `cn build` compiler can
remove unused utility rules, but dynamically constructed classes may require safelisting, so that is a
separate build-pipeline experiment rather than part of a drop-in swap; see the official
[`cn build` documentation](https://github.com/shadcn-ui/cn/blob/main/docs/build-setup.md).

### Maturity decision

The current release is 0.2.5. The new implementation's 0.2.x line began on 2026-09-01 and moved through
several fixes by 2026-09-04, including declaration and compatibility corrections. The version history
is visible in the official [tags](https://github.com/shadcn-ui/cn/tags),
[commit history](https://github.com/shadcn-ui/cn/commits/main/), and
[npm time metadata](https://registry.npmjs.org/cn).

Conclusion: technically compatible, but not yet as low-risk as the established-package updates. The
user chose to include it in this pass, so use the exact `0.2.5` pin, preserve the shared wrapper export,
add parity coverage for this repository's call shapes, and compare production client chunks alongside
the full checks. Do not rely on the upstream microbenchmark alone.

## Proposed upgrade boundary and verification

The safe upgrade batch is:

1. Update the eleven direct packages listed above, keeping `next`/`@next/mdx` and
   `lucide`/`lucide-react` paired.
2. Replace the shared `clsx` + `tailwind-merge` wrapper with exact-pinned `cn@0.2.5`, remove the two
   direct dependencies, and cover the repository's conditional and conflict-merging behavior.
3. Update the PostCSS override, Bun package-manager pin, CI Bun pin, README Bun references, and
   Biome schema URL.
4. Regenerate `bun.lock` with Bun 1.4.1 and retain CI's frozen-lockfile and dedupe enforcement.
5. Run `bun install --frozen-lockfile`, `bun dedupe --check`, `bun run biome:check`,
   `bun run mdx:check`, `bun run typecheck`, `bun test`, `bun run build`, and the browser test suite.
6. Add focused visual/interaction checks for Lucide check/cross/plus icons and Base UI Menu,
   Dialog/Drawer, Tooltip, and outside-press behavior.
