# Repo notes

## React Doctor

This section does not require React Doctor to run on every task. When React Doctor is requested, triggered by a skill, or otherwise chosen by an agent, use the globally installed `react-doctor` executable from `PATH`. When skill guidance shows `npx react-doctor@latest`, preserve its arguments but replace the launcher with `react-doctor`:

- Changed-code regression check: `react-doctor --verbose --scope changed`
- Full scan: `react-doctor --verbose`
- Focused design audit: `react-doctor design --verbose`

Never invoke React Doctor through `npx`, `npm exec`, `bunx`, or another package-runner fallback. If `react-doctor` is unavailable on `PATH`, report that instead of downloading or executing a transient copy.

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
