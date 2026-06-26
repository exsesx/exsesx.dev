# Repo notes

## Commits

All commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Format: `<type>: <description>`, e.g. `feat: add dark mode`, `fix: correct typo`, `chore: update deps`. Common types: `feat`, `fix`, `chore`, `refactor`, `ci`, `docs`, `style`, `test`.

## Pull requests

When creating a PR, after `gh pr create`:

1. Assign the PR to the current user: `gh pr edit <number> --add-assignee @me`. `@me` resolves to the authenticated GitHub account, so this works for any dev — do not hardcode a username. Skip only if the user specified a different assignee.
2. Apply existing labels that match the work (`gh pr edit <number> --add-label <label>`): `bug` for a bugfix, `enhancement` for a new feature, `documentation` for docs. Pick from labels already in the repo (`gh label list`) — never create new labels. Omit labels if none clearly fit.

## Vercel

Keep `.vercel/` gitignored. It is local CLI link state from `vercel link`, not shared repo configuration.

Shared Vercel identifiers for agent workflows:

- Team: `Oleh Vanin's projects`
- Team ID: `team_4WbcO0IRJbCnRskihl6moOM8`
- Project: `exsesx-dev`
- Project ID: `prj_Y0qhBm8XKdX67u1gkurVJfDtYVq0`

When a user asks for the latest Vercel deployment link, use the Vercel MCP:

1. Call `list_deployments` with the team and project IDs above.
2. Filter by `meta.githubCommitRef` when a branch-specific deployment is needed.
3. Return `inspectorUrl` for the dashboard deployment link.
4. Return `https://${url}` only when the user asks for the public preview URL.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->
