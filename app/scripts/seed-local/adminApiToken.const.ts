import { ADMIN_API_TOKEN_PREFIX } from '@/server/admin/adminApiTokenPrefix.const'

/** Deterministic local-only Admin API / MCP Bearer (installed after development-target check). */
export const LOCAL_DEV_ADMIN_API_TOKEN = `${ADMIN_API_TOKEN_PREFIX}local_dev_mcp_only` as const

export const LOCAL_DEV_ADMIN_API_TOKEN_NAME = 'Local Dev MCP' as const
