# Cursor MCP

User-level MCP config: **`~/.cursor/mcp.json` only.** Never commit credentials to a repo.

Template: [examples/mcp.json.template](../examples/mcp.json.template)

## Postgres

[`@yawlabs/postgres-mcp`](https://www.npmjs.com/package/@yawlabs/postgres-mcp) via `bunx` — lets agents inspect schemas and run queries on your local DB.

### Setup

1. Merge template entries into `~/.cursor/mcp.json`.
2. Set `DATABASE_URL` from the app’s local `.env`.
3. Restart Cursor.

If `bunx` is missing from PATH, use the full path (e.g. `/opt/homebrew/bin/bunx`).

### Naming

One server per DB: `postgres-{app}-{env}` (e.g. `postgres-tilda-dev`, `postgres-tilda-staging`).

### Agent rules

- Use the MCP server that matches the environment the user means.
- Read-only by default — no writes unless the user explicitly asks on dev.

## agent-browser (browser automation)

[agent-browser](https://github.com/vercel-labs/agent-browser) — ad-hoc UI exploration, React tree/vitals, snapshots. Install CLI (`brew install agent-browser && agent-browser install`), then merge the `agent-browser` block from the template. Set `AGENT_BROWSER_ENABLE=react-devtools` for TanStack Start debugging. Same config works in Claude Desktop (`claude_desktop_config.json`).
