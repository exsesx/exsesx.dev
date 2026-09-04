# Blog topic primary-source check

Checked September 4, 2026. Scope: `shadcn-ui/cn` as a timely article tied to this
repository's upgrade, with Base UI 1.8.0 as an alternative. The existing dependency
upgrade note was a lead; its local test and benchmark outcomes need separate
verification before publication.

## Editorial assessment

`cn` has the stronger focused article: familiar code, a release this week, a tiny
migration readers can recognize, and a useful distinction between a faster helper
and a faster page. A concrete migration account with measured limitations would
offer more than a release summary. Audience: developers using Tailwind 4 and the
usual `cn` wrapper. This is an editorial judgment, not evidence of audience demand.

The strongest technical tension is that the default package can reduce CPU work
while adding compressed bytes. An article can explain the choice without claiming
a visible site improvement. Keep the upstream headline attributed and put absolute
times beside ratios. Do not title the article around “30x faster website.”

## Identity, dates, and maturity

The npm package is literally `cn`, associated with `shadcn-ui/cn`, with no declared
runtime dependencies. Live registry metadata reports latest `0.2.5`, published
`2026-09-04T05:19:29.211Z`; `0.2.0` was published September 1 at
`12:17:43.869Z`. Its manifest supplies ESM and CommonJS entries, declares
`sideEffects: false`, and has `engines.node: >=20`. The README describes Node 20+
specifically as a CLI requirement. [Registry metadata](https://registry.npmjs.org/cn),
[package manifest](https://github.com/shadcn-ui/cn/blob/main/packages/cn/package.json).

The GitHub tags independently place `0.2.0` on September 1 and `0.2.5` on September
4. Version 0.2.5 fixes single definitions and readonly arrays in config extensions,
plus generated output accidentally entering content scans. This is a young release
line with recent compatibility corrections, not evidence that it is unusable.
[Tags](https://github.com/shadcn-ui/cn/tags),
[0.2.5 release](https://github.com/shadcn-ui/cn/releases/tag/cn@0.2.5).

## API and compatibility

The familiar migration is `export { cn } from "cn"` in the shared utility module.
The package also exposes `twMerge`, `twJoin`, and `clsx`. Custom configuration lives
under `cn/config`; `createTailwindMerge` becomes `createTwMerge`, and
`getDefaultConfig` becomes `defaultConfig`. `experimentalParseClassName` is
unsupported. Its documented target is Tailwind CSS 4; Tailwind 3 projects should
remain on tailwind-merge 2. Classes resembling known utilities can still be
classified as utilities. [README API and migration guidance](https://github.com/shadcn-ui/cn#coming-from-tailwind-merge).

The default entry imports precompiled tables, creates an engine, and wraps its
string merger in the clsx-compatible argument handler. The config compiler is a
separate entry, so a basic import does not include the custom-config machinery.
That supports the one-line replacement claim for a conventional wrapper, but does
not prove every application has matching behavior.
[Entry source](https://github.com/shadcn-ui/cn/blob/main/packages/cn/src/index.ts).

## What the implementation changes

The package ships lookup tables compiled from the conflict configuration. Its
engine uses typed arrays and integer conflict identifiers. The documentation
describes three caches: repeated argument tuples/sequences, complete strings
admitted after repetition, and individual class tokens. The sequence cache is
especially relevant to repeated `cn(base, variant, condition && extra)` calls.
[Implementation explanation](https://github.com/shadcn-ui/cn/blob/main/docs/how-it-works.md).

The source corroborates token memoization, two generations of whole-string cache,
argument caching, and successor prediction. Array/object arguments are resolved
before the general path can reuse results. Do not describe this as removing all
runtime work. Also avoid saying tailwind-merge interprets configuration “on every
call”: even the published comparison includes its cache-hit cases.
[Engine source](https://github.com/shadcn-ui/cn/blob/main/packages/cn/src/engine.ts).

## Benchmarks: verified method and limits

The README reports approximately 30x for stable variadic component calls, 1.9x for
warm single-string calls, and 37x geometric mean for a corpus of 144,265 calls from
58 repositories. These are maintainer results. The synthetic headline compares
roughly 320 ns with 10 ns; it does not describe complete component renders.
[Published benchmark table](https://github.com/shadcn-ui/cn#how-much-faster).

The actual harness warrants precise wording:

- Each implementation/workload gets a child process. The component worker uses
  `twMerge(clsx(...args))` versus `cn(...args)`, warms for 1.5 million calls, then
  selects the best of five blocks of 1.2 million calls. Modes cover one repeated
  site, 24 distinct sites, and duplicate tuples. These are simulated call sites.
  [Orchestrator](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/bench/bench.mjs),
  [component worker](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/bench/component-worker.mjs).
- The general single-string worker actually compares bare `twMerge` exports, not
  the clsx wrapper used in the headline. The README's umbrella label is therefore
  broader than this part of the implementation. Its cold/SSR workloads are
  generated class strings; “SSR-like” does not mean a measured server-rendered app.
  [General worker](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/bench/worker.mjs).
- The corpus runner loads harvested argument arrays, checks results against the old
  wrapper, then repeatedly replays each repository in its own process. Its worker
  warms for at least two replays and 300 ms and keeps the fastest of five blocks
  lasting at least 200 ms each. It does not boot or benchmark 58 applications.
  [Corpus runner](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/bench/corpus.mjs),
  [corpus worker](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/bench/corpus-worker.mjs).

No benchmark was rerun in this research subtask. These inspected pages do not
establish the hardware/runtime behind every published number. The first-call
claim was seen in the README, but its measurement harness was not traced here.
Local benchmarks should disclose runtime, machine, inputs, warmup, iteration count,
aggregation, and whether implementations shared a process. Page speed requires a
separate application measurement.

## Size and the optional build compiler

The official explanation reports about 10.5 KB minified+gzip for default `cn`
versus 8.6 KB for the old pair, around 1.9 KB more transferred. It reports slightly
less minified JavaScript, 26.2 versus 27.4 KB. These are approximate upstream
figures, not this site's bundle result.
[Size explanation](https://github.com/shadcn-ui/cn/blob/main/docs/how-it-works.md#size).

The size script bundles complete import graphs with esbuild, minifies to ESM for
ES2022, then uses gzip level 9. Its current absolute `cn` budget is 11,000 bytes.
A claim about transferred bytes must use compression, not unpacked npm size or
minified size alone. A build changing several dependencies cannot isolate the
effect of this swap. [Size harness](https://github.com/shadcn-ui/cn/blob/main/packages/conformance/scripts/size.mjs).

`cn build` is optional and scans source classes to generate a smaller table set.
It must run before the bundler. Unknown/unscanned groups pass through without
merging, so concatenated class names need safelisting. The docs advise against
using subset tables in published component libraries, whose consumers supply
unknown classes. Newly introduced groups during development can require a server
restart to regenerate tables. A normal import already ships compiled default
tables: “compiled” does not imply this repository installed a build step.
[Build documentation](https://github.com/shadcn-ui/cn/blob/main/docs/build-setup.md).

## Alternative: Base UI 1.8.0

Base UI 1.8.0 was released September 4. Its release includes a Combobox collection
API, functional Toast updates, `Avatar.Image keepMounted`, faster trigger mounting,
and accessibility/interaction fixes.
[Release summary](https://base-ui.com/react/overview/releases),
[1.8.0 notes](https://base-ui.com/react/overview/releases/v1-8-0).

The trigger optimization PR reports 26.9–41.2% less time for two closed-Menu mount
fixtures, 22.4% for 500 Popover triggers, and 15.4% for 500 Dialog triggers. Those
fixtures contain hundreds of instances; they do not imply this site's page gets
that much faster. The PR explains that it removes redundant context setup and
initial renders and batches subscriptions. Its measurements use production
harnesses with repeated iterations and outlier filtering.
[PR 5426](https://github.com/mui/base-ui/pull/5426).

Passive outside-press touch listeners are also verified; their handlers did not
call `preventDefault`, so passive registration removes Chrome's scrolling warning
without changing intended dismissal behavior.
[PR 5572](https://github.com/mui/base-ui/pull/5572).

Editorially, this is a good supporting example in a dependency-upgrade article.
Without a specific observed bug, profiling result, or UI example, it offers less
of a standalone narrative than the `cn` experiment.
