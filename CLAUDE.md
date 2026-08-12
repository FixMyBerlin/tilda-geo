# Claude

| Where | Use for |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Everyday coding conventions; stay in the current checkout |
| [tilda-geo-agent-workflow](.cursor/skills/tilda-geo-agent-workflow/SKILL.md) | Isolated feature worktrees, Docker/predev, processing, seed, static data, map debug — not for ordinary `develop` chats |
| [add-db-data-table](.cursor/skills/add-db-data-table/SKILL.md) | Postgres `data.*` tables via `data-schema/` (spec, import-raw, publish, `/admin/data-schema`) — not map StaticDatasets |
| [.cursor/skills/](.cursor/skills/) | Other repo-specific agent workflows |
| [.agents/skills/](.agents/skills/) | Shared FMC agent skills |
| [docs/](docs/) | Human docs; agent procedures live in skills |
| [.cursor/rules/](.cursor/rules/) | File-type rules when editing matching paths |

Do not duplicate skill or rule content in this file.
