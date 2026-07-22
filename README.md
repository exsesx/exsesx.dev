# exsesx.dev

Personal portfolio of Oleh Vanin — live at **[exsesx.dev](https://exsesx.dev/)**.
Built with Next.js 16 and React 19, deployed on [Vercel](https://vercel.com).

![CI](https://github.com/exsesx/exsesx.dev/actions/workflows/ci.yml/badge.svg)

## Stack

- **Next.js 16.3 Preview** — App Router, React Compiler, typed routes, and experimental React View Transitions
- **React 19**, **Tailwind CSS 4**, **Base UI**, and **Lucide React**
- Native CSS motion and a tiered glass system, with refractive effects progressively enhanced where supported
- **TypeScript 7.0.2** through Next's CLI checker and **Biome** for linting and formatting
- **Bun 1.3.14** for package management and scripts

## Development

```shell
bun install
bun run dev
```

The CV endpoint (`/api/resume/pdf`) proxies a resume from RXResume and needs
`RXRESUME_API_KEY` set — copy `.env.example` to `.env` and fill it in.

## Verification

```shell
bun run biome:check
bun run mdx:check
bunx tsc --noEmit
bun test
bun run build
```

CI uses Bun 1.3.14 to run a frozen install, Biome and MDX checks, the Bun test
suite, and a production build on every push to `main` and on pull requests. The
route-motion browser contract can also be run locally with `bun run test:motion`.

Production builds use Webpack while the 16.3 preview's Turbopack build path is
avoided because it currently deadlocks during compilation in this project.

## Production

```shell
bun run build
bun run start
```

## Repo layout

- `src/app` — App Router pages for `/`, `/projects`, and `/project/[slug]`, plus the `/api/resume/pdf` endpoint
- `src/components` — shared UI and interactive client boundaries
- `src/lib` — project data and behavior contracts for routing, motion, themes, hotkeys, and security policy
- `src/styles` — global design tokens, native motion, View Transition, and tiered glass rules
- `scripts` — committed asset generators exposed as `bun run generate:favicons` and `bun run generate:social-images`; Next.js serves native metadata routes from `src/app/robots.ts` and `src/app/sitemap.ts`
- `tests/e2e` — Playwright contracts for route motion, shared controls, media behavior, and metadata routes
- `docs` — implementation invariants, Safari handoff notes, and postmortems

## Agents

See [AGENTS.md](AGENTS.md) for pull-request conventions and Vercel identifiers
used by agent workflows.
