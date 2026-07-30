import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { ADMIN_API_TOKEN_PREFIX } from '@/server/admin/adminApiTokenPrefix.const'
import { hashAdminApiToken } from '@/server/admin/adminApiTokens.server'
import { LOCAL_DEV_ADMIN_API_TOKEN } from './adminApiToken.const'
import { FMC_ADMIN_USERS, LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID } from './fmcAdminUsers.const'

describe('seed-local constants', () => {
  test('MCP token uses the admin prefix and is hashed with SHA-256', () => {
    expect(LOCAL_DEV_ADMIN_API_TOKEN.startsWith(ADMIN_API_TOKEN_PREFIX)).toBe(true)
    expect(LOCAL_DEV_ADMIN_API_TOKEN).toBe('tildageode_admin_local_dev_mcp_only')
    expect(hashAdminApiToken(LOCAL_DEV_ADMIN_API_TOKEN)).toBe(
      createHash('sha256').update(LOCAL_DEV_ADMIN_API_TOKEN).digest('hex'),
    )
  })

  test('FMC catalog includes the MCP token owner as ADMIN', () => {
    const owner = FMC_ADMIN_USERS.find((user) => user.osmId === LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID)
    expect(owner?.role).toBe('ADMIN')
    expect(owner?.email).toBe('tobias@fixmycity.de')
    expect(FMC_ADMIN_USERS.map((user) => user.osmId).sort((a, b) => a - b)).toEqual([
      6501, 11881, 418040,
    ])
  })
})
