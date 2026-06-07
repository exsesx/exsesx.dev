# Repo notes

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
