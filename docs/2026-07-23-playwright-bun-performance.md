# Playwright, Bun, and E2E performance

**Date:** 2026-07-23

## Conclusion

Keep `tmpdir()` from `node:os` and `join()` from `node:path` in
[`playwright.config.ts`](../playwright.config.ts). Bun marks both modules fully
implemented with 100% of the corresponding Node.js test suites passing
([Bun Node.js compatibility](https://bun.com/docs/runtime/nodejs-compat#node-os)).
Those functions run while Playwright loads its configuration, not in the browser-test hot
path, so changing them is not a credible suite-level optimization.

`Bun.resolveSync()` is not a path-joining API. It resolves a module specifier as though it
were imported from a parent path and throws a `ResolveMessage` when resolution fails
([Bun API reference](https://bun.com/reference/bun/resolveSync)). It is therefore the
wrong operation for building an artifact directory path.

The meaningful speed levers are Playwright concurrency, reusing an already-running local
server, and trace policy. A conservative first experiment is to keep
`fullyParallel: false`, remove the global one-worker bottleneck, and use
`reuseExistingServer: !process.env.CI`. Benchmark that before considering test-level
parallelism.

Local benchmarks on this repository confirmed that ordering. The current one-worker
configuration took 58.61 seconds. File-level parallelism with five workers completed
twice without failures in 29.96 and 27.23 seconds. Two file-level workers took 37.95
seconds and two fully parallel workers took 37.60 seconds, so test-level parallelism
provided no meaningful extra gain. Forcing only the Next.js server onto Bun took 58.28
seconds at one worker, which is indistinguishable from the Node-backed baseline.

After filtering device-ineligible tests before scheduling, the final configuration passed
all 51 intended tests in 26.21 seconds locally with five workers and 34.45 seconds in
CI mode with two workers. Compared with the 58.61-second baseline, those are measured
wall-time reductions of roughly 55% locally and 41% in CI mode.

## What “using Bun” currently means

The repository already uses Bun for dependency installation and package-script startup:
[`package.json`](../package.json) defines `"test:e2e": "playwright test"`, and CI invokes
it with `bun run test:e2e`.

That does **not** make Playwright run in Bun's JavaScript runtime. Bun documents that
`bun run` executes package scripts in a subshell and respects a locally installed CLI's
`#!/usr/bin/env node` shebang by default; `--bun` is the explicit opt-in that overrides
the shebang ([Bun runtime](https://bun.com/docs/runtime#run-a-package-json-script)).
The installed Playwright CLI has that Node shebang. Playwright's own installation page
documents Node.js as the supported JavaScript runtime and lists supported Node versions;
its install/run instructions cover npm, Yarn, and pnpm, not a Bun runtime
([Playwright installation](https://playwright.dev/docs/intro#system-requirements)).

This division is useful:

- `bun install`, `bunx playwright install`, and `bun run test:e2e` can remain the package
  manager/package-runner interface.
- Playwright Test itself should remain Node-backed unless Playwright officially adds Bun
  runtime support and this suite passes under it.
- The `node:os` and `node:path` imports are also correct if a file is run by Bun, because
  Bun implements those compatibility modules.

A local discovery smoke check confirmed the distinction:

- `bun run test:e2e -- --list` succeeded and found 77 tests in 3 files.
- `bun --bun run test:e2e -- --list` failed discovery with aggregate build errors and no
  tests. The E2E files also deliberately guard their Playwright declarations with
  `if (!("Bun" in globalThis))`, so forcing Bun currently opts out of the suite.

A separate minimal, browser-free Playwright smoke test did start under forced Bun and
finished about 0.4 seconds sooner in a single run. That only shows that the CLI can boot;
it does not establish support for this browser suite, and the possible startup saving is
tiny beside the measured 58-second suite runtime.

Bun does officially document forcing the **Next.js** CLI and production server onto the
Bun runtime with `bun --bun` or Bun-prefixed package scripts
([Bun's Next.js guide](https://bun.com/docs/guides/ecosystem/nextjs#update-scripts-in-package-json)).
That is separate from Playwright support and should be benchmarked as a Next.js runtime
change, not folded into a Playwright-config cleanup.

## Ranked Playwright speed levers

### 1. Raise `workers` before enabling `fullyParallel`

The current `workers: 1` disables all parallelism. Playwright otherwise runs test files
in parallel while preserving declaration order inside each file; workers are independent
OS processes and each starts its own browser
([Playwright parallelism](https://playwright.dev/docs/test-parallel)).

With the current project filters, discovery produces five schedulable file/project groups:
the two non-Safari files under each Chromium project, plus the Safari-only file. Five
workers can overlap all of those groups without changing the ordering inside a file. This
is the highest-confidence performance change.

The local machine exposes 10 logical CPUs, so Playwright's 50% default gives the five
workers used in the successful benchmarks. Two workers also passed the complete filtered
suite in CI mode:

```ts
workers: process.env.CI ? 2 : "50%",
fullyParallel: false,
```

More workers are not automatically faster because every worker starts a browser and
competes for CPU and memory. The two-worker CI policy should still be confirmed by the
remote GitHub Actions run after shipping.

### 2. Filter device-ineligible tests before runtime

The current project matrix discovers 77 test instances but executes 51; 26 are skipped
inside test bodies. Desktop Chromium executes 33 of 36, mobile Chromium executes only 13
of 36, and iPhone WebKit executes all 5. Because Playwright prepares fixtures requested by
the test before entering its body, a test that asks for `page` and then calls `test.skip()`
still pays for an isolated browser context and page
([Playwright fixtures](https://playwright.dev/docs/test-fixtures#using-a-fixture)).

Tag desktop-only and mobile-only tests, then use each project's `grepInvert`, or split the
large mixed files into shared, desktop, and mobile specs with project-level `testMatch`.
Either approach removes the 26 ineligible instances from scheduling without reducing
coverage.

### 3. Reuse a local server, but keep CI isolated

`reuseExistingServer: true` makes Playwright use a server already listening at the
configured URL, while `false` throws when that URL is occupied. Playwright documents
`!process.env.CI` as the common policy
([Playwright web server](https://playwright.dev/docs/test-webserver)).

```ts
reuseExistingServer: !process.env.CI,
```

This removes local cold-start time only when a matching server is already running. It does
not speed a clean CI job, and the developer must avoid testing a stale build.

### 4. Choose trace cost deliberately

`retain-on-failure` records every test and deletes the trace after a success. Playwright
recommends `on-first-retry` on CI, while explicitly recommending `retain-on-failure` when
retries are disabled
([Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer#tracing-on-ci)).

Because the current suite has no configured retries, keeping `retain-on-failure` preserves
failure diagnostics. Moving to `on-first-retry` only makes sense together with a deliberate
CI retry policy, for example `retries: 1`; otherwise no trace will be produced. It reduces
happy-path recording work but changes failure/flakiness semantics, so it is not a free
performance edit.

The local full run with tracing disabled took 59.45 seconds and exposed one functional
flake; a stable focused comparison was 16.55 seconds with the current trace policy versus
16.83 seconds with tracing off. There is no measured wall-time reason to trade away the
current first-failure diagnostics.

### 5. Keep `fullyParallel: false`

`fullyParallel: true` lets tests inside the same file run in separate workers. It can
improve load balancing, especially for large files, but it also increases browser startup,
resource contention, and exposure to shared-state assumptions
([Playwright parallelism](https://playwright.dev/docs/test-parallel#parallelize-tests-in-a-single-file)).
The measured two-worker runs were effectively equal with and without this option, so keep
it `false` unless future test organization leaves too few file-level groups to occupy the
available workers.

### 6. Use workflow selection for larger savings

All Playwright projects run by default, and projects are the supported mechanism for
browser/device matrices and filtered subsets
([Playwright projects](https://playwright.dev/docs/test-projects)). If pull requests do not
need the entire desktop Chromium, mobile Chromium, and Safari contract matrix every time,
a documented smoke/full split or CI sharding can save more time than runtime micro-tuning.
That is a coverage-policy decision, not a transparent config optimization.

## What is not worth changing for speed

- `join(tmpdir(), "exsesx-dev-playwright-results")`: correct, portable, and outside the
  expensive browser path.
- `reporter: "line"`: already lightweight.
- `testMatch`/`testIgnore` regular expressions: only three files are discovered; changing
  syntax will not materially affect the run.
- Forcing Playwright with `bun --bun`: not in Playwright's documented runtime support and
  currently fails this repository's discovery.

For any performance change, compare full-suite wall time over several clean and warm runs,
plus failure diagnostics. Bun's own benchmarking guidance recommends `hyperfine` for CLI
commands rather than drawing conclusions from a single run
([Bun benchmarking](https://bun.com/docs/project/benchmarking#benchmarking-tools)).
