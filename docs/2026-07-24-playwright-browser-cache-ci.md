# Playwright browser caching in CI

**Date:** 2026-07-24

## Recommendation

Do not add a Playwright browser-binary cache as the first CI cache. It is technically
possible, but Playwright explicitly does not recommend it: restoring the browser cache
usually takes about as long as downloading the binaries, while Linux system dependencies
still have to be installed and cannot be cached
([Playwright CI](https://playwright.dev/docs/ci#caching-browsers)).

For this repository, the live CI log makes that tradeoff unusually clear:

- `bunx playwright install --with-deps chromium webkit` took about 72 seconds.
- Linux dependency setup consumed about 57 seconds.
- Browser downloads and extraction consumed about 14 seconds.
- The downloaded archives totalled about 394.4 MiB: Chromium 177 MiB, FFmpeg 2.3 MiB,
  Chromium Headless Shell 114.2 MiB, and WebKit 100.9 MiB.

A browser cache can therefore target only the final roughly 14 seconds, and it would have
to restore hundreds of megabytes to do so. The 72-second step is not evidence that a
browser cache could save 72 seconds.

Rank the next experiments as follows:

1. Cache `.next/cache`, then measure warm builds. The same CI run reported
   `No build cache found` and spent 22.9 seconds compiling. Next.js explicitly creates
   `.next/cache` for reuse between builds and documents persisting it with
   `actions/cache` on GitHub Actions
   ([Next.js CI build caching](https://nextjs.org/docs/pages/guides/ci-build-caching)).
2. Change the existing browser command to use `--only-shell`, then verify the full browser
   suite. This repository runs Chromium headlessly and does not set a Chromium `channel`.
   Playwright documents `--only-shell` specifically for that case, avoiding the full
   Chromium download while retaining Chromium Headless Shell
   ([Playwright browsers](https://playwright.dev/docs/browsers#chromium-headless-shell)).
   In the observed run, that removes the 177 MiB full-Chromium archive and roughly
   5.8 seconds of download/extraction.
3. Only then A/B test a Playwright browser cache over at least three warm runs. Keep it
   only if cache restore plus browser setup is consistently faster than the uncached
   command.
4. Separately benchmark the exact-version Playwright container if Linux dependency setup
   remains the bottleneck. The official image contains browsers and their system
   dependencies, but not the Playwright package. Playwright requires the image version
   to match the project version
   ([Playwright Docker](https://playwright.dev/docs/docker)). This shifts work to pulling
   the container image, so it is an experiment rather than a guaranteed improvement.

## Repository-specific details

[`bun.lock`](../bun.lock) resolves `@playwright/test`, `playwright`, and
`playwright-core` to 1.61.1. That release uses Chromium revision 1228, Chromium Headless
Shell revision 1228, FFmpeg revision 1011, and WebKit revision 2311. The matching official
container is `mcr.microsoft.com/playwright:v1.61.1-noble`; Microsoft publishes that exact
tag with manifest-list digest
`sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48`
([Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/artifact/mar/playwright/tag/v1.61.1-noble)).

On Linux, Playwright stores downloaded browser binaries in `~/.cache/ms-playwright`.
Playwright versions require matching browser builds, so the cache key must include the
exact Playwright version and platform
([Playwright browser binaries](https://playwright.dev/docs/browsers#managing-browser-binaries)).

The current GitHub-hosted runner image includes branded Chrome, Chromium, and Firefox,
but not Playwright's WebKit build. Reusing the runner's Chrome would change the Chromium
test target and still would not remove WebKit setup
([GitHub Ubuntu runner image](https://github.com/actions/runner-images/blob/ubuntu24/20260720.247/images/ubuntu/Ubuntu2404-Readme.md#browsers-and-drivers)).

Bun does not change Playwright's browser cache behavior. `oven-sh/setup-bun` already
caches the downloaded Bun executable by default; the live run restored its approximately
32 MiB executable cache. Its `no-cache` option controls that executable cache
([setup-bun](https://github.com/oven-sh/setup-bun#inputs)). Bun's package cache is a
different directory, `~/.bun/install/cache`
([Bun global cache](https://bun.com/docs/pm/global-cache)). Because this run installed 487
packages in 2.91 seconds, adding another package cache is lower priority than build-cache
and browser-setup experiments.

## If browser caching is still desired

Use only an exact platform, Playwright-version, and browser-set key. Do not use a broad
`restore-keys` prefix: a partial match can restore stale browser revisions, and the next
install would add the new revisions to the same cache directory.

This is an experiment shape, not the recommended default:

```yaml
- name: Resolve Playwright version
  id: playwright-version
  run: echo "version=$(bunx playwright --version | cut -d' ' -f2)" >> "$GITHUB_OUTPUT"

- name: Restore Playwright browsers
  id: playwright-browser-cache
  uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-${{ runner.arch }}-playwright-${{ steps.playwright-version.outputs.version }}-chromium-webkit-shell

- name: Install browser dependencies
  run: bunx playwright install-deps chromium webkit

- name: Ensure browser binaries
  run: bunx playwright install --only-shell chromium webkit
```

The browser-install command remains unconditional so a restored directory is checked and
any missing binaries are filled. Linux dependencies also remain unconditional because
they are outside the browser cache.

GitHub caches are immutable for a given key and are saved after a successful job on a
miss. Exact hits set `cache-hit` to `true`; partial matches from `restore-keys` do not.
The default repository cache allowance is 10 GB, entries unused for more than seven days
are removed, and older entries are evicted when the limit is reached
([GitHub dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching),
[actions/cache](https://github.com/actions/cache#cache-limits)). Those limits reinforce
keeping the browser cache exact and avoiding multiple stale browser revisions.
