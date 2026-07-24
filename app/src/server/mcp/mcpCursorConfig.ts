import { ADMIN_API_TOKEN_PREFIX } from '@/server/admin/adminApiTokenPrefix.const'
import type { EnvironmentValues } from '@/server/envSchema'

/** Short, copy-paste-friendly environment label used in the MCP server name (point 5/6). */
export type McpEnvLabel = 'DEV' | 'STG' | 'PRD'

export function mcpEnvLabel(viteAppEnv: EnvironmentValues | undefined): McpEnvLabel {
  if (viteAppEnv === 'production') return 'PRD'
  if (viteAppEnv === 'staging') return 'STG'
  return 'DEV'
}

const MCP_TOKEN_PLACEHOLDER_SUFFIX = 'REPLACE_WITH_YOUR_ADMIN_API_TOKEN'
export const MCP_TOKEN_PLACEHOLDER = `${ADMIN_API_TOKEN_PREFIX}${MCP_TOKEN_PLACEHOLDER_SUFFIX}`

/**
 * Build the Cursor / Claude `mcpServers` JSON for the REMOTE MCP endpoint at `<origin>/mcp`.
 * The server is named `tilda-geo-admin--<ENV>` so multiple environments can be registered side by
 * side and the agent can tell them apart; the admin API token is carried as a Bearer header.
 */
export function buildMcpCursorConfigJson({
  envLabel,
  origin,
  apiToken = MCP_TOKEN_PLACEHOLDER,
}: {
  envLabel: McpEnvLabel
  origin: string
  apiToken?: string
}) {
  return JSON.stringify(
    {
      mcpServers: {
        [`tilda-geo-admin--${envLabel}`]: {
          url: new URL('/mcp', origin).href,
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        },
      },
    },
    null,
    2,
  )
}
