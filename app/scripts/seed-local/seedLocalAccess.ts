import { hashAdminApiToken } from '@/server/admin/adminApiTokens.server'
import { getBaseDatabaseUrl } from '@/server/database-url.server'
import db from '@/server/db.server'
import { assertLocalRestoreTarget } from '../db-pull/db-helpers'
import { LOCAL_DEV_ADMIN_API_TOKEN, LOCAL_DEV_ADMIN_API_TOKEN_NAME } from './adminApiToken.const'
import { FMC_ADMIN_USERS, LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID } from './fmcAdminUsers.const'

/**
 * Ensure known FMC admins and the deterministic local MCP token exist.
 * Shared by `bun run seed` and prisma db-pull restore cleanup.
 */
export async function seedLocalAccess() {
  const databaseUrl = getBaseDatabaseUrl()
  assertLocalRestoreTarget(databaseUrl)

  for (const user of FMC_ADMIN_USERS) {
    await db.user.upsert({
      where: { osmId: user.osmId },
      create: { ...user },
      update: { role: 'ADMIN' },
    })
  }

  const owner = await db.user.findUnique({
    where: { osmId: LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID },
    select: { id: true },
  })
  if (!owner) {
    throw new Error(
      `seedLocalAccess: missing MCP token owner osmId=${LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID}`,
    )
  }

  const hashedToken = hashAdminApiToken(LOCAL_DEV_ADMIN_API_TOKEN)
  await db.adminApiToken.upsert({
    where: { hashedToken },
    create: {
      name: LOCAL_DEV_ADMIN_API_TOKEN_NAME,
      hashedToken,
      createdById: owner.id,
    },
    update: {
      name: LOCAL_DEV_ADMIN_API_TOKEN_NAME,
      createdById: owner.id,
      revokedAt: null,
      lastUsedAt: null,
    },
  })

  process.stdout.write(
    [
      'Local access ready:',
      `  MCP token owner osmId=${LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID}`,
      `  Bearer ${LOCAL_DEV_ADMIN_API_TOKEN}`,
      '',
    ].join('\n'),
  )
}
